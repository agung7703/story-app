import { getAccessToken } from '../../utils/auth';

import {
  generateLoaderAbsoluteTemplate,
  generateReportDetailErrorTemplate,
  generateReportDetailTemplate,
  generateSaveReportButtonTemplate,
  generateRemoveReportButtonTemplate,
} from '../../templates';
import { createCarousel } from '../../utils/index';
import StorieDetailPresenter from './storie-detail-presenter';
import { parseActivePathname } from '../../routes/url-parser';
import Map from '../../utils/map';
import * as LaporAPI from '../../data/api';

export default class StorieDetailPage {
  #presenter = null;
  #form = null;
  #map = null;

  async render() {
    return `
        <section>
          <div class="report-detail__container">
            <div id="report-detail" class="report-detail"></div>
            <div id="report-detail-loading-container"></div>
          </div>
        </section>
      
      `;
  }

  async afterRender() {
    this.#presenter = new StorieDetailPresenter(parseActivePathname().id, {
      view: this,
      apiModel: LaporAPI,
    });

    this.#presenter.showReportDetail();
  }

  async populateReportDetailAndInitialMap(message, story) {
    document.getElementById('report-detail').innerHTML = generateReportDetailTemplate({
      name: story.name,
      description: story.description,
      photoUrl: story.photoUrl,
      lat: story.lat,
      lon: story.lon,
      createdAt: story.createdAt,
    });

    // Carousel images
    const imagesContainer = document.getElementById('images');
    if (imagesContainer && imagesContainer.children.length > 1) {
      createCarousel(imagesContainer);
    }

    // Map
    await this.#presenter.showReportDetailMap();
    if (this.#map) {
      const reportCoordinate = [story.lat, story.lon];
      const markerOptions = { alt: story.name };
      const popupOptions = { content: story.name };
      this.#map.changeCamera(reportCoordinate);
      this.#map.addMarker(reportCoordinate, markerOptions, popupOptions);
    }

    // Actions buttons
    this.#presenter.showSaveButton();
  }

  populateReportDetailError(message) {
    document.getElementById('report-detail').innerHTML = generateReportDetailErrorTemplate(message);
  }

  async initialMap() {
    // TODO: map initialization
    this.#map = await Map.build('#map', {
      zoom: 15,
    });
  }

  clearForm() {
    this.#form.reset();
  }

  async renderSaveButton() {
    const saveActionsContainer = document.getElementById('save-actions-container');
    saveActionsContainer.innerHTML = generateSaveReportButtonTemplate();

    const saveButton = document.getElementById('report-detail-save');
    saveButton.disabled = false;

    // Remove existing event listeners by cloning the node
    const newSaveButton = saveButton.cloneNode(true);
    saveButton.parentNode.replaceChild(newSaveButton, saveButton);

    // Mock subscription data since service workers are not used
    const mockSubscriptionData = {
      endpoint: window.location.href,
      keys: {
        p256dh: 'p256dh',
        auth: getAccessToken(),
      },
    };

    newSaveButton.addEventListener('click', async () => {
      console.log('Subscribe button clicked');
      newSaveButton.disabled = true;
      newSaveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
      try {
        const subscription = await this.#presenter.subscribeToStory(mockSubscriptionData);
        console.log('Subscription result:', subscription);
        if (subscription) {
          await this.#presenter.showSaveButton();
          console.log('UI updated after subscription');
        } else {
          console.log('Subscription returned falsy value');
          newSaveButton.disabled = false;
          newSaveButton.innerHTML = generateSaveReportButtonTemplate();
        }
      } catch (error) {
        console.error('Error during subscription:', error);
        alert('Gagal subscribe: ' + error.message);
        newSaveButton.disabled = false;
        newSaveButton.innerHTML = generateSaveReportButtonTemplate();
      }
    });
  }

  async renderRemoveButton() {
    const saveActionsContainer = document.getElementById('save-actions-container');
    saveActionsContainer.innerHTML = generateRemoveReportButtonTemplate();

    const removeButton = document.getElementById('report-detail-remove');
    removeButton.disabled = false;
    removeButton.textContent = 'Buang laporan ';
    const icon = document.createElement('i');
    icon.className = 'fas fa-bookmark';
    removeButton.appendChild(icon);

    // Mock subscription data since service workers are not used
    const mockSubscriptionData = {
      endpoint: window.location.href,
      keys: {
        p256dh: 'p256dh',
        auth: getAccessToken(),
      },
    };

    removeButton.addEventListener('click', async () => {
      removeButton.disabled = true;
      removeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghapus...';
      try {
        const unsubscribed = await this.#presenter.unsubscribeFromStory(mockSubscriptionData);
        if (unsubscribed) {
          await this.#presenter.showSaveButton();
        }
      } catch (error) {
        alert('Gagal unsubscribe: ' + error.message);
        removeButton.disabled = false;
        removeButton.textContent = 'Buang laporan ';
        removeButton.appendChild(icon);
      }
    });
  }

  showReportDetailLoading() {
    document.getElementById('report-detail-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideReportDetailLoading() {
    document.getElementById('report-detail-loading-container').innerHTML = '';
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  showCommentsLoading() {
    document.getElementById('comments-list-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideCommentsLoading() {
    document.getElementById('comments-list-loading-container').innerHTML = '';
  }

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
        <button class="btn" type="submit" disabled>
          <i class="fas fa-spinner loader-button"></i> Tanggapi
        </button>
      `;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
        <button class="btn" type="submit">Tanggapi</button>
      `;
  }
}
