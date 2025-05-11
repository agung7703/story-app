import { reportMapper } from '../../data/api-mapper';
import BookmarkPage from '../bookmark/bookmark-page.js';
import BookmarkPresenter from '../bookmark/bookmark-presenter.js';

export default class StorieDetailPresenter {
  #reportId;
  #view;
  #apiModel;
  #bookmarkPresenter;
  #currentStory;

  constructor(reportId, { view, apiModel }) {
    this.#reportId = reportId;
    this.#view = view;
    this.#apiModel = apiModel;
    // Initialize bookmark presenter without view to separate data logic from DOM rendering
    this.#bookmarkPresenter = new BookmarkPresenter(null);
  }

  async initBookmarkPresenter() {
    // No DOM container initialization needed here
    // Just load bookmarks data if needed
    await this.#bookmarkPresenter.loadBookmarks();
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
      const response = await this.#apiModel.getStorieById(this.#reportId);

      if (!response.ok) {
        console.error('showReportDetail: response:', response);
        this.#view.populateReportDetailError(response.message);
        return;
      }

      if (!response.story || response.story.length === 0) {
        this.#view.populateReportDetailError('Tidak ada cerita ditemukan.');
        return;
      }

      const story = response.story;

      if (typeof story.lat === 'undefined') {
        this.#view.populateReportDetailError('Data story tidak valid.');
        return;
      }

      const mappedStory = await reportMapper(story);

      this.#view.populateReportDetailAndInitialMap(response.message, mappedStory);
      this.#currentStory = mappedStory; // Save the full story for bookmarking
      await this.showSaveButton();
    } catch (error) {
      console.error('showReportDetailAndMap: error:', error);
      this.#view.populateReportDetailError(error.message);
    } finally {
      this.#view.hideReportDetailLoading();
    }
  }

  async showSaveButton() {
    try {
      const bookmarks = this.#bookmarkPresenter.getBookmarks();
      const isBookmarked = bookmarks.some((b) => b.id === this.#reportId);
      if (isBookmarked) {
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
      // Use the full story saved in this.#currentStory for bookmarking
      if (!this.#currentStory) {
        throw new Error('No story loaded to bookmark');
      }
      console.log('Adding story to bookmarks:', this.#currentStory);
      await this.#bookmarkPresenter.addBookmark(this.#currentStory);
      return subscriptionData;
    } catch (error) {
      console.error('subscribeToStory: error:', error, error.stack);
      throw error;
    }
  }

  async unsubscribeFromStory(subscriptionData) {
    try {
      // Directly remove story from IndexedDB without DOM-dependent calls
      await this.#bookmarkPresenter.removeBookmark(this.#reportId);
      return true;
    } catch (error) {
      console.error('unsubscribeFromStory: error:', error);
      throw error;
    }
  }
}
