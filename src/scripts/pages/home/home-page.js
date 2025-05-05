import {
  generateLoaderAbsoluteTemplate,
  generateReportItemOfflineTemplate,
  generateReportItemTemplate,
  generateReportsListEmptyTemplate,
  generateReportsListErrorTemplate,
} from '../../templates';
import HomePresenter from './home-presenter';
import Map from '../../utils/map';
import * as LaporAPI from '../../data/api';
import { getAllStories, deleteStory } from '../../utils/indexeddb';
import Swal from 'sweetalert2';

export default class HomePage {
  #presenter = null;
  #map;
  #storedStories = [];

  async render() {
    return `
      <section>
        <div class="reports-list__map__container">
          <div id="map" class="reports-list__map"></div>
          <div id="map-loading-container"></div>
        </div>
      </section>

      <section class="container">
        <h1 class="section-title">Daftar Story</h1>

        <div class="reports-list__container">
          <div id="reports-list"></div>
          <div id="reports-list-loading-container"></div>
        </div>
        </section>

        <section class="container">
          <h1 class="section-title">Stored Stories (Offline)</h1>
          <button id="sync-offline-stories-btn" class="btn offline-btn btn-primary">Sync Offline Stories</button>
          <div class="report-list__container">
          
            <div id="stored-stories-list" class="stored-stories-list"></div>
            <div id="reports-list-loading-container"></div>
          </div>
        </section>
    `;
  }

  async afterRender() {
    this.#presenter = new HomePresenter({
      view: this,
      model: LaporAPI,
    });

    // Request notification permission on page load
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission status:', permission);
      });
    }

    await this.#presenter.initialGalleryAndMap();
    await this.#loadStoredStories();

    document.getElementById('sync-offline-stories-btn').addEventListener('click', async () => {
      await this.#syncOfflineStories();
    });
  }

  async #syncOfflineStories() {
    if (!navigator.onLine) {
      Swal.fire({
        icon: 'warning',
        title: 'Tidak ada koneksi internet',
        text: 'Silakan sambungkan ke internet untuk melakukan sinkronisasi.',
      });
      return;
    }

    this.showLoading();

    for (const story of this.#storedStories) {
      try {
        await this.#presenter.model.postNewReport(story);
        await deleteStory(story.id);
      } catch (error) {
        console.error('Gagal sinkronisasi story:', story, error);
      }
    }

    await this.#loadStoredStories();
    this.hideLoading();

    Swal.fire({
      icon: 'success',
      title: 'Sinkronisasi selesai',
      text: 'Semua story offline berhasil disinkronisasi.',
    });
  }

  async #loadStoredStories() {
    this.#storedStories = await getAllStories();
    this.#renderStoredStories();
  }

  #renderStoredStories() {
    const listElement = document.getElementById('stored-stories-list');
    if (!listElement) return;

    listElement.innerHTML = this.#storedStories
      .map((story) =>
        generateReportItemOfflineTemplate({
          id: story.id,
          description: story.description,
          photoUrl: story.photo ? URL.createObjectURL(story.photo) : '',
          name: story.name || 'Unknown',
          createdAt: story.createdAt || new Date().toISOString(),
          lat: story.lat || 0,
          lon: story.lon || 0,
        }),
      )
      .join('');

    listElement.querySelectorAll('.report-item').forEach((item) => {
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          item.querySelector('.report-item__read-more').click();
        }
      });
    });

    listElement.querySelectorAll('.delete-story-btn').forEach((button) => {
      button.addEventListener('click', async (event) => {
        const id = event.target.getAttribute('data-id');
        await deleteStory(id);
        await this.#loadStoredStories();
      });
    });
  }

  populateReportsList(message, listStory) {
    if (listStory.length <= 0) {
      this.populateReportsListEmpty();
      return;
    }

    const validStoriesForMap = listStory.filter(
      (story) =>
        story.lat !== null &&
        story.lon !== null &&
        typeof story.lat === 'number' &&
        typeof story.lon === 'number',
    );

    const html = listStory.reduce((accumulator, story) => {
      return accumulator.concat(
        generateReportItemTemplate({
          ...story,
          name: story.name,
        }),
      );
    }, '');

    if (this.#map) {
      validStoriesForMap.forEach((story) => {
        const coordinate = [story.lat, story.lon];
        const markerOptions = { alt: story.name };
        const popupOptions = { content: story.name };
        this.#map.addMarker(coordinate, markerOptions, popupOptions);
      });
    }

    document.getElementById('reports-list').innerHTML = `
      <div class="reports-list">${html}</div>
    `;
  }

  populateReportsListEmpty() {
    document.getElementById('reports-list').innerHTML = generateReportsListEmptyTemplate();
  }

  populateReportsListError(message) {
    document.getElementById('reports-list').innerHTML = generateReportsListErrorTemplate(message);
  }

  async initialMap() {
    // TODO: map initialization
    if (this.#map) {
      console.warn('Peta sudah diinisialisasi.');
      return; // Keluar jika peta sudah ada
    }

    // Mendapatkan posisi pengguna dengan timeout
    const getPositionWithTimeout = (timeout = 5000) => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('Geolocation timeout'));
        }, timeout);

        Map.getCurrentPosition()
          .then((position) => {
            clearTimeout(timer);
            resolve(position);
          })
          .catch((error) => {
            clearTimeout(timer);
            reject(error);
          });
      });
    };

    try {
      const position = await getPositionWithTimeout(5000);
      const coordinate = [position.coords.latitude, position.coords.longitude];

      // Pastikan koordinat valid
      if (coordinate[0] === undefined || coordinate[1] === undefined) {
        console.error('Koordinat tidak valid, menggunakan default.');
        return new Map('#map', { zoom: 10, center: [-6.2, 106.816666] });
      }

      this.#map = await Map.build('#map', {
        zoom: 10,
        locate: true,
        center: coordinate,
      });
    } catch (error) {
      console.error('Error saat menginisialisasi peta:', error);
      this.#map = await Map.build('#map', {
        zoom: 10,
        center: [-6.2, 106.816666], // Koordinat default
      });
    }
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  showLoading() {
    document.getElementById('reports-list-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideLoading() {
    document.getElementById('reports-list-loading-container').innerHTML = '';
  }
}
