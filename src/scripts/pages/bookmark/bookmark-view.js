import { View } from '../mvp/mvp-base';
import { showFormattedDate } from '../../utils';

export default class BookmarkView extends View {
  constructor() {
    super();
  }

  async render() {
    return `
      <section class="container" aria-labelledby="bookmarks-title">
        <h1 id="bookmarks-title">Your Bookmarked Stories</h1>
        <div id="bookmark-list" class="stories-grid">
          </div>
        <div id="loading-indicator" class="loading-indicator" style="display: none;">
          <div class="spinner"></div>
          <p>Loading bookmarked stories...</p>
        </div>
        <div id="empty-message" class="error-message" style="display: none;">
          <p>You haven't bookmarked any stories yet.</p>
          <a href="#/stories" class="button primary">Browse Stories</a>
        </div>
      </section>
    `;
  }

  async afterRender() {
    await this.presenter.loadBookmarkedStories();
    this.setupEventListeners();
  }

  renderBookmarkedStories(stories) {
    const container = document.getElementById('bookmark-list');
    const emptyMessage = document.getElementById('empty-message');

    if (!container) return;

    if (stories.length === 0) {
      container.innerHTML = '';
      emptyMessage.style.display = 'block';
    } else {
      emptyMessage.style.display = 'none';
      container.innerHTML = stories.map(bookmark => {
        const story = bookmark.storyData;
        if (!story) {
          console.warn('Skipping bookmark due to missing story data:', bookmark);
          return '';
        }

        return `
          <article class="story-card" data-id="${story.id || ''}">
            <div class="story-image">
              <img 
                src="${this._ensureValidImageUrl(story.photoUrl)}" 
                alt="${story.name || 'Story image'}'s story" 
                loading="lazy"
                crossorigin="anonymous"
                onerror="this.onerror=null;this.src='./images/placeholder.jpg'"
              >
              ${(story.lat && story.lon) ? `
                <span class="location-badge" aria-label="Has location data">
                  <i class="fas fa-map-marker-alt"></i>
                </span>
              ` : ''}
            </div>
            <div class="story-content">
              <h3>${story.name || 'Untitled Story'}</h3>
              <time datetime="${story.createdAt || ''}">${story.createdAt ? showFormattedDate(story.createdAt) : 'Unknown Date'}</time>
              <p>${story.description || 'No description available.'}</p>
              <div class="story-actions" style="display: flex; gap: 10px; margin-top: 15px;">
                <a href="#/detail/${story.id || ''}" class="read-more button primary" style="flex-grow: 1;">Read Full Story</a>
                <button class="button secondary delete-bookmark-btn" data-id="${story.id || ''}" aria-label="Remove bookmark">Remove</button>
              </div>
            </div>
          </article>
        `;
      }).join('');

      container.querySelectorAll('.delete-bookmark-btn').forEach(button => {
        button.addEventListener('click', (event) => {
          const storyId = event.target.dataset.id;
          this.presenter.handleDeleteBookmark(storyId);
        });
      });
    }
  }

  _ensureValidImageUrl(url) {
    if (!url) return '/images/placeholder.jpg';
    if (url.startsWith('blob:')) return url;
    if (!url.startsWith('http') && !url.startsWith('/')) return `/${url}`;
    return url;
  }

  setupEventListeners() {
  }

  showLoading(show) {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
      loader.style.display = show ? 'flex' : 'none';
    }
  }

  showError(message) {
    const container = document.getElementById('bookmark-list');
    const emptyMessage = document.getElementById('empty-message');
    if (container) {
      container.innerHTML = '';
      emptyMessage.style.display = 'block';
      emptyMessage.innerHTML = `
        <p>${message}</p>
        <button id="retry-button" class="button primary">Try Again</button>
      `;
      document.getElementById('retry-button')?.addEventListener('click', () => {
        this.presenter.loadBookmarkedStories();
      });
    }
  }
}