import { Presenter } from '../mvp/mvp-base';
import { getBookmarkedStories, removeBookmark } from '../../utils/indexedDB';
import { showToast } from '../../utils/toast';

export default class BookmarkPresenter extends Presenter {
  constructor(view) {
    super(view);
    this._bookmarkedStories = [];
  }

  async loadBookmarkedStories() {
    this.view.showLoading(true);
    try {
      this._bookmarkedStories = await getBookmarkedStories();
      this.view.renderBookmarkedStories(this._bookmarkedStories);
    } catch (error) {
      console.error('Error loading bookmarked stories:', error);
      this.view.showError('Failed to load bookmarked stories.');
      showToast('Failed to load bookmarked stories.', 'error');
    } finally {
      this.view.showLoading(false);
    }
  }

  async handleDeleteBookmark(storyId) {
    try {
      const success = await removeBookmark(storyId);
      if (success) {
        showToast('Bookmark removed!', 'success');
        await this.loadBookmarkedStories();
      } else {
        showToast('Failed to remove bookmark.', 'error');
      }
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      showToast('Failed to remove bookmark.', 'error');
    }
  }
}