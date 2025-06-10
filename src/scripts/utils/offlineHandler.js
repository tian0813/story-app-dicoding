// src/scripts/utils/offlineHandler.js
import { getStories as getStoriesFromIDB } from './indexedDB';

export function showOfflineBanner(show) {
  let banner = document.getElementById('offline-banner');

  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'offline-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #ff9800;
      color: white;
      text-align: center;
      padding: 10px;
      z-index: 1000;
      transform: translateY(100%);
      transition: transform 0.3s ease;
    `;
    document.body.appendChild(banner);
  }

  banner.textContent = show 
    ? 'You are offline. Showing cached data.' 
    : 'Back online!';
    
  banner.style.transform = show ? 'translateY(0)' : 'translateY(100%)';

  if (!show) {
    setTimeout(() => {
      banner.style.transform = 'translateY(100%)';
    }, 3000);
  }
}

// This function is moved to data/api.js (getStoriesWithFallback, getStoriesGuestWithFallback)
// export async function getStoriesWithFallback(apiCall) {
//   try {
//     if (navigator.onLine) {
//       const response = await apiCall();
//       return {
//         ...response,
//         isOffline: false
//       };
//     } else {
//       const stories = await getStoriesFromIDB();
//       return {
//         error: false,
//         message: 'Offline data loaded',
//         data: { stories },
//         isOffline: true
//       };
//     }
//   } catch (error) {
//     console.error('Error:', error);
//     const stories = await getStoriesFromIDB();
//     return {
//       error: true,
//       message: error.message,
//       data: { stories: stories || [] },
//       isOffline: true
//     };
//   }
// }