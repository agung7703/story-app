import { addStory, getAllStories, deleteStory } from '../../utils/indexeddb.js';
import { getStorieById } from '../../data/api.js';

class BookmarkDataManager {
  constructor() {
    this.bookmarkedStories = [];
  }

  async loadBookmarks() {
    const allBookmarkedStories = await getAllStories();

    // Filter out stories that no longer exist by verifying with API
    const verifiedStories = [];
    for (const story of allBookmarkedStories) {
      try {
        const response = await getStorieById(story.id);
        if (response.ok) {
          verifiedStories.push(story);
        } else {
          // Optionally delete story from IndexedDB if it no longer exists
          await deleteStory(story.id);
        }
      } catch (error) {
        console.error('Error verifying story existence:', error);
        // Keep the story in case of API error to avoid data loss
        verifiedStories.push(story);
      }
    }

    this.bookmarkedStories = verifiedStories;
  }

  async addBookmark(story) {
    try {
      console.log('Adding story to IndexedDB:', story);
      await addStory(story);
      console.log('Story added to IndexedDB successfully');
      this.bookmarkedStories.push(story);
    } catch (error) {
      console.error('addBookmark: error:', error, error.stack);
      throw error;
    }
  }

  async removeBookmark(storyId) {
    try {
      await deleteStory(storyId);
      this.bookmarkedStories = this.bookmarkedStories.filter((story) => story.id !== storyId);
    } catch (error) {
      console.error('removeBookmark: error:', error, error.stack);
      throw error;
    }
  }

  getBookmarks() {
    return this.bookmarkedStories;
  }
}

export default class BookmarkPresenter {
  constructor(bookmarkPage) {
    this.bookmarkPage = bookmarkPage;
    this.dataManager = new BookmarkDataManager();
  }

  async init(parentElement) {
    this.bookmarkPage.render();
    this.bookmarkPage.setBookmarkContainer();
    await this.loadBookmarks();
  }

  async loadBookmarks() {
    await this.dataManager.loadBookmarks();
    this.updateView();
  }

  async addBookmark(story) {
    await this.dataManager.addBookmark(story);
  }

  async removeBookmark(storyId) {
    await this.dataManager.removeBookmark(storyId);
  }

  getBookmarks() {
    return this.dataManager.getBookmarks();
  }

  updateView() {
    if (this.bookmarkPage && typeof this.bookmarkPage.renderBookmarks === 'function') {
      this.bookmarkPage.renderBookmarks(this.getBookmarks());
    }
  }
}
