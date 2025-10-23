import { db } from './firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

const PAIRING_CODES_COLLECTION = 'pairingCodes';
const PAIRED_USER_KEY = 'securityplus_paired_user_id';

// Generate a random 6-character alphanumeric code
export function generatePairingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Store pairing code in Firestore
export async function createPairingCode(userId: string): Promise<string> {
  const code = generatePairingCode();
  const expiresAt = Date.now() + 15 * 60 * 1000; // Expires in 15 minutes

  try {
    const codeRef = doc(db, PAIRING_CODES_COLLECTION, code);
    await setDoc(codeRef, {
      userId,
      expiresAt,
      createdAt: Date.now(),
    });

    console.log('Pairing code created:', code);
    return code;
  } catch (error) {
    console.error('Error creating pairing code:', error);
    throw error;
  }
}

// Validate and retrieve userId from pairing code
export async function validatePairingCode(code: string): Promise<string | null> {
  try {
    const codeRef = doc(db, PAIRING_CODES_COLLECTION, code.toUpperCase());
    const codeDoc = await getDoc(codeRef);

    if (!codeDoc.exists()) {
      console.log('Pairing code not found:', code);
      return null;
    }

    const data = codeDoc.data();
    const now = Date.now();

    // Check if code has expired
    if (data.expiresAt < now) {
      console.log('Pairing code expired:', code);
      // Delete expired code
      await deleteDoc(codeRef);
      return null;
    }

    // Delete code after successful use (one-time use)
    await deleteDoc(codeRef);

    console.log('Pairing code validated successfully:', code);
    return data.userId;
  } catch (error) {
    console.error('Error validating pairing code:', error);
    return null;
  }
}

// Store paired user ID in localStorage
export function setPairedUserId(userId: string): void {
  localStorage.setItem(PAIRED_USER_KEY, userId);
  console.log('Paired user ID saved to localStorage:', userId);
}

// Get paired user ID from localStorage
export function getPairedUserId(): string | null {
  return localStorage.getItem(PAIRED_USER_KEY);
}

// Clear paired user ID (unpair device)
export function clearPairedUserId(): void {
  localStorage.removeItem(PAIRED_USER_KEY);
  console.log('Paired user ID cleared from localStorage');
}

// Get the effective user ID (paired or auth user ID)
export function getEffectiveUserId(authUserId: string): string {
  const pairedUserId = getPairedUserId();
  return pairedUserId || authUserId;
}
