// src/scripts/pages/detail/detail-view.js
import { View } from '../mvp/mvp-base';
import { showFormattedDate } from '../../utils';
import { initBaseLayers, fixLeafletIcons } from '../../utils/map-utils';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

export default class DetailView extends View {
  constructor() {
    super();
    this._story = null;
    this._map = null;
  }

  async render() {
    return `
      <section class="container" aria-labelledby="detail-title">
        <a href="#/" class="back-button" aria-label="Back to stories">← Back</a>
        <div class="story-detail">
          <div class="loading-placeholder">
            <div class="spinner"></div>
            <p>Loading story details...</p>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    await this.presenter.loadStory();
  }

  showStoryDetail(story) {
    this._story = story;
    const storyDetailElement = document.querySelector('.story-detail');
    storyDetailElement.innerHTML = this._createStoryDetailHTML();
  }

 updateButtons(isBookmarked, isLiked) {
  const bookmarkBtn = document.getElementById('bookmark-btn');
  const likeBtn = document.getElementById('like-btn');

  if (bookmarkBtn && isBookmarked !== null) {
    bookmarkBtn.textContent = isBookmarked ? '🔖 Bookmarked' : '🔖 Bookmark';
    bookmarkBtn.disabled = false;
  }

  if (likeBtn && isLiked !== null) {
    likeBtn.textContent = isLiked ? '❤️ Liked' : '❤️ Like';
    likeBtn.disabled = false;
  }
}

  async initStoryMap({ lat, lon, description }) {
    try {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: icon,
        iconUrl: icon,
        shadowUrl: iconShadow
      });

      fixLeafletIcons();

      this._map = L.map('detail-map').setView([lat, lon], 13);
      initBaseLayers(this._map, L);

      L.marker([lat, lon]).addTo(this._map)
        .bindPopup(`
          <b>Story Location</b><br>
          Latitude: ${lat.toFixed(4)}<br>
          Longitude: ${lon.toFixed(4)}<br>
          ${description ? `Description: ${description}` : ''}
        `)
        .openPopup();
    } catch (mapError) {
      console.error('Error initializing map:', mapError);
      this.showMapFallback(lat, lon);
    }
  }

  showMapFallback(lat, lon) {
    const mapContainer = document.querySelector('.map-container');
    if (mapContainer) {
      mapContainer.innerHTML = `
        <p class="map-error">Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}</p>
      `;
    }
  }

  _createStoryDetailHTML() {
    return `
      <article class="story-detail-card">
        <img src="${this._story.photoUrl}" 
             alt="${this._story.description || 'Story image'}" 
             crossorigin="anonymous"
             loading="lazy"
             onerror="this.onerror=null;this.src='./images/placeholder.jpg'">
        <div class="story-detail-content">
          <h1 id="detail-title">${this._story.name}</h1>
          <time datetime="${this._story.createdAt}">${showFormattedDate(this._story.createdAt)}</time>
          <p class="story-description">${this._story.description}</p>
          
          <div class="story-actions">
            <button id="bookmark-btn" class="action-button">🔖 Bookmark</button>
            <button id="like-btn" class="action-button">❤️ Like</button>
          </div>

          ${this._story.lat && this._story.lon ? `
            <div class="map-container">
              <h2>Location</h2>
              <div id="detail-map" aria-label="Story location map" tabindex="0"></div>
            </div>
          ` : ''}
        </div>
      </article>
    `;
  }

  showError(message) {
    const storyDetailElement = document.querySelector('.story-detail');
    storyDetailElement.innerHTML = `
      <div class="error-container">
        <h2>Failed to Load Story</h2>
        <p>${message}</p>
        <button id="retry-button" class="retry-button">Try Again</button>
      </div>
    `;

    document.getElementById('retry-button').addEventListener('click', () => {
      this.presenter.loadStory();
    });
  }
}