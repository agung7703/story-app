import {
  generateLoaderAbsoluteTemplate,
  generateReportItemTemplate,
  generateReportsListEmptyTemplate,
  generateReportsListErrorTemplate,
} from '../../templates';
import HomePresenter from './home-presenter';
import Map from '../../utils/map';
import * as LaporAPI from '../../data/api';

export default class HomePage {
  #presenter = null;
  #map;

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

    // Mendapatkan posisi pengguna
    try {
      const position = await Map.getCurrentPosition();
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
