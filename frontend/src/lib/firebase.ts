import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc, runTransaction } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqiFs4xuos6S78krFqltzyZ8vWWDEtNAM",
  authDomain: "hackwestern-d38a7.firebaseapp.com",
  projectId: "hackwestern-d38a7",
  storageBucket: "hackwestern-d38a7.firebasestorage.app",
  messagingSenderId: "1076245278544",
  appId: "1:1076245278544:web:df6d06f1870ed834a00655",
  measurementId: "G-K8KNF6Q6L8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface NFTMapping {
  tokenId: string;
  ipfsCid: string;
  metadataCid: string;
  timestamp: number;
}

// Get next token ID from Firebase
export async function getNextTokenId(): Promise<number> {
  const counterRef = doc(db, 'counters', 'tokenId');
  
  const result = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    const currentId = counterDoc.exists() ? counterDoc.data().value : 0;
    const nextId = currentId + 1;
    
    transaction.set(counterRef, { value: nextId });
    return nextId;
  });
  
  return result;
}

export async function saveNFTMapping(tokenId: string, ipfsCid: string, metadataCid: string): Promise<void> {
  const mappingRef = doc(collection(db, 'id_mappings'), tokenId);
  const mapping: NFTMapping = {
    tokenId,
    ipfsCid,
    metadataCid,
    timestamp: Date.now()
  };
  
  await setDoc(mappingRef, mapping);
}

export async function getNFTMapping(tokenId: string): Promise<NFTMapping | null> {
  const mappingRef = doc(collection(db, 'id_mappings'), tokenId);
  const snapshot = await getDoc(mappingRef);
  
  if (snapshot.exists()) {
    return snapshot.data() as NFTMapping;
  }
  
  return null;
} 