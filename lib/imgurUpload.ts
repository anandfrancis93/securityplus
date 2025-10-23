/**
 * Alternative image upload using Imgur (free, no billing required)
 *
 * To use this:
 * 1. Sign up at https://imgur.com/
 * 2. Register an application at https://api.imgur.com/oauth2/addclient
 * 3. Get your Client ID
 * 4. Add to .env.local:
 *    NEXT_PUBLIC_IMGUR_CLIENT_ID=your_client_id
 */

export async function uploadToImgur(file: File): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_IMGUR_CLIENT_ID;

  if (!clientId) {
    throw new Error('Imgur Client ID not configured');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('https://api.imgur.com/3/image', {
    method: 'POST',
    headers: {
      Authorization: `Client-ID ${clientId}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload image to Imgur');
  }

  const data = await response.json();
  return data.data.link;
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.',
    };
  }

  // Check file size (max 10MB for Imgur)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Please upload an image smaller than 10MB.',
    };
  }

  return { valid: true };
}
