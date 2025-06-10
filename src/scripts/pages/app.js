// src/scripts/pages/app.js
import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import { initPushNotifications, setupNotificationToggle, displayNotification } from '../utils/notification';
import { showOfflineBanner } from '../utils/offlineHandler';
import { showToast } from '../utils/toast';
import { startStoryPolling } from '../utils/story-watcher';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
    this._setupNetworkListeners();
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (!this.#navigationDrawer.contains(event.target) && !this.#drawerButton.contains(event.target)) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      });
    });
  }


  async _initPushAndPolling() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;

        await initPushNotifications();
        await setupNotificationToggle();
        startStoryPolling(); 
      } catch (error) {
        console.error('Error initializing push notifications or polling:', error);
      }
    }
  }

  _setupNetworkListeners() {
    window.addEventListener('online', () => {
      showOfflineBanner(false);
      showToast('You are back online', 'success');
    });

    window.addEventListener('offline', () => {
      showOfflineBanner(true);
      showToast('You are offline. Showing cached data.', 'warning'); 
    });

    showOfflineBanner(!navigator.onLine);
  }

  async renderPage() {
    const url = getActiveRoute();
    const PageClass = routes[url] || routes['*'];

    if (!url.startsWith('/auth')) {
      sessionStorage.setItem('returnTo', window.location.hash);
    }

    try {
      const page = new PageClass();

      if (document.startViewTransition) {
        document.startViewTransition(async () => {
          this.#content.innerHTML = await page.render();
          await page.afterRender();
        });
      } else {
        this.#content.classList.add('fade-enter');
        this.#content.innerHTML = await page.render();
        await page.afterRender();

        requestAnimationFrame(() => {
          this.#content.classList.add('fade-enter-active');
          setTimeout(() => {
            this.#content.classList.remove('fade-enter', 'fade-enter-active');
          }, 300);
        });
      }
      // Initialize Push Notifications and Story Polling AFTER the page has rendered
      await this._initPushAndPolling();

    } catch (error) {
      console.error('Error rendering page:', error);
      this.#content.innerHTML = `
        <section class="container error-container">
          <h1>Something went wrong</h1>
          <p>${error.message}</p>
          <a href="#/" class="button primary">Go to Home</a>
        </section>
      `;
    }
  }
}

export default App;