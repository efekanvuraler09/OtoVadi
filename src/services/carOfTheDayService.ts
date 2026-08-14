import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface CarOfTheDayData {
  title: string;
  spotText: string;
  imageUrl: string;
  articleText: string;
  engine: string;
  power: string;
  torque: string;
  weight: string;
  acceleration: string;
  topSpeed: string;
  conclusion: string;
  verdictScore: string;
}

const DOC_REF = doc(db, 'settings', 'carOfTheDay');

/**
 * Günün Aracı verisini Firestore'a kaydet/güncelle.
 * setDoc ile merge:false → doküman her seferinde tamamen üzerine yazılır.
 */
export async function saveCarOfTheDay(data: CarOfTheDayData): Promise<void> {
  await setDoc(DOC_REF, data);
}

/**
 * Günün Aracı verisini gerçek zamanlı dinle.
 * Admin panelden güncelleme yapıldığında vitrin anında yansır.
 */
export function subscribeCarOfTheDay(
  callback: (data: CarOfTheDayData | null) => void,
) {
  return onSnapshot(DOC_REF, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as CarOfTheDayData);
    } else {
      callback(null);
    }
  });
}
