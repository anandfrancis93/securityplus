import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Upload an image to Firebase Storage
 */
export async function uploadFlashcardImage(
  userId: string,
  flashcardId: string,
  file: File
): Promise<string> {
  try {
    // Create a reference to the storage location
    const storageRef = ref(storage, `flashcards/${userId}/${flashcardId}/${file.name}`);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log('Image uploaded successfully:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Delete an image from Firebase Storage
 */
export async function deleteFlashcardImage(imageUrl: string): Promise<void> {
  try {
    // Create a reference from the URL
    const imageRef = ref(storage, imageUrl);

    // Delete the file
    await deleteObject(imageRef);

    console.log('Image deleted successfully');
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.',
    };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Please upload an image smaller than 5MB.',
    };
  }

  return { valid: true };
}
