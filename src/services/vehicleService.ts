import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Vehicle } from '../types/vehicle';

const COLLECTION = 'vehicles';
const vehiclesRef = collection(db, COLLECTION);

/**
 * Gerçek zamanlı dinleme — Firestore'daki vehicles koleksiyonu
 * değiştiğinde callback otomatik tetiklenir.
 */
export function subscribeVehicles(callback: (vehicles: Vehicle[]) => void) {
  const q = query(vehiclesRef);
  return onSnapshot(q, (snapshot) => {
    const vehicles: Vehicle[] = [];
    snapshot.forEach((docSnap) => {
      vehicles.push(docSnap.data() as Vehicle);
    });
    callback(vehicles);
  });
}

/**
 * Yeni araç ekle — doc ID olarak vehicle.id kullanılır
 */
export async function addVehicleToFirestore(vehicle: Vehicle) {
  await setDoc(doc(db, COLLECTION, vehicle.id), vehicle);
}

/**
 * Araç güncelle
 */
export async function updateVehicleInFirestore(id: string, updates: Partial<Vehicle>) {
  await updateDoc(doc(db, COLLECTION, id), updates as Record<string, unknown>);
}

/**
 * Araç sil
 */
export async function deleteVehicleFromFirestore(id: string) {
  await deleteDoc(doc(db, COLLECTION, id));
}

/**
 * Başlangıç verilerini Firestore'a tek seferlik aktar (Seed).
 * Zaten kayıtlı dökümanları çakışmadan yazar (setDoc = upsert).
 */
export async function seedVehiclesToFirestore(vehicles: Vehicle[]) {
  const existing = await getDocs(vehiclesRef);
  if (!existing.empty) {
    console.warn(`Firestore 'vehicles' koleksiyonunda zaten ${existing.size} döküman var.`);
  }
  
  let count = 0;
  for (const vehicle of vehicles) {
    await setDoc(doc(db, COLLECTION, vehicle.id), vehicle);
    count++;
  }
  console.log(`✅ ${count} araç Firestore'a başarıyla aktarıldı.`);
  return count;
}
