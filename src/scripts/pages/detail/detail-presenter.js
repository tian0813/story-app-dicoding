import { Presenter } from '../mvp/mvp-base';
import { getStoryDetail } from '../../data/api';
import { parseActivePathname } from '../../routes/url-parser';
import { showToast } from '../../utils/toast';
import {
  LIKE_STORE,
  getByIndex,
  likeStory,
  unlikeStory,
  bookmarkStory,
  removeBookmark,
  getBookmarkedStories,
  openDB
} from '../../utils/indexedDB';


export default class DetailPresenter extends Presenter {
  constructor(view) {
    super(view);
    this._story = null;
  }

  async loadStory() {
    try {
      const { id } = parseActivePathname();
      if (!id) throw new Error('Invalid story ID');

      const response = await getStoryDetail(id);
      if (!response.story) throw new Error('Story not found');

      this._story = response.story;
      this.view.showStoryDetail(response.story);
      this._setupButtons(response.story);

      const { isBookmarked, isLiked } = await this.checkStatus(response.story.id);
      this.view.updateButtons(isBookmarked, isLiked);

      if (response.story.lat && response.story.lon) {
        await this.view.initStoryMap({
          lat: response.story.lat,
          lon: response.story.lon,
          description: response.story.description,
        });
      }
    } catch (error) {
      this.view.showError(error.message);
      showToast(error.message, 'error');
    }
  }

  async checkStatus(storyId) {
    const bookmarks = await getBookmarkedStories();
    const isBookmarked = bookmarks.some(s => s.id === storyId);

    const db = await openDB();
    const tx = db.transaction(LIKE_STORE, 'readonly');
    const likeStore = tx.objectStore(LIKE_STORE);
    const likes = await getByIndex(likeStore.index('by_story_id'), storyId);
    const isLiked = likes.length > 0;

    return { isBookmarked, isLiked };
  }

_setupButtons(story) {
  const bookmarkBtn = document.getElementById('bookmark-btn');
  const likeBtn = document.getElementById('like-btn');

  let isBookmarked = false;
  let isLiked = false;

  const updateUI = () => {
    this.view.updateButtons(isBookmarked, isLiked);
  };

  this.checkStatus(story.id).then(status => {
    isBookmarked = status.isBookmarked;
    isLiked = status.isLiked;
    updateUI();
  });

  bookmarkBtn?.addEventListener('click', async () => {
    if (isBookmarked) {
      const success = await removeBookmark(story.id);
      if (success) {
        isBookmarked = false;
        showToast('Bookmark removed', 'success');
      } else {
        showToast('Failed to remove bookmark', 'error');
      }
    } else {
      const success = await bookmarkStory(story);
      if (success) {
        isBookmarked = true;
        showToast('Bookmarked!', 'success');
      } else {
        showToast('Failed to bookmark', 'error');
      }
    }
    updateUI();
  });

  likeBtn?.addEventListener('click', async () => {
    if (isLiked) {
      const success = await unlikeStory(story.id);
      if (success) {
        isLiked = false;
        showToast('Like removed', 'success');
      } else {
        showToast('Failed to remove like', 'error');
      }
    } else {
      const success = await likeStory(story.id);
      if (success) {
        isLiked = true;
        showToast('You liked this place!', 'success');
      } else {
        showToast('Failed to like', 'error');
      }
    }
    updateUI();
  });
}
}
