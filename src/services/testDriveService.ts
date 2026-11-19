import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type FirestoreError,
  type Query,
  type QuerySnapshot,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export type TestDriveStatus = 'pending' | 'approved' | 'rejected';

export interface TestDriveRequest {
  id?: string;
  userId: string;
  vehicleId: string;
  vehicleName: string;
  customerName: string;
  customerPhone: string;
  location: string;
  date: string;
  time: string;
  status: TestDriveStatus;
  /** Sunucu zaman damgası; yazma henüz sunucuya ulaşmadıysa yerel anlık görüntüde null olabilir */
  createdAt: Timestamp | null;
}

const testDrivesRef = collection(db, 'testDrives');

function toRequests(snapshot: QuerySnapshot): TestDriveRequest[] {
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as TestDriveRequest);
}

/** Yeniden eskiye; henüz sunucuya yazılmamış (createdAt null) kayıtlar en üstte */
function sortNewestFirst(requests: TestDriveRequest[]): TestDriveRequest[] {
  const time = (r: TestDriveRequest) => r.createdAt?.toMillis?.() ?? Number.MAX_SAFE_INTEGER;
  return [...requests].sort((a, b) => time(b) - time(a));
}

/**
 * Yeni randevu talebi. firestore.rules: userId oturumdaki kullanıcı olmalı, status 'pending',
 * createdAt sunucu zamanı (request.time) ve yalnızca izinli alanlar yazılabilir.
 */
export const createTestDriveRequest = async (data: Omit<TestDriveRequest, 'id' | 'status' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(testDrivesRef, {
      ...data,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating test drive request:', error);
    throw error;
  }
};

/** Yalnızca yönetici (firestore.rules → isAdmin) */
export const updateTestDriveStatus = async (id: string, status: TestDriveStatus): Promise<void> => {
  try {
    const docRef = doc(db, 'testDrives', id);
    await updateDoc(docRef, { status });
  } catch (error) {
    console.error('Error updating test drive status:', error);
    throw error;
  }
};

/** Tüm randevular: yalnızca yönetici paneli içindir (kurallar admin olmayanı reddeder). */
export const subscribeToTestDrives = (
  callback: (requests: TestDriveRequest[]) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe =>
  onSnapshot(
    query(testDrivesRef),
    // Bileşik index gerektirmemek için sıralama istemcide
    (snapshot) => callback(sortNewestFirst(toRequests(snapshot))),
    (error) => {
      console.error('Error subscribing to test drives:', error);
      onError?.(error);
    },
  );

/**
 * Oturumdaki kullanıcının randevuları. Filtre SUNUCUDA uygulanır: başka kullanıcıların kişisel verisi
 * tarayıcıya hiç inmez ve firestore.rules bu sorguya yalnızca kendi kayıtları için izin verir.
 * Gereken bileşik index: testDrives → userId (Artan) + createdAt (Azalan), bkz. firestore.indexes.json.
 */
export function subscribeToUserTestDrives(
  userId: string,
  callback: (requests: TestDriveRequest[]) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe {
  const ownRequests = query(testDrivesRef, where('userId', '==', userId));
  const ordered = query(ownRequests, orderBy('createdAt', 'desc'));
  let unsubscribe: Unsubscribe = () => {};
  let disposed = false;

  const listen = (q: Query, sortLocally: boolean) => {
    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const requests = toRequests(snapshot);
        callback(sortLocally ? sortNewestFirst(requests) : requests);
      },
      (error) => {
        if (!sortLocally && error.code === 'failed-precondition' && !disposed) {
          // Index henüz oluşturulmadı ya da hazırlanıyor: yine sunucuda userId ile filtrelenen sorguya geç,
          // sıralamayı istemcide yap. (Hata mesajındaki bağlantı index'i tek tıkla oluşturur.)
          console.warn('testDrives için bileşik index (userId + createdAt desc) hazır değil; geçici olarak istemci tarafı sıralama kullanılıyor.', error.message);
          listen(ownRequests, true);
          return;
        }
        console.error('Randevular alınamadı:', error);
        onError?.(error);
      },
    );
  };

  listen(ordered, false);
  return () => {
    disposed = true;
    unsubscribe();
  };
}
