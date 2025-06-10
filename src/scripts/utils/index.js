// src/scripts/utils/index.js
export function showFormattedDate(date, locale = 'en-US', options = {}) {
  // Add a check for valid date input
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function showLoading() {
  let loader = document.getElementById('app-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'app-loader';
    loader.className = 'app-loader';
    loader.innerHTML = 'Loading...';
    loader.setAttribute('aria-live', 'polite');
    document.body.appendChild(loader);
  }
  loader.style.display = 'block';
}

export function hideLoading() {
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.style.display = 'none';
  }
}

// showToast is now imported and handled by utils/toast.js, remove this redundant local one.
// export function showToast(message, type = 'success') {
//   const toast = document.createElement('div');
//   toast.className = `toast toast-${type}`;
//   toast.textContent = message;
//   document.body.appendChild(toast);
  
//   setTimeout(() => {
//     toast.classList.add('show');
//   }, 10);
  
//   setTimeout(() => {
//     toast.classList.remove('show');
//     setTimeout(() => toast.remove(), 300);
//   }, 3000);
// }

if (!document.startViewTransition) {
  document.startViewTransition = (callback) => {
    callback();
    return {
      ready: Promise.resolve(),
      finished: Promise.resolve(),
      updateCallbackDone: Promise.resolve(),
    };
  };
}