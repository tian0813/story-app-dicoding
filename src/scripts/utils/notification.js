// src/scripts/utils/notification.js
// notification.js
import CONFIG from '../config';
import { subscribePushNotification, unsubscribePushNotification } from '../data/api';
import { showToast } from './toast'; // Import showToast

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export async function initPushNotifications() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported');
    return null;
  }

  if (!('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    // Request permission first
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      showToast('Notification permission denied.', 'error');
      throw new Error('Permission not granted for notifications');
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('Existing push subscription found:', subscription);
      // If already subscribed, ensure it's sent to the server (e.g., on app load)
      // You might want to call subscribePushNotification here if your backend
      // requires re-sending subscription data periodically or on app start.
      // For now, we'll assume existing subscription means it's already on the server.
    } else {
        // Subscribe to push manager
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(CONFIG.WEB_PUSH_VAPID_PUBLIC_KEY)
        });

        // Send subscription to server
        await subscribePushNotification({ subscription });
        console.log('Push subscription successfully sent to server.');
    }

    showToast('Push Notification Activated!', 'success');

    // Show a local notification immediately after activation for demonstration
    showNotification('Notifications Enabled!', {
        body: 'You will now receive updates from Dicoding Story App.',
        icon: '/images/icons/icon-192x192.png'
    });

    return subscription;
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    if (Notification.permission === 'default') {
      showToast('Please allow notifications when prompted.', 'info');
    } else if (Notification.permission === 'denied') {
      showToast('Notifications blocked. Please enable them in browser settings.', 'error');
    } else {
      showToast('Failed to activate push notifications.', 'error');
    }
    return null;
  }
}

export async function unsubscribeFromPushNotifications() {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await unsubscribePushNotification({ endpoint: subscription.endpoint }); // Unsubscribe from your backend
      await subscription.unsubscribe(); // Unsubscribe from browser PushManager
      console.log('Push subscription successfully unsubscribed.');
      showToast('Push Notifications Disabled.', 'success');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    showToast('Failed to disable push notifications.', 'error');
    return false;
  }
}

export async function setupNotificationToggle() {
  const toggleBtn = document.getElementById('notification-toggle');
  if (!toggleBtn) {
    console.warn('Notification toggle button not found.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    updateButtonState(toggleBtn, !!subscription); // Update button based on initial subscription status

    toggleBtn.addEventListener('click', async () => {
      toggleBtn.disabled = true; // Disable button during processing
      
      if (toggleBtn.classList.contains('subscribed')) {
        const success = await unsubscribeFromPushNotifications();
        updateButtonState(toggleBtn, !success); // If unsubscribe successful, button state becomes 'not subscribed'
      } else {
        const subscription = await initPushNotifications(); // Try to subscribe
        updateButtonState(toggleBtn, !!subscription); // Update based on whether a subscription was obtained
      }
      
      toggleBtn.disabled = false; // Re-enable button
    });
  } catch (error) {
    console.error('Error setting up notification toggle:', error);
    toggleBtn.textContent = 'Notifications Unavailable';
    toggleBtn.disabled = true;
    showToast('Notifications setup failed.', 'error');
  }
}

function updateButtonState(button, isSubscribed) {
  if (isSubscribed) {
    button.textContent = 'Disable Notifications';
    button.classList.add('subscribed');
    button.setAttribute('aria-checked', 'true');
  } else {
    button.textContent = 'Enable Notifications';
    button.classList.remove('subscribed');
    button.setAttribute('aria-checked', 'false');
  }
}

// Function to show a local notification (not from push server)
export function showNotification(title, options = {}) {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications.');
    return null;
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: options.icon || '/images/icons/icon-192x192.png',
      badge: options.badge || '/images/icons/icon-192x192.png',
      body: options.body || '',
      ...options
    });

    notification.onclick = (event) => {
      event.preventDefault();
      window.focus(); // Focus the current window
      if (options.url) {
        // This is a local notification, so navigation happens directly in the current window
        window.location.href = options.url; 
      }
    };

    return notification;
  } else {
    console.warn('Notification permission not granted for local notification.');
    return null;
  }
}

// Function to display a notification, typically from a Service Worker push event
export function displayNotification(title, options = {}) {
  // This function is primarily for the Service Worker to use via self.registration.showNotification
  // For client-side display, showNotification is more appropriate.
  // However, if called from the main thread, it will delegate to the service worker.
  if ('serviceWorker' in navigator && Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        body: options.body || '',
        icon: options.icon || '/images/icons/icon-192x192.png',
        badge: options.badge || '/images/icons/icon-192x192.png',
        data: {
          url: options.url || '/'
        },
        vibrate: options.vibrate || [200, 100, 200],
        requireInteraction: true // ADDED: Hint to keep notification visible until interacted
      });
    });
  } else {
    console.warn('Service worker not available or notification permission not granted for displayNotification.');
    showNotification(title, options); // Fallback to local notification if SW isn't ready/permitted
  }
}