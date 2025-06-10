// src/scripts/pages/story/story-view.js
import { View } from '../mvp/mvp-base';
import { showFormattedDate } from '../../utils';

export default class StoryView extends View {
  constructor() {
    super();
    this._stories = [];
    this._filteredStories = [];
    this._currentFilter = 'all';
  }
showOfflineIndicator(show) {
    let indicator = document.getElementById('offline-indicator');
    
    if (!indicator) {
      const container = document.querySelector('.container');
      if (container) {
        container.insertAdjacentHTML('afterbegin', `
          <div id="offline-indicator" class="offline-indicator" style="display: none;">
            <i class="fas fa-wifi-off"></i>
            <span>You are offline. Showing cached data.</span>
          </div>
        `);
        indicator = document.getElementById('offline-indicator');
      }
    }
    
    if (indicator) {
      indicator.style.display = show ? 'flex' : 'none';
    }
  }

  async render() {
    return `
      <section class="container" aria-labelledby="stories-title">
        <h1 id="stories-title">All Stories</h1>
        
        <div class="story-filters">
          <button class="filter-btn active" data-filter="all">All Stories</button>
          <button class="filter-btn" data-filter="with-location">With Location</button>
        </div>
        
        <div id="stories-container" class="stories-grid">
          </div>
        
        <div id="loading-indicator" class="loading-indicator" style="display: none;">
          <div class="spinner"></div>
          <p>Loading stories...</p>
        </div>
        
        <div class="load-more-container">
          <button id="load-more-btn" class="button primary">Load More</button>
        </div>
      </section>
    `;
  }

async afterRender() {
  this.setupEventListeners();
   window.addEventListener('online', () => {
    if (this._stories.length === 0) {
      this.presenter.loadInitialStories();
    }
  });
  
  window.addEventListener('offline', () => {
  });
  
  await this.presenter.loadInitialStories();
}

  renderStories(stories, filterType) {
    this._currentFilter = filterType;
    this._stories = stories;
    
    this._filteredStories = this._applyFilter(stories, filterType);
    
    const container = document.getElementById('stories-container');
    if (!container) return;
  
    container.innerHTML = this._filteredStories.map(story => `
      <article class="story-card" data-id="${story.id}">
        <div class="story-image">
          <img 
            src="${this._ensureValidImageUrl(story.photoUrl)}" 
            alt="${story.name}'s story" 
            loading="lazy"
            crossorigin="anonymous"
            style="background-color: #f5f5f5;"
          >
          ${story.lat && story.lon ? `
            <span class="location-badge" aria-label="Has location data">
              <i class="fas fa-map-marker-alt"></i>
            </span>
          ` : ''}
        </div>
        <div class="story-content">
          <h3>${story.name}</h3>
          <time datetime="${story.createdAt}">${showFormattedDate(story.createdAt)}</time>
          <p>${story.description}</p>
          <a href="#/detail/${story.id}" class="read-more">Read Full Story</a>
        </div>
      </article>
    `).join('');

    container.querySelectorAll('img').forEach(img => {
  img.addEventListener('error', () => {
    img.src = '/images/placeholder.jpg';
    img.style.objectFit = 'contain';
    img.style.padding = '1rem';
    img.style.backgroundColor = '#e0e0e0';
    this._handleImageError(img);
  });
});

  
    this.updateActiveFilterButton();
  }
  
  _ensureValidImageUrl(url) {
    if (!url) return '/images/placeholder.jpg';
    
    if (url.startsWith('blob:')) {
      return url;
    }
    
    if (!url.startsWith('http') && !url.startsWith('/')) {
      return `/${url}`;
    }
    return url;
  }
  
_handleImageError(imgElement) {
  imgElement.onerror = null; 
  
  if (imgElement.src.endsWith('placeholder.jpg')) {
    imgElement.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'200\' viewBox=\'0 0 300 200\'%3E%3Crect width=\'300\' height=\'200\' fill=\'%23e0e0e0\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' font-family=\'Arial\' font-size=\'16\' fill=\'%23666\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3EImage not available%3C/text%3E%3C/svg%3E';
  } else {
    imgElement.src = '/images/placeholder.jpg';
  }
  
  imgElement.style.objectFit = 'contain';
  imgElement.style.padding = '1rem';
  imgElement.style.backgroundColor = '#e0e0e0';
}

  _applyFilter(stories, filterType) {
    switch(filterType) {
      case 'with-location':
        return stories.filter(story => story.lat && story.lon);
      case 'recent':
        return [...stories].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 6);
      default:
        return stories;
    }
  }

  updateActiveFilterButton() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === this._currentFilter);
      btn.setAttribute('aria-pressed', btn.classList.contains('active'));
    });
  }

  setupEventListeners() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.presenter.applyFilter(btn.dataset.filter);
      });
    });

    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        loadMoreBtn.disabled = true;
        this.presenter.loadMoreStories()
          .finally(() => {
            loadMoreBtn.disabled = false;
          });
      });
    }
  }

  showLoading(show) {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
      loader.style.display = show ? 'flex' : 'none';
    }
  }

  showError(message) {
    const container = document.getElementById('stories-container');
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    if (loadMoreBtn) {
      loadMoreBtn.style.display = 'none';
    }
    
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <p>${message}</p>
          <button id="retry-button" class="button primary">Try Again</button>
        </div>
      `;

      document.getElementById('retry-button')?.addEventListener('click', () => {
        this.presenter.loadInitialStories();
      });
    }
  }

  toggleLoadMoreButton(show) {
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.style.display = show ? 'block' : 'none';
    }
  }
}