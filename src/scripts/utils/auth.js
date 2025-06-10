// src/scripts/utils/auth.js
export function isValidToken(token) {
  if (!token || typeof token !== 'string') return false;
  
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    const payload = JSON.parse(atob(parts[1]));
    // Check if token has an expiration and if it's expired
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      console.warn('Authentication token expired.');
      return false;
    }
    return true;
  } catch (e) {
    console.error('Error decoding token payload:', e);
    return false;
  }
}

export function clearAuthData() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('name');
}