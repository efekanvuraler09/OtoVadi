import { collection, addDoc, updateDoc, doc, onSnapshot, query, Timestamp } from 'firebase/firestore';
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
  createdAt: any;
}

export const createTestDriveRequest = async (data: Omit<TestDriveRequest, 'id' | 'status' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'testDrives'), {
      ...data,
      status: 'pending',
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating test drive request:', error);
    throw error;
  }
};

export const updateTestDriveStatus = async (id: string, status: TestDriveStatus): Promise<void> => {
  try {
    const docRef = doc(db, 'testDrives', id);
    await updateDoc(docRef, { status });
  } catch (error) {
    console.error('Error updating test drive status:', error);
    throw error;
  }
};

export const subscribeToTestDrives = (callback: (requests: TestDriveRequest[]) => void) => {
  const q = query(collection(db, 'testDrives'));
  
  return onSnapshot(q, (snapshot) => {
    let requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TestDriveRequest[];
    
    // Sort manually to avoid index requirement
    requests = requests.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
    
    callback(requests);
  }, (error) => {
    console.error('Error subscribing to test drives:', error);
  });
};
