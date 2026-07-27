import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface CarModelProps {
  colorHex: string;
  modelPath: string;
}

export function CarModel({ colorHex, modelPath }: CarModelProps) {
  const { scene } = useGLTF(modelPath);
  const color = useMemo(() => new THREE.Color(colorHex), [colorHex]);

  // ─── Ana traverse: Kaporta boyası ve PBR materyaller ───
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
            material.roughness = 0.3;
            material.metalness = 0.6;
            material.needsUpdate = true;
            paintMaterialFound = true;
          }

          // Far Cam Materyali — Sade PBR (Işıksız)
          if (name === 'light_glass') {
            mesh.material = material.clone();
            const cloned = mesh.material as THREE.MeshPhysicalMaterial;

            cloned.transparent = true;
            cloned.transmission = 0.9;
            cloned.roughness = 0.1;
            cloned.metalness = 0.4;
            cloned.emissive = new THREE.Color(0x000000);
            cloned.emissiveIntensity = 0;

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
            material.roughness = 0.3;
            material.metalness = 0.6;
            material.needsUpdate = true;
          }
        }
      });
    }
  }, [scene, color]);

  return <primitive object={scene} dispose={null} />;
}
