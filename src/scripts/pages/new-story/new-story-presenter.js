export default class NewStoryPresenter {
  #view;
  #model;
  #map;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async showNewFormMap() {
    if (this.#map) {
      console.warn('Peta sudah diinisialisasi, tidak perlu diinisialisasi lagi.');
      return;
    }
    this.#view.showMapLoading();
    try {
      await this.#view.initialMap();
    } catch (error) {
      console.error('showNewFormMap: error:', error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async postNewReport({ description, photo, lat, lon }) {
    this.#view.showSubmitLoadingButton();
    try {
      const story = {
        description: description,
        photo: photo,
        lat: lat,
        lon: lon,
      };
      const response = await this.#model.storeNewStorie(story);

      if (!response.ok) {
        console.error('postNewReport: response:', response);
        this.#view.storeFailed(response.message);
        return;
      }

      this.#view.storeSuccessfully(response.message, response.story);
    } catch (error) {
      console.error('postNewReport: error:', error);
      this.#view.storeFailed(error.message);
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }
}
