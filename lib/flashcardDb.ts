import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Flashcard, FlashcardReview, FlashcardDeck } from './types';

// Collections
const FLASHCARDS_COLLECTION = 'flashcards';
const REVIEWS_COLLECTION = 'flashcardReviews';
const DECKS_COLLECTION = 'flashcardDecks';

/**
 * Save multiple flashcards from file upload
 */
export async function saveFlashcards(
  userId: string,
  flashcards: Array<{ term: string; definition: string; context?: string; domain?: string }>,
  sourceFile: string
): Promise<Flashcard[]> {
  const batch = writeBatch(db);
  const savedFlashcards: Flashcard[] = [];

  for (let i = 0; i < flashcards.length; i++) {
    const flashcard: Flashcard = {
      id: `fc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      term: flashcards[i].term,
      definition: flashcards[i].definition,
      sourceFile,
      orderInFile: i,
      createdAt: Date.now(),
      userId,
    };

    // Only add optional fields if they exist (Firestore doesn't allow undefined values)
    if (flashcards[i].context) {
      flashcard.context = flashcards[i].context;
    }
    if (flashcards[i].domain) {
      flashcard.domain = flashcards[i].domain;
    }

    const docRef = doc(db, FLASHCARDS_COLLECTION, flashcard.id);
    batch.set(docRef, flashcard);
    savedFlashcards.push(flashcard);
  }

  await batch.commit();
  console.log(`Saved ${savedFlashcards.length} flashcards for user ${userId}`);
  return savedFlashcards;
}

/**
 * Get all flashcards for a user
 */
export async function getUserFlashcards(userId: string): Promise<Flashcard[]> {
  const q = query(
    collection(db, FLASHCARDS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Flashcard);
}

/**
 * Get flashcards by source file
 */
export async function getFlashcardsBySource(
  userId: string,
  sourceFile: string
): Promise<Flashcard[]> {
  const q = query(
    collection(db, FLASHCARDS_COLLECTION),
    where('userId', '==', userId),
    where('sourceFile', '==', sourceFile),
    orderBy('orderInFile', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Flashcard);
}

/**
 * Get a single flashcard
 */
export async function getFlashcard(flashcardId: string): Promise<Flashcard | null> {
  const docRef = doc(db, FLASHCARDS_COLLECTION, flashcardId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as Flashcard;
}

/**
 * Update a flashcard
 */
export async function updateFlashcard(
  flashcardId: string,
  updates: { term: string; definition: string; context?: string; domain?: string }
): Promise<void> {
  const docRef = doc(db, FLASHCARDS_COLLECTION, flashcardId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error('Flashcard not found');
  }

  const existingCard = snapshot.data() as Flashcard;
  const updatedCard: Flashcard = {
    ...existingCard,
    term: updates.term,
    definition: updates.definition,
  };

  // Only include optional fields if provided
  if (updates.context) {
    updatedCard.context = updates.context;
  } else {
    delete updatedCard.context;
  }

  if (updates.domain) {
    updatedCard.domain = updates.domain;
  } else {
    delete updatedCard.domain;
  }

  await setDoc(docRef, updatedCard);
}

/**
 * Delete a flashcard
 */
export async function deleteFlashcard(flashcardId: string): Promise<void> {
  await deleteDoc(doc(db, FLASHCARDS_COLLECTION, flashcardId));
}

/**
 * Save a flashcard review
 */
export async function saveFlashcardReview(review: FlashcardReview): Promise<void> {
  const reviewId = `${review.userId}_${review.flashcardId}`;
  const docRef = doc(db, REVIEWS_COLLECTION, reviewId);
  await setDoc(docRef, review);
}

/**
 * Get all reviews for a user
 */
export async function getUserReviews(userId: string): Promise<FlashcardReview[]> {
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as FlashcardReview);
}

/**
 * Get review for a specific flashcard
 */
export async function getFlashcardReview(
  userId: string,
  flashcardId: string
): Promise<FlashcardReview | null> {
  const reviewId = `${userId}_${flashcardId}`;
  const docRef = doc(db, REVIEWS_COLLECTION, reviewId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as FlashcardReview;
}

/**
 * Create a flashcard deck
 */
export async function createDeck(
  userId: string,
  name: string,
  flashcardIds: string[]
): Promise<FlashcardDeck> {
  const deck: FlashcardDeck = {
    id: `deck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    userId,
    flashcardIds,
    createdAt: Date.now(),
  };

  const docRef = doc(db, DECKS_COLLECTION, deck.id);
  await setDoc(docRef, deck);

  return deck;
}

/**
 * Get all decks for a user
 */
export async function getUserDecks(userId: string): Promise<FlashcardDeck[]> {
  const q = query(
    collection(db, DECKS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as FlashcardDeck);
}

/**
 * Update deck last studied time
 */
export async function updateDeckLastStudied(deckId: string): Promise<void> {
  const docRef = doc(db, DECKS_COLLECTION, deckId);
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    const deck = snapshot.data() as FlashcardDeck;
    await setDoc(docRef, { ...deck, lastStudied: Date.now() });
  }
}

/**
 * Delete a deck
 */
export async function deleteDeck(deckId: string): Promise<void> {
  await deleteDoc(doc(db, DECKS_COLLECTION, deckId));
}
