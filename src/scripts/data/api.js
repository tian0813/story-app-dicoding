// src/scripts/data/api.js
// api.js
import CONFIG from '../config';
import { saveStories, getStories as getStoriesFromIDB } from '../utils/indexedDB';

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  STORIES_GUEST: `${CONFIG.BASE_URL}/stories/guest`,
  NOTIFICATION_SUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`,
  NOTIFICATION_UNSUBSCRIBE: `${CONFIG.BASE_URL}/notifications/unsubscribe`,
};

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function register({ name, email, password }) {
  const response = await fetch(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  return response.json();
}

export async function login({ email, password }) {
  const response = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
}

export async function getStories({ page = 1, size = 10, location = 0 } = {}) {
  const response = await fetch(
    `${ENDPOINTS.STORIES}?page=${page}&size=${size}&location=${location}`,
    { headers: getAuthHeaders() }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch stories: ${response.status}`);
  }

  const data = await response.json();

  if (data.error === false && data.listStory) {
    await saveStories(data.listStory);
  }

  return data;
}

export async function getStoriesGuest({ page = 1, size = 10, location = 0 } = {}) {
  const response = await fetch(
    `${ENDPOINTS.STORIES_GUEST}?page=${page}&size=${size}&location=${location}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch stories: ${response.status}`);
  }

  const data = await response.json();

  if (data.error === false && data.listStory) {
    await saveStories(data.listStory);
  }

  return data;
}

export async function getStoriesWithFallback(options = {}) {
  try {
    if (navigator.onLine) {
      const response = await getStories(options);

      if (response.listStory) {
        await saveStories(response.listStory);
      }

      return response;
    } else {
      const stories = await getStoriesFromIDB();
      return {
        error: false,
        message: 'Offline data loaded',
        listStory: stories || [],
        isOffline: true
      };
    }
  } catch (error) {
    console.error('Error in getStoriesWithFallback:', error);

    const stories = await getStoriesFromIDB();
    return {
      error: true,
      message: error.message,
      listStory: stories || [],
      isOffline: true
    };
  }
}

export async function getStoriesGuestWithFallback(options = {}) {
  try {
    if (navigator.onLine) {
      const response = await getStoriesGuest(options);
      if (response.listStory) {
        await saveStories(response.listStory);
      }

      return response;
    } else {
      const stories = await getStoriesFromIDB();
      return {
        error: false,
        message: 'Offline data loaded',
        listStory: stories || [],
        isOffline: true
      };
    }
  } catch (error) {
    console.error('Error in getStoriesGuestWithFallback:', error);

    const stories = await getStoriesFromIDB();
    return {
      error: true,
      message: error.message,
      listStory: stories || [],
      isOffline: true
    };
  }
}


export async function addStory({ data }) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');

  const response = await fetch(ENDPOINTS.STORIES, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: data,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add story');
  }

  return response.json();
}

export async function addStoryGuest({ data }) {
  const response = await fetch(ENDPOINTS.STORIES_GUEST, {
    method: 'POST',
    body: data,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add story as guest');
  }

  return response.json();
}

export async function getStoryDetail(id) {
  const response = await fetch(`${ENDPOINTS.STORIES}/${id}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch story detail: ${response.status}`);
  }

  return response.json();
}

export async function subscribePushNotification({ subscription }) {
  const token = localStorage.getItem('token');

  const subscriptionData = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.toJSON().keys.p256dh,
      auth: subscription.toJSON().keys.auth
    }
  };

  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }


  const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(subscriptionData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Subscription failed');
  }

  return response.json();
}

export async function unsubscribePushNotification({ endpoint }) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
    method: 'DELETE',
    headers: headers,
    body: JSON.stringify({ endpoint }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Unsubscription failed');
  }

  return response.json();
}