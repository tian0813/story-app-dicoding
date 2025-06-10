// src/scripts/pages/story/story-presenter.js
import { Presenter } from '../mvp/mvp-base';
import { getStoriesWithFallback, getStoriesGuestWithFallback } from '../../data/api';
import { showToast } from '../../utils/toast';
import { isOnline } from '../../utils/network';
import CONFIG from '../../config';

export default class StoryPresenter extends Presenter {
  constructor(view) {
    super(view);
    this._currentPage = 1;
    this._itemsPerPage = 15;
    this._hasMore = true;
    this._currentFilter = 'all';
    this._isLoading = false;
    this._retryCount = 0;
    this._maxRetries = 3;
  }

  async loadInitialStories() {
    if (this._isLoading) return;
    
    this._isLoading = true;
    this._currentPage = 1;
    this._retryCount = 0;
    
    try {
      this.view.showLoading(true);
      this.view.toggleLoadMoreButton(false);
      this.view.showOfflineIndicator(false);
      
      const stories = await this._fetchWithRetry(this._currentPage);
      this._handleStoriesResponse(stories, true);
      
      if (!isOnline()) {
        this.view.showOfflineIndicator(true);
        if (stories.length > 0) {
          showToast('Showing offline data', 'info');
        } else {
          showToast('No cached stories available offline', 'warning');
        }
      }
    } catch (error) {
      this._handleLoadError(error, 'loadInitialStories');
      
      if (!isOnline()) {
        const cachedStories = await this._getCachedStories();
        if (cachedStories.length > 0) {
          this._handleStoriesResponse(cachedStories, true);
          this.view.showOfflineIndicator(true);
          showToast('Showing cached offline data', 'info');
        } else {
          this.view.showError('No internet connection and no cached stories available.');
        }
      } else {
        this.view.showError(`Failed to load stories: ${error.message}`);
      }
    } finally {
      this._isLoading = false;
      this.view.showLoading(false);
    }
  }

  async _getCachedStories() {
    try {
      const { getStories: getStoriesFromIDB } = await import('../../utils/indexedDB');
      return await getStoriesFromIDB();
    } catch (error) {
      console.error('Error getting cached stories from IndexedDB:', error);
      return [];
    }
  }

  _getStoriesEndpoint() {
    const token = localStorage.getItem('token');
    const ENDPOINTS = {
      STORIES: `${CONFIG.BASE_URL}/stories`,
      STORIES_GUEST: `${CONFIG.BASE_URL}/stories/guest`,
    };
    const baseUrl = token 
      ? `${ENDPOINTS.STORIES}?page=${this._currentPage}&size=${this._itemsPerPage}`
      : `${ENDPOINTS.STORIES_GUEST}?page=${this._currentPage}&size=${this._itemsPerPage}`;
    
    return baseUrl;
  }

  async _fetchWithRetry(page) {
    try {
      const token = localStorage.getItem('token');
      const response = token
        ? await getStoriesWithFallback({ page, size: this._itemsPerPage })
        : await getStoriesGuestWithFallback({ page, size: this._itemsPerPage });

      const stories = response.listStory || response.data?.stories || [];
      
      if (!Array.isArray(stories)) {
        throw new Error('Invalid stories data format');
      }
      
      return stories;
    } catch (error) {
      this._retryCount++;
      if (this._retryCount <= this._maxRetries && isOnline()) { 
        await new Promise(resolve => setTimeout(resolve, 1000 * this._retryCount));
        return this._fetchWithRetry(page);
      }
      throw error;
    }
  }

  _handleStoriesResponse(stories, isInitialLoad) {
    const allStories = isInitialLoad 
      ? stories 
      : [...this.view._stories, ...stories];
      
    this._hasMore = stories.length === this._itemsPerPage; 
    this.view.renderStories(allStories, this._currentFilter);
    this.view.toggleLoadMoreButton(this._hasMore);
    
    if (stories.length === 0 && !isInitialLoad) {
      showToast('No more stories to load', 'info');
    }
  }

  _handleLoadError(error, context) {
    console.error(`${context} error:`, error);
    
    if (this._retryCount >= this._maxRetries || !isOnline()) {
      showToast('Failed to load stories. Please try again later.', 'error');
    }
    
    if (context === 'loadMoreStories') {
      this._currentPage--; 
    }
  }

  async loadMoreStories() {
    if (this._isLoading || !this._hasMore) return;

    this._isLoading = true;
    this._retryCount = 0;
    this._currentPage++;

    try {
      this.view.showLoading(true);
      this.view.toggleLoadMoreButton(false);

      const stories = await this._fetchWithRetry(this._currentPage);
      this._handleStoriesResponse(stories, false);

      if (!isOnline()) {
        this.view.showOfflineIndicator(true);
      }
    } catch (error) {
      this._handleLoadError(error, 'loadMoreStories');
    } finally {
      this._isLoading = false;
      this.view.showLoading(false);
    }
  }

  applyFilter(filterType) {
    if (this._currentFilter === filterType) return;
    
    this._currentFilter = filterType;
    this.view.renderStories(this.view._stories, filterType);
  }

  refreshStories() {
    this.loadInitialStories();
  }
}