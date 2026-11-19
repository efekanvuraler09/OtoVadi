import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
  type FirestoreError,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { VehicleCollection } from '../types/collection';

const COLLECTION = 'collections';
const collectionsRef = collection(db, COLLECTION);

/* ── Gerçek Zamanlı Dinleme ────────────────────────────────────── */

/** Tüm koleksiyonları dinle (admin paneli için) */
export function subscribeCollections(callback: (cols: VehicleCollection[]) => void) {
  const q = query(collectionsRef);
  return onSnapshot(q, (snapshot) => {
    const cols: VehicleCollection[] = [];
    snapshot.forEach((docSnap) => {
      cols.push({ id: docSnap.id, ...docSnap.data() } as VehicleCollection);
    });
    callback(cols);
  });
}

/** Yalnızca yayındaki koleksiyonları dinle (vitrin için) */
export function subscribePublishedCollections(
  callback: (cols: VehicleCollection[]) => void,
  onError?: (error: FirestoreError) => void,
) {
  const q = query(collectionsRef, where('isPublished', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      const cols: VehicleCollection[] = [];
      snapshot.forEach((docSnap) => {
        cols.push({ id: docSnap.id, ...docSnap.data() } as VehicleCollection);
      });
      callback(cols);
    },
    (error) => {
      console.error('Koleksiyonlar alınamadı:', error);
      onError?.(error);
    },
  );
}

/** Tekil koleksiyonu slug ile dinle */
export function subscribeCollectionBySlug(
  slug: string,
  callback: (col: VehicleCollection | null) => void,
  onError?: (error: FirestoreError) => void,
) {
  const q = query(collectionsRef, where('slug', '==', slug));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(null);
        return;
      }
      const docSnap = snapshot.docs[0];
      callback({ id: docSnap.id, ...docSnap.data() } as VehicleCollection);
    },
    (error) => {
      console.error('Koleksiyon alınamadı:', error);
      onError?.(error);
    },
  );
}

/* ── CRUD İşlemleri ────────────────────────────────────────────── */

/** Yeni koleksiyon oluştur */
export async function createCollection(col: Omit<VehicleCollection, 'id'>) {
  const docRef = doc(collectionsRef);
  const data = {
    ...col,
    id: docRef.id,
    updatedAt: Timestamp.now(),
    publishedAt: col.isPublished ? Timestamp.now() : null,
  };
  await setDoc(docRef, data);
  return docRef.id;
}

/** Koleksiyon güncelle */
export async function updateCollection(id: string, updates: Partial<VehicleCollection>) {
  await updateDoc(doc(db, COLLECTION, id), {
    ...updates,
    updatedAt: Timestamp.now(),
  } as Record<string, unknown>);
}

/** Koleksiyon sil */
export async function deleteCollection(id: string) {
  await deleteDoc(doc(db, COLLECTION, id));
}
