import { View } from '../mvp/mvp-base';
import { showFormattedDate } from '../../utils';

export default class HomeView extends View {
  constructor() {
    super();
    this._stories = [];
    this._hasMore = true;
  }

  async render() {
    const token = localStorage.getItem('token');

    if (!token) {
      return `
        <section class="container">
          <h1 class="sr-only">Dicoding Stories</h1>
          <div class="hero">
            <div class="hero-content">
              <h2>Join My Web Story</h2>
              <div class="guest-actions">
                <a href="#/auth" class="button primary">Login</a>
              </div>
            </div>
          </div>
        </section>
      `;
    }

    return `
      <section class="container">
        <h1 class="sr-only">Dicoding's Stories</h1>
        <div class="hero">
          <div class="hero-content">
            <h2>All Stories</h2>
            <div class="hero-actions">
              <a href="#/add" class="button primary">Add Your Story</a>
              <button id="logout-btn" class="button secondary">Logout</button>
            </div>
          </div>
        </div>
        <div id="stories-container" class="stories-grid"></div>
        <div id="load-more-container" style="text-align: center; margin-top: 2rem;">
          ${
            this._hasMore
              ? '<button id="load-more-btn" class="button secondary">See More</button>'
              : ""
          }
        </div>
        <div id="loading-indicator" class="loading-indicator" style="display: none;">
          <p>Loading...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.setupEventListeners();
    await this.presenter.loadInitialStories();
    this.presenter.checkAuthStatus();
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  renderStories(stories, hasMore) {
    this._stories = stories;
    this._hasMore = hasMore;
    const container = document.getElementById("stories-container");
    const loadMoreContainer = document.getElementById("load-more-container");

    if (!container) return;

    container.innerHTML = stories
      .map(
        (story) => `
      <article class="story-card" data-id="${story.id}">
        <div class="story-image">
          <img
            src="${this._ensureValidImageUrl(story.photoUrl)}"
            alt="Story from ${story.name}"
            loading="lazy"
            crossorigin="anonymous"
            style="background-color: #f5f5f5;"
          >
          ${
            story.lat && story.lon
              ? `
            <span class="location-badge" aria-label="Having location data">
              <i class="fas fa-map-marker-alt"></i>
            </span>
          `
              : ""
          }
        </div>
        <div class="story-content">
          <h3>${story.name}</h3>
          <time datetime="${story.createdAt}">${showFormattedDate(
            story.createdAt
          )}</time>
          <p>${story.description}</p>
          <a href="#/detail/${
            story.id
          }" class="read-more">Read the Complete Story</a>
        </div>
      </article>
    `
      )
      .join("");

    // Menambahkan event listener error untuk setiap gambar yang baru dirender
    container.querySelectorAll("img").forEach((img) => {
      img.addEventListener("error", () => this._handleImageError(img));
    });

    if (loadMoreContainer) {
      if (this._hasMore) {
        loadMoreContainer.innerHTML =
          '<button id="load-more-btn" class="button secondary">See More</button>';
        document
          .getElementById("load-more-btn")
          ?.addEventListener("click", () => {
            this.presenter.loadMoreStories();
          });
      } else {
        loadMoreContainer.innerHTML = "<p>All stories have been loaded.</p>";
      }
    }
  }

  /**
   * Memastikan URL gambar valid atau mengembalikan placeholder.
   * @param {string} url - URL gambar dari API.
   * @returns {string} URL gambar yang valid atau URL placeholder.
   */
  _ensureValidImageUrl(url) {
    // Jika URL kosong, null, atau undefined, langsung kembalikan gambar placeholder
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return 'https://placehold.co/300x220/E0F2F7/0056B3?text=No+Image'; // Gambar placeholder
    } 

    // Jika URL adalah blob (misal dari kamera lokal), langsung gunakan
    if (url.startsWith("blob:")) {
      return url;
    }

    // Perbaikan untuk URL yang mungkin relatif atau tidak lengkap (opsional, tergantung API)
    // Jika tidak diawali http/https dan bukan path absolut (misal /images/foo.jpg), tambahkan '/'
    // Pertimbangkan kembali apakah API Anda selalu memberikan URL absolut
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("/")) {
      return `/${url}`;
    }

    // Tambahkan parameter cache-busting hanya jika URL adalah HTTP/HTTPS dan belum memiliki parameter
    // Ini membantu mengatasi masalah caching, tetapi bukan masalah URL yang rusak
    if (url.startsWith("http") && !url.includes("?")) {
      return `${url}?${Date.now()}`;
    }

    return url;
  }

  /**
   * Menangani error saat gambar gagal dimuat.
   * Mengganti src gambar dengan URL placeholder.
   * @param {HTMLImageElement} imgElement - Elemen gambar yang gagal dimuat.
   */
  _handleImageError(imgElement) {
    console.warn('Image failed to load:', imgElement.src);
    imgElement.src = 'https://placehold.co/300x220/E0F2F7/0056B3?text=Image+Error'; // Gambar placeholder untuk error
    imgElement.alt = 'Gambar tidak dapat dimuat'; // Perbarui alt text
  }

  setupEventListeners() {
    const logoutBtn = document.getElementById("logout-btn");

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => this.presenter.handleLogout());
      console.log("Logout button found and event listener attached!");
    } else {
      console.log("Logout button not found in DOM.");
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
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <p>${message}</p>
          <button class="button" id="retry-button">Try Again</button>
        </div>
      `;

      document.getElementById('retry-button')?.addEventListener('click', () => {
        this.presenter.loadInitialStories();
      });
    }
  }

  updateAuthElements(isAuthenticated) {
    const authElements = document.querySelectorAll('.auth-dependent');
    authElements.forEach(el => {
      el.style.display = isAuthenticated ? 'block' : 'none';
    });
  }

  stopCameraStream() {
    const videoElement = document.getElementById("camera-preview");
    if (videoElement?.srcObject) {
      videoElement.srcObject.getTracks().forEach((track) => track.stop());
      videoElement.srcObject = null;
    }
  }

  clearAuthData() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("name");
  }

  navigateToAuth() {
    window.location.hash = "#/auth";
  }

  getToken() {
    return localStorage.getItem("token");
  }
}
