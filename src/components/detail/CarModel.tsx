import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// localStorage key
const LS_KEY = 'car-light-colors';

// Renk haritası: kullanıcının prompt ile atadığı renkler
type LightColorMap = Record<string, string>;

function loadColorMap(): LightColorMap {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveColorMap(map: LightColorMap) {
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}

// Prompt karakter → hex eşleştirmesi
const PROMPT_COLOR: Record<string, string> = {
  r: '#cc0000',  // Kırmızı
  t: '#ff6600',  // Turuncu
  b: '#eef2ff',  // Buz Mavisi / Beyaz
};

interface CarModelProps {
  colorHex: string;
  isLightsOn: boolean;
}

export function CarModel({ colorHex, isLightsOn }: CarModelProps) {
  const { scene } = useGLTF('/models/tucson.glb');
  const color = useMemo(() => new THREE.Color(colorHex), [colorHex]);

  // localStorage'dan yüklenen renk haritası
  const [lightColors, setLightColors] = useState<LightColorMap>(loadColorMap);

  // ─── Ana traverse: Kaporta boyası + Far cam fiziği ───
  useEffect(() => {
    if (!scene) return;

    let paintMaterialFound = false;

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;

        if (material && material.name) {
          const name = material.name.toLowerCase();

          // Kaporta boyası
          if (
            name.includes('paint') ||
            name.includes('body') ||
            name.includes('carosserie') ||
            name.includes('metal')
          ) {
            material.color = color;
            material.needsUpdate = true;
            paintMaterialFound = true;
          }

          // Far Cam Materyali — PBR + Emissive
          if (name === 'light_glass') {
            // 1. Materyal klonla (ortak referansı kır)
            mesh.material = material.clone();
            const cloned = mesh.material as THREE.MeshPhysicalMaterial;

            // 2. Fiziksel cam özellikleri (PBR)
            cloned.transparent = true;
            cloned.transmission = 0.9;    // Işık geçirgenliği
            cloned.roughness = 0.1;       // Pürüzsüz yansıtıcı yüzey
            cloned.metalness = 0.4;

            // 3. Doku koruma: emissiveMap = map
            if (cloned.map) {
              cloned.emissiveMap = cloned.map;
            }

            // 4. Emissive renk kontrolü
            if (isLightsOn) {
              // Kullanıcının bu mesh için atadığı bir renk var mı?
              const savedHex = lightColors[mesh.name];
              cloned.emissive = new THREE.Color(savedHex || '#eef2ff');
              cloned.emissiveIntensity = 1.2;
            } else {
              cloned.emissive = new THREE.Color(0x000000);
              cloned.emissiveIntensity = 0;
            }

            cloned.needsUpdate = true;
          }
        }
      }
    });

    // Fallback: Kaporta materyali bulunamadıysa genel arama
    if (!paintMaterialFound) {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && !paintMaterialFound) {
          const mesh = child as THREE.Mesh;
          const material = mesh.material as THREE.MeshStandardMaterial;
          if (material && !material.name.toLowerCase().includes('glass') && !material.name.toLowerCase().includes('window')) {
            material.color = color;
            material.needsUpdate = true;
          }
        }
      });
    }
  }, [scene, color, isLightsOn, lightColors]);

  // ─── Akıllı Boyama Modu: Tıklanan far parçasına renk ata ───
  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    if (!mesh?.isMesh) return;

    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (mat?.name?.toLowerCase() !== 'light_glass') return;

    const answer = window.prompt(
      `🎨 "${mesh.name}" parçasının rengi ne olmalı?\n\n` +
      `  R = Kırmızı (Stop)\n` +
      `  T = Turuncu (Sinyal)\n` +
      `  B = Beyaz / Buz Mavisi (Far)\n\n` +
      `İptal için boş bırakın.`
    );

    if (!answer) return;

    const key = answer.trim().toLowerCase();
    const hex = PROMPT_COLOR[key];
    if (!hex) return;

    // State güncelle → traverse yeniden çalışır
    setLightColors((prev) => {
      const next = { ...prev, [mesh.name]: hex };
      saveColorMap(next);
      return next;
    });
  }, []);

  return <primitive object={scene} dispose={null} onPointerDown={handlePointerDown} />;
}

// Model preload
useGLTF.preload('/models/tucson.glb');
