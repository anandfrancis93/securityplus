import { auth } from './firebase';

/**
 * Make authenticated API request to internal Next.js API routes
 * Automatically includes Firebase ID token in Authorization header
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get current Firebase user
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('User must be authenticated to make API requests');
  }

  // Get fresh ID token
  const idToken = await currentUser.getIdToken();

  // Add Authorization header with Bearer token
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${idToken}`);
  headers.set('Content-Type', 'application/json');

  // Make authenticated request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle authentication errors
  if (response.status === 401) {
    // Token expired or invalid - try to refresh
    try {
      const refreshedToken = await currentUser.getIdToken(true); // Force refresh
      headers.set('Authorization', `Bearer ${refreshedToken}`);

      // Retry request with refreshed token
      const retryResponse = await fetch(url, {
        ...options,
        headers,
      });

      return retryResponse;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Authentication failed. Please sign in again.');
    }
  }

  return response;
}

/**
 * Helper for POST requests with authentication
 */
export async function authenticatedPost<T = any>(
  url: string,
  body: any
): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.details || errorData.error || `API request failed: ${response.status}`
    );
  }

  return response.json();
}

/**
 * Helper for GET requests with authentication
 */
export async function authenticatedGet<T = any>(url: string): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.details || errorData.error || `API request failed: ${response.status}`
    );
  }

  return response.json();
}
