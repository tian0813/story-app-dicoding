import AboutView from './about-view';
import AboutPresenter from './about-presenter';

export default class AboutPage {
  constructor() {
    this.view = new AboutView();
    this.presenter = new AboutPresenter(this.view);
  }

  async render() {
    return this.view.render();
  }

  async afterRender() {
    await this.presenter.init();
  }
}