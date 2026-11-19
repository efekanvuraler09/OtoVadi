import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface UserProfile {
  uid: string;
  photoURL?: string;
  email?: string;
  displayName?: string;
  role?: string;
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

/**
 * İstemcinin yazabileceği profil alanları. `role` ve `uid` bilinçli olarak dışarıda:
 * firestore.rules kullanıcının kendi `role` alanını değiştirmesini zaten reddeder.
 */
export type EditableUserProfile = Partial<Pick<UserProfile, 'photoURL' | 'displayName' | 'email'>>;

export const updateUserProfile = async (uid: string, data: EditableUserProfile): Promise<void> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      await updateDoc(docRef, data);
    } else {
      await setDoc(docRef, { uid, ...data });
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};
