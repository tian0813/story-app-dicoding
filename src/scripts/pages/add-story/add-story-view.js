import { View } from '../mvp/mvp-base';
import { initBaseLayers } from '../../utils/map-utils';

export default class AddStoryView extends View {
  constructor() {
    super();
    this._mediaStream = null;
    this._map = null;
    this._marker = null;
    this._position = null;
    this.L = null;
  }

  async render() {
    const token = localStorage.getItem('token');
    
    return `
      <section class="container" aria-labelledby="add-story-title">
        <h1 id="add-story-title">Add New Story</h1>
        
        ${!token ? `
          <div class="guest-notice" aria-live="polite">
            <p>You're adding a story as a guest. <a href="#/auth">Login</a> to save to your account.</p>
          </div>
        ` : ''}
        
        <form id="story-form" class="story-form">
          <div class="form-group">
            <label for="story-description">Description</label>
            <textarea 
              id="story-description" 
              required
              aria-required="true"
              minlength="10"
              placeholder="Share your story..."
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>Photo</label>
            <div class="photo-options">
              <button 
                type="button" 
                id="take-photo"
                aria-label="Take photo using camera"
              >
                Take Photo
              </button>
              <input 
                type="file" 
                id="story-photo" 
                accept="image/*"
                aria-label="Upload photo"
                capture="environment"
              >
            </div>
            <video id="camera-preview" style="display: none;" aria-hidden="true"></video>
            <canvas id="photo-canvas" style="display: none;" aria-hidden="true"></canvas>
            <div id="photo-preview-container" class="photo-preview"></div>
          </div>
          
          <div class="form-group">
            <label id="map-label">Location (click on map to set)</label>
            <div 
              id="story-map" 
              style="height: 300px;"
              aria-labelledby="map-label"
              tabindex="0"
            ></div>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="button primary">Submit Story</button>
            <a href="#/" class="button secondary">Cancel</a>
          </div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    await this.presenter.initMap();
    this.setupCamera();
    this.setupForm();
  }

  async initMap(L) {
    this.L = L;
    
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      iconUrl: require('leaflet/dist/images/marker-icon.png'),
      shadowUrl: require('leaflet/dist/images/marker-shadow.png')
    });

    this._map = L.map('story-map').setView([0, 0], 2);
    initBaseLayers(this._map, L);

    this._map.on('click', (e) => {
      this.presenter.updatePosition(e.latlng, 'Selected location');
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.presenter.updatePosition(
            L.latLng(latitude, longitude), 
            'Your current location'
          );
          this._map.setView([latitude, longitude], 13);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  }

  updateMapMarker(latlng, popupText) {
    if (!this._map || !this.L) return;
    
    this._position = latlng;
    if (this._marker) {
      this._map.removeLayer(this._marker);
    }
    
    this._marker = this.L.marker(latlng)
      .addTo(this._map)
      .bindPopup(popupText)
      .openPopup();
  }

  async processCanvasImage() {
    const canvas = document.getElementById('photo-canvas');
    return new Promise((resolve) => {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const previewImg = document.querySelector('#photo-preview-container img');
      if (previewImg) {
        ctx.drawImage(previewImg, 0, 0, canvas.width, canvas.height);
      }
      
      canvas.toBlob(blob => {
        resolve(new File([blob], 'photo.jpg', { 
          type: 'image/jpeg',
          lastModified: Date.now()
        }));
      }, 'image/jpeg', 0.85);
    });
  }

  async convertToJpeg(file) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(blob => {
          resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now()
          }));
          URL.revokeObjectURL(url);
        }, 'image/jpeg', 0.85);
      };
      
      img.src = url;
    });
  }

  stopCamera() {
    if (this._mediaStream) {
      this._mediaStream.getTracks().forEach(track => track.stop());
      this._mediaStream = null;
    }
    const video = document.getElementById('camera-preview');
    if (video) {
      video.style.display = 'none';
      video.srcObject = null;
    }
  }

  setupCamera() {
    const takePhotoBtn = document.getElementById('take-photo');
    const video = document.getElementById('camera-preview');
    const canvas = document.getElementById('photo-canvas');
    const photoInput = document.getElementById('story-photo');
    const previewContainer = document.getElementById('photo-preview-container');
  
    takePhotoBtn.addEventListener('click', async () => {
      try {
        if (this._mediaStream) {
          this.stopCamera();
        }

        const constraints = {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };

        this._mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
          .catch(async () => {
            return await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'user' }
            });
          });

        video.srcObject = this._mediaStream;
        video.style.display = 'block';
        photoInput.style.display = 'none';
        previewContainer.innerHTML = '';

        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            video.play().then(resolve).catch(console.error);
          };
        });

        const captureBtn = document.createElement('button');
        captureBtn.textContent = 'Capture Photo';
        captureBtn.className = 'button';
        captureBtn.type = 'button';

        captureBtn.addEventListener('click', () => {
          if (video.videoWidth === 0 || video.videoHeight === 0) {
            console.error('Video dimensions are zero');
            this.presenter.showToast('Please wait for camera to be ready', 'error');
            return;
          }

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          this.stopCamera();

          const img = document.createElement('img');
          img.src = canvas.toDataURL('image/jpeg', 0.8);
          img.alt = 'Captured photo';
          
          previewContainer.innerHTML = '';
          previewContainer.appendChild(img);
        });

        previewContainer.appendChild(captureBtn);

      } catch (error) {
        console.error('Camera error:', error);
        this.presenter.showToast('Could not access camera. Please check permissions.', 'error');
        photoInput.style.display = 'block';
      }
    });
  
    photoInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
          previewContainer.innerHTML = '';
          const img = document.createElement('img');
          img.src = event.target.result;
          img.alt = 'Selected photo';
          previewContainer.appendChild(img);
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    });
  }

  setupForm() {
    const form = document.getElementById('story-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const previewImg = document.querySelector('#photo-preview-container img');
      this.presenter.handleFormSubmit({
        description: document.getElementById('story-description').value.trim(),
        photoInput: document.getElementById('story-photo'),
        previewImg: previewImg,
        position: this._position
      });
    });
  }

  showLoading(show) {
    const submitBtn = document.querySelector('.story-form .button.primary');
    if (submitBtn) {
      submitBtn.disabled = show;
      submitBtn.innerHTML = show 
        ? '<span class="spinner"></span> Submitting...' 
        : 'Submit Story';
    }
  }

  navigateToHome() {
    window.location.hash = '#/';
  }
}