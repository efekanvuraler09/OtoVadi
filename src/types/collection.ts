import { Timestamp } from 'firebase/firestore';

/** Koleksiyon içindeki tek bir araç girişi */
export interface CollectionEntry {
  vehicleId: string;
  position: number;
  editorialNote: string;
}

/** Küratörlü tematik araç koleksiyonu */
export interface VehicleCollection {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  coverImage: string;
  curatorNote: string;
  closingNote?: string;
  entries: CollectionEntry[];
  isPublished: boolean;
  publishedAt?: Timestamp;
  updatedAt?: Timestamp;
}
