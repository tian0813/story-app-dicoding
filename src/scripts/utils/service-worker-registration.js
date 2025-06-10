// src/scripts/utils/service-worker-registration.js
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    // Register the bundled service worker
    const registration = await navigator.serviceWorker.register('/sw.bundle.js');
    console.log('Service Worker registered with scope:', registration.scope);
    
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) { // Check if newWorker exists
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New content is available; please refresh.');
          }
        });
      }
    });
    
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

// Check for PWA install prompt
export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    console.log('PWA install prompt available');

    const installButton = document.getElementById('install-btn'); // Changed to install-btn
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', () => {
        e.prompt();
        e.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted install');
            // Analytics atau tracking bisa ditambahkan di sini
          } else {
            console.log('User dismissed install');
          }
          window.deferredPrompt = null;
          installButton.style.display = 'none';
        });
      });
    }
  });

  // Track app installed event
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    // Analytics atau tracking bisa ditambahkan di sini
  });
}