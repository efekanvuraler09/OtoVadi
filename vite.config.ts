import { existsSync } from 'node:fs'
import type { IncomingMessage } from 'node:http'
import { resolve } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** Yalnızca sunucu tarafında okunan değişkenler. VITE_ öneki OLMADIĞI için istemci paketine asla girmezler. */
const SERVER_ENV_KEYS = ['GEMINI_API_KEY', 'GEMINI_MODEL'] as const

/**
 * `npm run dev` sırasında /api/* isteklerini kökteki Vercel fonksiyonlarına (api/<ad>.ts) yönlendirir;
 * böylece Akıllı Keşif yerelde de gerçek sunucu koduyla çalışır. Üretimde bu eklenti devrede değildir,
 * aynı dosyaları Vercel serverless fonksiyon olarak sunar. `vite preview`'da /api yoktur (istemci yerel eşleştirmeye düşer).
 */
function vercelApiDevServer(env: Record<string, string>): Plugin {
  return {
    name: 'otovadi:vercel-api-dev',
    apply: 'serve',
    configureServer(server) {
      for (const key of SERVER_ENV_KEYS) {
        if (env[key] && !process.env[key]) process.env[key] = env[key]
      }

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
        const route = /^\/api\/([\w-]+)\/?$/.exec(url.pathname)
        if (!route) return next()

        const sendJson = (status: number, body: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(body))
        }
        if (!existsSync(resolve(server.config.root, 'api', `${route[1]}.ts`))) {
          return sendJson(404, { error: 'not_found' })
        }

        try {
          const mod: Record<string, unknown> = await server.ssrLoadModule(`/api/${route[1]}.ts`)
          const handler = mod[req.method ?? 'GET']
          if (typeof handler !== 'function') return sendJson(405, { error: 'method_not_allowed' })

          const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
          const request = new Request(url, {
            method: req.method,
            headers: toHeaders(req),
            body: hasBody ? await readBody(req) : undefined,
          })
          const response = (await handler(request)) as Response
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (error) {
          server.config.logger.error(`[api/${route[1]}] ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`)
          sendJson(500, { error: 'dev_server_error' })
        }
      })
    },
  }
}

function toHeaders(req: IncomingMessage): Headers {
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined || key.startsWith(':')) continue
    headers.set(key, Array.isArray(value) ? value.join(', ') : value)
  }
  return headers
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  return Buffer.concat(chunks).toString('utf8')
}

export default defineConfig(({ mode }) => {
  // Önek filtresi olmadan okunur ama yalnızca SERVER_ENV_KEYS sunucu sürecine aktarılır
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), vercelApiDevServer(env)],
    css: {
      postcss: './postcss.config.js',
    },
    server: {
      host: true,
      port: 5173,
      strictPort: false,
      open: true,
    },
    preview: {
      host: true,
      port: 4173,
    },
  }
})
