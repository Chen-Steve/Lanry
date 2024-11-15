export const generateCodeVerifier = () => {
  const array = new Uint32Array(56); // 56 * 2 = 112 characters
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
};

export async function generateCodeChallenge(verifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
} 