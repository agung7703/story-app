import { showFormattedDate } from './utils/index.js';

export function generateLoaderTemplate() {
  return `
    <div class="loader"></div>
  `;
}

export function generateLoaderAbsoluteTemplate() {
  return `
    <div class="loader loader-absolute"></div>
  `;
}

export function generateMainNavigationListTemplate() {
  return `
  `;
}

export function generateUnauthenticatedNavigationListTemplate() {
  return `
    <li id="push-notification-tools" class="push-notification-tools"></li>
    <li><a id="login-button" href="#/login">Login</a></li>
    <li><a id="register-button" href="#/register">Register</a></li>
  `;
}

export function generateAuthenticatedNavigationListTemplate() {
  return `
    <li id="push-notification-tools" class="push-notification-tools"></li>
    <li><a id="new-report-button" class="btn new-report-button" href="#/new_story">Buat Story <i class="fas fa-plus"></i></a></li>
    <li><a id="logout-button" class="logout-button" href="#/logout"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
  `;
}

export function generateReportsListEmptyTemplate() {
  return `
    <div id="reports-list-empty" class="reports-list__empty">
      <h2>Tidak ada Story yang tersedia</h2>
      <p>Saat ini, tidak ada Story yang dapat ditampilkan.</p>
    </div>
  `;
}

export function generateReportsListErrorTemplate(message) {
  return `
    <div id="reports-list-error" class="reports-list__error">
      <h2>Terjadi kesalahan pengambilan daftar laporan</h2>
      <p>${message ? message : 'Gunakan jaringan lain atau Story error ini.'}</p>
    </div>
  `;
}

export function generateReportDetailErrorTemplate(message) {
  return `
    <div id="reports-detail-error" class="reports-detail__error">
      <h2>Terjadi kesalahan pengambilan detail Story</h2>
      <p>${message ? message : 'Gunakan jaringan lain atau laporkan error ini.'}</p>
    </div>
  `;
}

export function generateReportItemTemplate({
  id,
  description,
  photoUrl,
  name,
  createdAt,
  lat,
  lon,
}) {
  // Limit description length to 100 characters
  const maxLength = 100;
  let shortDescription = description;
  if (description && description.length > maxLength) {
    shortDescription = description.substring(0, maxLength) + '...';
  }

  return `
    <div tabindex="0" class="report-item" data-reportid="${id}">
      <img class="report-item__image" src="${photoUrl}" alt="photo by ${name}">
      <div class="report-item__body">
        <div class="report-item__main">
          <div class="report-item__more-info">
            <div class="report-item__createdat">
              <i class="fas fa-calendar-alt"></i> ${showFormattedDate(createdAt, 'id-ID')}
            </div>
            <div class="report-item__location">
              <i class="fas fa-map"></i> Lat: ${lat} <br> Lon: ${lon}
            </div>
          </div>
        </div>
        <div id="report-description" class="report-item__description">
          ${shortDescription}
        </div>
        <div class="report-item__more-info">
          <div class="report-item__author">
            Dibuat oleh: ${name}
          </div>
        </div>
        <a class="btn report-item__read-more" href="#/storie/${id}">
          Selengkapnya <i class="fas fa-arrow-right"></i>
        </a>
      </div>
    </div>
  `;
}

export function generateReportDetailTemplate({ description, photoUrl, lat, lon, name, createdAt }) {
  const createdAtFormatted = showFormattedDate(createdAt, 'id-ID');

  return `
    <div class="report-detail__header">

      <div class="report-detail__more-info">
        <div class="report-detail__more-info__inline">
          <div id="createdat" class="report-detail__createdat" data-value="${createdAtFormatted}"><i class="fas fa-calendar-alt"></i></div>
        </div>
        <div class="report-detail__more-info__inline">
          <div id="location-latitude" class="report-detail__location__latitude" data-value="${lat}">Latitude:</div>
          <div id="location-longitude" class="report-detail__location__longitude" data-value="${lon}">Longitude:</div>
        </div>
        <div id="author" class="report-detail__author" data-value="${name}">Dibuat oleh: </div>
      </div>
    </div>

    <div class="container">
      <div class="report-detail__images__container">
        <img id="images" class="report-detail__images" src="${photoUrl}" alt="photo by ${name}">
      </div>
    </div>

    <div class="container">
      <div class="report-detail__body">
        <div class="report-detail__body__description__container">
          <h2 class="report-detail__description__title">Informasi Lengkap</h2>
          <div id="description" class="report-detail__description__body">
            ${description}
          </div>
        </div>
        <div class="report-detail__body__map__container">
          <h2 class="report-detail__map__title">Peta Lokasi</h2>
          <div class="report-detail__map__container">
            <div id="map" class="report-detail__map"></div>
            <div id="map-loading-container"></div>
          </div>
        </div>
  
        <hr>
  
        <div class="report-detail__body__actions__container">
          <h2>Aksi</h2>
          <div class="report-detail__actions__buttons">
            <div id="save-actions-container"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function generateSaveReportButtonTemplate() {
  return `
    <button id="report-detail-save" class="btn btn-transparent">
      Simpan Story <i class="far fa-bookmark"></i>
    </button>
  `;
}

export function generateRemoveReportButtonTemplate() {
  return `
    <button id="report-detail-remove" class="btn btn-transparent">
      Buang Story <i class="fas fa-bookmark"></i>
    </button>
  `;
}

export function generateSubscribeButtonTemplate() {
  return `
    <button id="subscribe-button" class="btn subscribe-button">
      Subscribe <i class="fas fa-bell"></i>
    </button>
  `;
}

export function generateUnsubscribeButtonTemplate() {
  return `
    <button id="unsubscribe-button" class="btn unsubscribe-button">
      Unsubscribe <i class="fas fa-bell-slash"></i>
    </button>
  `;
}
