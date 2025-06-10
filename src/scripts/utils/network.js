export function isOnline() {
  return navigator.onLine;
}

export function showOfflineBanner(show) {
  const banner = document.getElementById('offline-banner') || createOfflineBanner();
  banner.textContent = show 
    ? 'You are offline. Showing cached data.' 
    : 'Back online!';
  banner.classList.toggle('show', show);
  
  if (!show) {
    setTimeout(() => banner.classList.remove('show'), 3000);
  }
}

function createOfflineBanner() {
  const banner = document.createElement('div');
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
  return banner;
}