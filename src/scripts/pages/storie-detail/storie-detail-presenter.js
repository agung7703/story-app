import { reportMapper } from '../../data/api-mapper';

const LOCAL_STORAGE_KEY = 'subscribedStories';

export default class StorieDetailPresenter {
  #reportId;
  #view;
  #apiModel;
  #subscribedStories = new Set();

  constructor(reportId, { view, apiModel }) {
    this.#reportId = reportId;
    this.#view = view;
    this.#apiModel = apiModel;
    this.#initializeSubscribedStories();
  }

  #getSubscribedStoriesFromStorage() {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return new Set(parsed);
        }
      } catch {
        // ignore parse errors
      }
    }
    return new Set();
  }

  #saveSubscribedStoriesToStorage() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(Array.from(this.#subscribedStories)));
  }

  async #initializeSubscribedStories() {
    try {
      // Restore from localStorage
      this.#subscribedStories = this.#getSubscribedStoriesFromStorage();

      // Also check push subscription existence
      const subscription = await this.#getPushSubscription();
      if (subscription) {
        // For simplicity, add current reportId if subscription exists
        this.#subscribedStories.add(this.#reportId);
      }

      // Save updated subscribed stories to storage
      this.#saveSubscribedStoriesToStorage();
    } catch (error) {
      console.error('initializeSubscribedStories: error:', error);
    }
  }

  addSubscribedStoryToList() {
    this.#subscribedStories.add(this.#reportId);
    this.#saveSubscribedStoriesToStorage();
  }

  removeSubscribedStoryFromList() {
    this.#subscribedStories.delete(this.#reportId);
    this.#saveSubscribedStoriesToStorage();
  }

  async showReportDetailMap() {
    this.#view.showMapLoading();
    try {
      await this.#view.initialMap();
    } catch (error) {
      console.error('showReportDetailMap: error:', error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async showReportDetail() {
    this.#view.showReportDetailLoading();
    try {
      const response = await this.#apiModel.getStorieById(this.#reportId); // Gunakan #reportId

      // Cek apakah permintaan berhasil
      if (!response.ok) {
        console.error('showReportDetail: response:', response);
        this.#view.populateReportDetailError(response.message);
        return;
      }

      // Cek apakah listStory ada dan tidak kosong
      if (!response.story || response.story.length === 0) {
        this.#view.populateReportDetailError('Tidak ada cerita ditemukan.');
        return;
      }

      const story = response.story; // Ambil cerita pertama
      // Cek apakah lat tidak undefined
      if (typeof story.lat === 'undefined') {
        this.#view.populateReportDetailError('Data story tidak valid.');
        return;
      }

      // Panggil reportMapper dengan objek story yang valid
      const mappedStory = await reportMapper(story);

      this.#view.populateReportDetailAndInitialMap(response.message, mappedStory);
    } catch (error) {
      console.error('showReportDetailAndMap: error:', error);
      this.#view.populateReportDetailError(error.message);
    } finally {
      this.#view.hideReportDetailLoading();
    }
  }

  async showSaveButton() {
    try {
      if (this.#subscribedStories.has(this.#reportId)) {
        this.#view.renderRemoveButton();
      } else {
        this.#view.renderSaveButton();
      }
    } catch (error) {
      console.error('showSaveButton: error:', error);
      this.#view.renderSaveButton();
    }
  }

  async subscribeToStory(subscriptionData) {
    try {
      console.log('subscribeToStory: using provided subscription data:', subscriptionData);
      if (!subscriptionData || !subscriptionData.endpoint || !subscriptionData.keys) {
        throw new Error('Invalid subscription data');
      }
      const response = await this.#apiModel.subscribePushNotification({
        endpoint: subscriptionData.endpoint,
        keys: {
          p256dh: subscriptionData.keys.p256dh || '',
          auth: subscriptionData.keys.auth || '',
        },
      });
      if (!response.ok) {
        throw new Error(response.message || 'Failed to subscribe');
      }
      this.#subscribedStories.add(this.#reportId);
      this.#saveSubscribedStoriesToStorage();
      return subscriptionData;
    } catch (error) {
      console.error('subscribeToStory: error:', error);
      throw error;
    }
  }

  async unsubscribeFromStory(subscriptionData) {
    try {
      if (!subscriptionData || !subscriptionData.endpoint) {
        throw new Error('Invalid subscription data');
      }
      const response = await this.#apiModel.unsubscribePushNotification({
        endpoint: subscriptionData.endpoint,
      });
      if (!response.ok) {
        throw new Error(response.message || 'Failed to unsubscribe');
      }
      this.#subscribedStories.delete(this.#reportId);
      this.#saveSubscribedStoriesToStorage();
      return true;
    } catch (error) {
      console.error('unsubscribeFromStory: error:', error);
      throw error;
    }
  }

  async #getPushSubscription() {
    try {
      console.log('#getPushSubscription: checking service worker support');
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service workers are not supported in this browser.');
      }
      console.log('#getPushSubscription: waiting for service worker ready');
      const registration = await navigator.serviceWorker.ready;
      console.log('#getPushSubscription: service worker ready', registration);
      const subscription = await registration.pushManager.getSubscription();
      console.log('#getPushSubscription: push subscription', subscription);
      return subscription;
    } catch (error) {
      console.error('#getPushSubscription: error:', error);
      throw error;
    }
  }

  #isReportSaved() {
    return false;
  }
}
