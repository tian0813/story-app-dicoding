// src/scripts/pages/not-found-page.js
class NotFoundPage {
  async render() {
    return `
      <section class="not-found">
        <div class="container">
          <h1>404 - Page Not Found</h1>
          <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#6200ea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>The page you're looking for doesn't exist or has been moved.</p>
          <div class="actions">
            <a href="#/" class="button primary">Go to Home</a>
            <a href="#/stories" class="button secondary">Browse Stories</a>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
  }
}

export default NotFoundPage;