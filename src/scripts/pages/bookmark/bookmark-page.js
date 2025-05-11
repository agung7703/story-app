import { generateReportItemBookmarkTemplate } from '../../templates.js';
import BookmarkPresenter from './bookmark-presenter.js';

export default class BookmarkPage {
  constructor() {
    this.bookmarkContainer = null;
    this.bookmarkPresenter = new BookmarkPresenter(this);
  }

  async render() {
    return `
      <section class="container">
        <h1 class="section-title">Bookmark Stories</h1>
        <div class="reports-list__container">
          <div id="bookmark-list" class="bookmark-list"></div>
          <div id="reports-list-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    await this.bookmarkPresenter.init();
  }

  setBookmarkContainer() {
    this.bookmarkContainer = document.getElementById('bookmark-list');
  }

  renderBookmarks(bookmarkedStories) {
    if (!this.bookmarkContainer) {
      throw new Error('Bookmark container element is not set. Call setBookmarkContainer() first.');
    }

    if (!bookmarkedStories || bookmarkedStories.length === 0) {
      this.bookmarkContainer.innerHTML = '<p>Tidak ada story yang di-bookmark.</p>';
      return;
    }

    this.bookmarkContainer.innerHTML = bookmarkedStories
      .map((story) => generateReportItemBookmarkTemplate(story))
      .join('');
  }
}
