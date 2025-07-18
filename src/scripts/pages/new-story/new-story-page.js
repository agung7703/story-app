import NewStoryPresenter from './new-story-presenter';
import { convertBase64ToBlob } from '../../utils/index';
import * as LaporAPI from '../../data/api';
import { generateLoaderAbsoluteTemplate } from '../../templates';
import Camera from '../../utils/camera';
import Map from '../../utils/map';
import Swal from 'sweetalert2';
import { addStory } from '../../utils/indexeddb';

export default class NewStoryPage {
  #presenter;
  #form;
  #camera;
  #isCameraOpen = false;
  #takenDocumentations = [];
  #map;

  async render() {
    return `
      <section>
        <div class="new-report__header">
          <div class="container">
            <h1 class="new-report__header__title">Buat Story Baru</h1>
            <p class="new-report__header__description">
              Silakan lengkapi formulir di bawah untuk membuat Story baru.<br>
              Pastikan Anda melengkapi semua form dibawah 😉.
            </p>
          </div>
        </div>
      </section>
  
      <section class="container">
        <div class="new-form__container">
          <form id="new-form" class="new-form">
          
          <div class="form-control">
            <label for="documentations-input" class="new-form__documentations__title">Foto</label>
            <div id="documentations-more-info">Sertakan Foto Anda</div>

            <div class="new-form__documentations__container">
              <div class="new-form__documentations__buttons">
                <button id="documentations-input-button" class="btn btn-outline" type="button">Ambil Gambar</button>
                <input
                  id="documentations-input"
                  class="new-form__documentations__input"
                  name="photo"
                  type="file"
                  accept="image/*"
                  multiple
                  aria-multiline="true"
                  aria-describedby="documentations-more-info"
                >
                <button id="open-documentations-camera-button" class="btn btn-outline" type="button">
                  Buka Kamera
                </button>
              </div>
              <div id="camera-container" class="new-form__camera__container">
                <video id="camera-video" class="new-form__camera__video">
                  Video stream not available.
                </video>
                <canvas id="camera-canvas" class="new-form__camera__canvas"></canvas>
 
                <div class="new-form__camera__tools">
                  <select id="camera-select"></select>
                  <div class="new-form__camera__tools_buttons">
                    <button id="camera-take-button" class="btn" type="button">
                       Ambil Gambar
                    </button>
                  </div>
                </div>
              </div>
              <ul id="documentations-taken-list" class="new-form__documentations__outputs"></ul>
            </div>
          </div>
          
            <div class="form-control">
              <label for="description-input" class="new-form__description__title">Keterangan</label>

              <div class="new-form__description__container">
                <textarea
                  id="description-input"
                  name="description"
                  placeholder="Masukkan keterangan lengkap laporan. Anda dapat menjelaskan apa kejadiannya, dimana, kapan, dll."
                ></textarea>
              </div>
            </div>


            <div class="form-control">
              <div class="new-form__location__title">Lokasi</div>

              <div class="new-form__location__container">
                <div class="new-form__location__map__container">
                  <div id="map" class="new-form__location__map"></div>
                  <div id="map-loading-container"></div>
                </div>
                <div class="new-form__location__lat-lng">
                  <input type="number" name="latitude" value="-6.175389" disabled>
                  <input type="number" name="longitude" value="106.827139" disabled>
                </div>
              </div>
            </div>

            <div class="form-buttons">
              <span id="submit-button-container">
                <button class="btn" type="submit">Buat Story</button>
              </span>
              <a class="btn btn-outline" href="#/">Batal</a>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new NewStoryPresenter({
      view: this,
      model: LaporAPI,
    });
    this.#takenDocumentations = [];

    this.#presenter.showNewFormMap();
    this.#setupForm();
  }

  #setupForm() {
    this.#form = document.getElementById('new-form');
    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();

      let photoToSend = null;
      if (this.#takenDocumentations.length > 0) {
        photoToSend = this.#takenDocumentations[0].blob;
      }

      const data = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        description: this.#form.elements.namedItem('description').value,
        photo: photoToSend,
        lat: this.#form.elements.namedItem('latitude').value,
        lon: this.#form.elements.namedItem('longitude').value,
      };

      // Save to IndexedDB
      await addStory(data);

      // Optionally, try to send to server if online
      if (navigator.onLine) {
        await this.#presenter.postNewReport(data);
        this.storeSuccessfully('Story berhasil disimpan dan dikirim.');
      } else {
        this.storeSuccessfully('Story berhasil disimpan secara offline.');
      }

      // await this.#loadStoredStories();
    });

    document.getElementById('documentations-input').addEventListener('change', async (event) => {
      this.#takenDocumentations = [];
      const file = event.target.files[0];
      if (file) {
        await this.#addTakenPicture(file);
        await this.#populateTakenPictures();
      } else {
        await this.#populateTakenPictures();
      }
    });

    document.getElementById('documentations-input-button').addEventListener('click', () => {
      this.#form.elements.namedItem('documentations-input').click();
    });

    const cameraContainer = document.getElementById('camera-container');
    document
      .getElementById('open-documentations-camera-button')
      .addEventListener('click', async (event) => {
        cameraContainer.classList.toggle('open');
        this.#isCameraOpen = cameraContainer.classList.contains('open');

        if (this.#isCameraOpen) {
          event.currentTarget.textContent = 'Tutup Kamera';
          this.#setupCamera();
          this.#camera.launch();

          return;
        }

        event.currentTarget.textContent = 'Buka Kamera';
        this.#camera.stop();
      });
  }

  async initialMap() {
    // TODO: map initialization
    if (this.#map) {
      console.warn('Peta sudah diinisialisasi, tidak perlu diinisialisasi lagi.');
      return;
    }

    this.#map = await Map.build('#map', {
      zoom: 15,
      locate: true,
    });

    const centerCoordinate = this.#map.getCenter();
    if (!centerCoordinate || !centerCoordinate.lat || !centerCoordinate.lng) {
      console.error('Koordinat tidak valid, tidak bisa melanjutkan.');
      return;
    }

    const draggableMarker = this.#map.addMarker([centerCoordinate.lat, centerCoordinate.lng], {
      draggable: true,
    });

    draggableMarker.addEventListener('move', (event) => {
      const coordinate = event.target.getLatLng();
      this.#updateLatLngInput(coordinate.lat, coordinate.lng);
    });

    this.#map.addMapEventListener('click', (event) => {
      draggableMarker.setLatLng(event.latlng);
      event.sourceTarget.flyTo(event.latlng);
    });
  }

  #updateLatLngInput(lat, lon) {
    this.#form.elements.namedItem('latitude').value = lat;
    this.#form.elements.namedItem('longitude').value = lon;
  }

  #setupCamera() {
    // TODO: camera initialization
    if (!this.#camera) {
      this.#camera = new Camera({
        video: document.getElementById('camera-video'),
        cameraSelect: document.getElementById('camera-select'),
        canvas: document.getElementById('camera-canvas'),
      });
    }

    this.#camera.addCheeseButtonListener('#camera-take-button', async () => {
      const image = await this.#camera.takePicture();
      await this.#addTakenPicture(image);
      await this.#populateTakenPictures();
    });
  }

  async #addTakenPicture(image) {
    let blob = image;

    if (image instanceof String) {
      blob = await convertBase64ToBlob(image, 'image/png');
    }

    this.#takenDocumentations = [];

    const newDocumentation = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      blob: blob,
    };
    this.#takenDocumentations = [newDocumentation];
  }

  async #populateTakenPictures() {
    const html = this.#takenDocumentations.reduce((accumulator, picture, currentIndex) => {
      const imageUrl = URL.createObjectURL(picture.blob);
      return accumulator.concat(`
        <li class="new-form__documentations__outputs-item">
          <button type="button" data-deletepictureid="\${picture.id}" class="new-form__documentations__outputs-item__delete-btn">
            <img src="\${imageUrl}" alt="Dokumentasi ke-\${currentIndex + 1}">
          </button>
        </li>
      `);
    }, '');

    document.getElementById('documentations-taken-list').innerHTML = html;

    document.querySelectorAll('button[data-deletepictureid]').forEach((button) =>
      button.addEventListener('click', (event) => {
        const pictureId = event.currentTarget.dataset.deletepictureid;

        const deleted = this.#removePicture(pictureId);
        if (!deleted) {
          console.log(`Picture with id \${pictureId} was not found`);
        }

        // Updating taken pictures
        this.#populateTakenPictures();
      }),
    );
  }

  #removePicture(id) {
    const selectedPicture = this.#takenDocumentations.find((picture) => {
      return picture.id == id;
    });

    // Check if founded selectedPicture is available
    if (!selectedPicture) {
      return null;
    }

    // Deleting selected selectedPicture from takenPictures
    this.#takenDocumentations = this.#takenDocumentations.filter((picture) => {
      return picture.id != selectedPicture.id;
    });

    return selectedPicture;
  }

  storeSuccessfully(message) {
    console.log(message);
    this.clearForm();

    // Show notification using ServiceWorkerRegistration.showNotification()
    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification('Story berhasil dibuat', {
          body: 'Anda telah membuat story baru.',
        });
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification('Story berhasil dibuat', {
              body: 'Anda telah membuat story baru.',
            });
          });
        }
      });
    }

    // Redirect page
    location.href = '/';
  }

  storeFailed(message) {
    Swal.fire({
      icon: 'error',
      title: 'Gagal Membuat Story',
      text: message,
    });
  }

  clearForm() {
    this.#form.reset();
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit" disabled>
        <i class="fas fa-spinner loader-button"></i> Buat Story
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit">Buat Story</button>
    `;
  }
}
