import { Presenter } from '../mvp/mvp-base';
import { addStory, addStoryGuest } from '../../data/api';
import { showToast } from '../../utils/toast';

export default class AddStoryPresenter extends Presenter {
  constructor(view) {
    super(view);
  }

  async initMap() {
    try {
      const L = await import('leaflet');
      await this.view.initMap(L);
    } catch (error) {
      console.error('Map initialization error:', error);
      this.showToast('Failed to initialize map', 'error');
    }
  }

  updatePosition(latlng, popupText) {
    this.view.updateMapMarker(latlng, popupText);
  }

  async handleFormSubmit({ description, photoInput, previewImg, position }) {
    this.view.showLoading(true);
    
    try {
      let photoFile;
      if (previewImg && previewImg.src.startsWith('data:')) {
        photoFile = await this.view.processCanvasImage();
      } else if (photoInput.files[0]) {
        photoFile = this._validateImageFile(photoInput.files[0]);
      } else {
        throw new Error('Please add a photo');
      }

      if (photoFile.type !== 'image/jpeg') {
        photoFile = await this.view.convertToJpeg(photoFile);
      }

      const formData = new FormData();
      formData.append('description', description.trim());
      formData.append('photo', photoFile, 'story.jpg');

      if (position) {
        formData.append('lat', position.lat.toString());
        formData.append('lon', position.lng.toString());
      }

      const token = localStorage.getItem('token');
      const response = token 
        ? await addStory({ token, data: formData })
        : await addStoryGuest({ data: formData });

      if (!response.error) {
        showToast('Story added successfully!');
        this.view.navigateToHome();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error adding story:', error);
      this.showToast(error.message, 'error');
    } finally {
      this.view.showLoading(false);
    }
  }

  _validateImageFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Only JPG, PNG or WebP images are allowed');
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('Image must be smaller than 5MB');
    }

    return file;
  }

  showToast(message, type = 'success') {
    showToast(message, type);
  }
}