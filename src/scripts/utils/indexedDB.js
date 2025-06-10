// src/scripts/utils/indexedDB.js
const DB_NAME = 'dicoding-story-db';
const DB_VERSION = 3;
export const LIKE_STORE = 'likes';
export const BOOKMARK_STORE = 'bookmarks';
export const STORE_NAME = 'stories';
const TTL_DAYS = 7;

export async function getByIndex(index, value) {
  return new Promise((resolve, reject) => {
    const req = index.getAll(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}


export async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', event.target.error);
      reject('Database error');
    };

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by_date', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(BOOKMARK_STORE)) {
        const bookmarkStore = db.createObjectStore(BOOKMARK_STORE, { keyPath: 'id' });
        bookmarkStore.createIndex('by_story_id', 'storyId', { unique: true });
        bookmarkStore.createIndex('by_date', 'bookmarkedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(LIKE_STORE)) {
        const likeStore = db.createObjectStore(LIKE_STORE, { keyPath: 'id' });
        likeStore.createIndex('by_story_id', 'storyId', { unique: true });
        likeStore.createIndex('by_date', 'likedAt', { unique: false });
      }
    };
  });
}

// STORIES
export async function saveStories(stories) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    tx.onerror = () => console.error('Transaction error');

    // Clear existing stories before saving new ones if desired, or update selectively
    // await clearStore(store); // Consider if you always want to clear or just update
    
    // Use put to add or update stories
    await Promise.all(stories.map(story => putItem(store, story)));

    return true;
  } catch (error) {
    console.error('Error saving stories:', error);
    return false;
  }
}

export async function getStories() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    return await getAllItems(store.index('by_date'));
  } catch (error) {
    console.error('Error getting stories:', error);
    return [];
  }
}

// BOOKMARKS
export async function bookmarkStory(story) {
  try {
    const db = await openDB();
    const tx = db.transaction(BOOKMARK_STORE, 'readwrite');
    const store = tx.objectStore(BOOKMARK_STORE);

    // Check if story is already bookmarked
    const existing = await getByIndex(store.index('by_story_id'), story.id);
    if (existing.length > 0) {
      console.log('Story already bookmarked:', story.id);
      return false; // Already bookmarked
    }

    await putItem(store, {
      id: `bookmark_${story.id}`, // Unique key for the bookmark
      storyId: story.id, // Indexable property
      storyData: story, // Store the full story object
      bookmarkedAt: new Date().toISOString(),
    });
    console.log('Story bookmarked successfully:', story.id);
    return true;
  } catch (error) {
    console.error('Error bookmarking story:', error);
    return false;
  }
}

export async function removeBookmark(storyId) {
  try {
    const db = await openDB();
    const tx = db.transaction(BOOKMARK_STORE, 'readwrite');
    const store = tx.objectStore(BOOKMARK_STORE);
    
    // Find the bookmark entry using the storyId index
    const bookmarksToRemove = await getByIndex(store.index('by_story_id'), storyId);
    
    if (bookmarksToRemove.length === 0) {
      console.log('Bookmark not found for removal:', storyId);
      return false;
    }

    // Delete all found entries for this storyId (should ideally be one due to unique index)
    for (const bookmark of bookmarksToRemove) {
      await deleteItem(store, bookmark.id);
    }
    console.log('Bookmark removed successfully for story:', storyId);
    return true;
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return false;
  }
}

export async function getBookmarkedStories() {
  try {
    const db = await openDB();
    const tx = db.transaction(BOOKMARK_STORE, 'readonly');
    const store = tx.objectStore(BOOKMARK_STORE);
    const bookmarks = await getAllItems(store.index('by_date'));
    return bookmarks; // Return full bookmark objects, the view will extract storyData
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    return [];
  }
}

// LIKES
export async function likeStory(storyId) {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_NAME, LIKE_STORE], 'readwrite');
    const storyStore = tx.objectStore(STORE_NAME);
    const likeStore = tx.objectStore(LIKE_STORE);

    // Cek apakah sudah di-like
    const existing = await getByIndex(likeStore.index('by_story_id'), storyId);
    if (existing.length > 0) return false;

    // // Update like count in cached story data (optional, only if you cache individual stories)
    // const story = await getItem(storyStore, storyId);
    // if (story) {
    //   story.likes = (story.likes || 0) + 1;
    //   await putItem(storyStore, story);
    // }

    await putItem(likeStore, {
      id: `like_${storyId}_${Date.now()}`, // Unique ID for each like entry
      storyId, // Indexable story ID
      likedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error liking story:', error);
    return false;
  }
}

export async function unlikeStory(storyId) {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_NAME, LIKE_STORE], 'readwrite');
    const storyStore = tx.objectStore(STORE_NAME);
    const likeStore = tx.objectStore(LIKE_STORE);

    const likes = await getByIndex(likeStore.index('by_story_id'), storyId);
    if (!likes.length) return false;

    // // Update like count in cached story data (optional)
    // const story = await getItem(storyStore, storyId);
    // if (story && story.likes > 0) {
    //   story.likes -= 1;
    //   await putItem(storyStore, story);
    // }

    // Hapus semua record like terkait story ini
    for (const like of likes) {
      await deleteItem(likeStore, like.id);
    }

    return true;
  } catch (error) {
    console.error('Error unliking story:', error);
    return false;
  }
}

// CLEANUP OLD BOOKMARKS (Adjusted logic for bookmarks)
export async function cleanOldBookmarks() {
  try {
    const db = await openDB();
    const tx = db.transaction(BOOKMARK_STORE, 'readwrite');
    const store = tx.objectStore(BOOKMARK_STORE);
    const all = await getAllItems(store);

    const cutoff = Date.now() - TTL_DAYS * 24 * 60 * 60 * 1000;
    for (const item of all) {
      // Check if bookmarkedAt exists and is a valid date
      const date = item.bookmarkedAt ? new Date(item.bookmarkedAt).getTime() : 0;
      if (date < cutoff) {
        await deleteItem(store, item.id);
      }
    }
    console.log('Old bookmarks cleaned.');
  } catch (error) {
    console.error('Error cleaning old bookmarks:', error);
  }
}

// HELPERS (re-confirming these are correct)
async function clearStore(store) {
  return new Promise((resolve, reject) => {
    const req = store.clear();
    req.onsuccess = resolve;
    req.onerror = () => reject(req.error);
  });
}

async function putItem(store, item) {
  return new Promise((resolve, reject) => {
    const req = store.put(item);
    req.onsuccess = resolve;
    req.onerror = () => reject(req.error);
  });
}

async function getItem(store, key) {
  return new Promise((resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function deleteItem(store, key) {
  return new Promise((resolve, reject) => {
    const req = store.delete(key);
    req.onsuccess = resolve;
    req.onerror = () => reject(req.error);
  });
}

async function getAllItems(indexOrStore) {
  return new Promise((resolve, reject) => {
    const req = indexOrStore.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}