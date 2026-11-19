import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Kullanıcının yönetici olup olmadığını `admins/{uid}` kaydından okur.
 * Bu kayıt yalnızca Firebase Console'dan eklenir; istemciler oraya yazamaz (firestore.rules).
 * Buradaki sonuç yalnızca arayüz kararları içindir. Asıl yetki kontrolü firestore.rules içindeki isAdmin()'dir.
 */
export async function checkIsAdmin(uid: string): Promise<boolean> {
  try {
    const snapshot = await getDoc(doc(db, 'admins', uid));
    return snapshot.exists();
  } catch (error) {
    console.warn('Yönetici yetkisi okunamadı:', error);
    return false;
  }
}
