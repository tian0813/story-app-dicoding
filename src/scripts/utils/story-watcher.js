// src/scripts/utils/story-watcher.js
// story-watcher.js
import { getStories } from '../data/api';
import { displayNotification } from './notification';

let lastStoryId = null;

export function startStoryPolling(interval = 15000) {
  // Clear any existing polling interval to prevent duplicates
  if (self.storyPollingInterval) {
    clearInterval(self.storyPollingInterval);
  }

  self.storyPollingInterval = setInterval(async () => {
    try {
      // Only proceed if notification permission is granted
      if (Notification.permission !== 'granted') {
        console.log("Notification permission not granted, skipping polling.");
        return;
      }

      const response = await getStories({ page: 1, size: 1 });
      const latestStory = response.listStory?.[0];

      if (latestStory && latestStory.id !== lastStoryId) {
        // Only show notification if lastStoryId was previously set (i.e., not the very first load)
        if (lastStoryId !== null) {
          console.log("🎉 New story detected, showing notification");
          displayNotification('New Story Added!', {
            body: `${latestStory.name}: ${latestStory.description.slice(0, 100)}...`,
            icon: '/images/icons/icon-192x192.png',
            badge: '/images/icons/icon-192x192.png',
            url: '/#/detail/' + latestStory.id
          });
        }
        lastStoryId = latestStory.id; // Update lastStoryId for the next check
      } else if (!latestStory && lastStoryId !== null) {
        // Handle case where there are no stories, but we previously had a lastStoryId
        lastStoryId = null; // Reset if no stories are found
      }

    } catch (error) {
      console.error('Polling failed:', error);
    }
  }, interval);
}