import DetailView from './detail-view';
import DetailPresenter from './detail-presenter';

export default class DetailPage {
  constructor() {
    this.view = new DetailView();
    this.presenter = new DetailPresenter(this.view);
  }

  async render() {
    return this.view.render();
  }

  async afterRender() {
    await this.presenter.init();
  }
}