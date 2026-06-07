import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Load config
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let db: any = null;

if (fs.existsSync(configPath)) {
  try {
    const rawConfig = fs.readFileSync(configPath, 'utf-8');
    const firebaseConfig = JSON.parse(rawConfig);
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    console.log('[FirebaseBackend] Firestore initialized successfully on database ID:', firebaseConfig.firestoreDatabaseId);
  } catch (err) {
    console.error('[FirebaseBackend] Error parsing firebase config:', err);
  }
} else {
  console.warn('[FirebaseBackend] No firebase-applet-config.json config found. Offline mode active.');
}

// Global cache sync functions
export async function syncCollectionToLocal<T extends { id: string }>(
  collectionName: string,
  localArray: T[],
  saveLocalCallback: () => void
): Promise<boolean> {
  if (!db) return false;
  try {
    console.log(`[FirebaseSync] Syncing "${collectionName}" from Firestore...`);
    const querySnapshot = await getDocs(collection(db, collectionName));
    const items: T[] = [];
    querySnapshot.forEach((docSnap) => {
      items.push(docSnap.data() as T);
    });

    if (items.length > 0) {
      // Clear and fill with Firestore data to establish single source of truth in cloud
      localArray.length = 0;
      localArray.push(...items);
      saveLocalCallback();
      console.log(`[FirebaseSync] Sync complete. Loaded ${items.length} records into local memory cache for "${collectionName}".`);
      return true;
    } else {
      console.log(`[FirebaseSync] Firestore collection "${collectionName}" is currently empty. Local state preserved.`);
      // Let's populate Firestore with whatever local data is current so the user never loses a single item!
      if (localArray.length > 0) {
        console.log(`[FirebaseSync] Warm uploading ${localArray.length} existing items for "${collectionName}" to live cloud...`);
        for (const item of localArray) {
          await setDoc(doc(db, collectionName, item.id), item);
        }
      }
      return false;
    }
  } catch (err) {
    console.error(`[FirebaseSync] Error syncing "${collectionName}":`, err);
    return false;
  }
}

export async function persistRecordToFirestore<T extends { id: string }>(
  collectionName: string,
  record: T
): Promise<boolean> {
  if (!db) return false;
  try {
    const docRef = doc(db, collectionName, record.id);
    await setDoc(docRef, record);
    console.log(`[FirebaseSync] Successfully saved doc "${record.id}" directly to live Cloud Firestore [${collectionName}].`);
    return true;
  } catch (err) {
    console.error(`[FirebaseSync] Error writing record "${record.id}" to "${collectionName}":`, err);
    return false;
  }
}

export async function deleteRecordFromFirestore(
  collectionName: string,
  id: string
): Promise<boolean> {
  if (!db) return false;
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    console.log(`[FirebaseSync] Successfully deleted doc "${id}" from live Cloud Firestore [${collectionName}].`);
    return true;
  } catch (err) {
    console.error(`[FirebaseSync] Error deleting record "${id}" from "${collectionName}":`, err);
    return false;
  }
}
