// src/scripts/index.js
import '../styles/styles.css';
import 'leaflet/dist/leaflet.css';
import { registerServiceWorker, setupInstallPrompt } from './utils/service-worker-registration';
import App from './pages/app';

let deferredPrompt;

if (process.env.NODE_ENV === 'production') {
  registerServiceWorker();
} else {
  // if (!('serviceWorker' in navigator)) {
  //   console.warn('Service Worker not supported');
  // } else {
  //   navigator.serviceWorker.register('/sw.js', { type: 'module' }) // If you run directly with es modules
  //     .then(reg => console.log('SW Registered (dev):', reg.scope))
  //     .catch(err => console.error('SW Reg Failed (dev):', err));
  // }
}


setupInstallPrompt(); // Set up the A2HS prompt

const app = new App({
  content: document.querySelector('#main-content'),
  drawerButton: document.querySelector('#drawer-button'),
  navigationDrawer: document.querySelector('#navigation-drawer'),
});

app.renderPage();

window.addEventListener('hashchange', async () => {
  await app.renderPage();
});

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const installBtn = document.querySelector('#install-btn');
  if (installBtn) {
    installBtn.style.display = 'block';

    installBtn.addEventListener('click', () => {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice) => {
        if (choice.outcome === 'accepted') {
          console.log('User accepted install');
        } else {
          console.log('User dismissed install');
        }
        deferredPrompt = null;
      });
    });
  }
});