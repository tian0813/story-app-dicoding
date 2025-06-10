// home-page.js
import HomeView from './home-view';
import HomePresenter from './home-presenter';

export default class HomePage {
  constructor() {
    this.view = new HomeView();
    this.presenter = new HomePresenter(this.view);
  }

  async render() {
    return this.view.render();
  }

  async afterRender() {
    await this.presenter.init();
  }
}