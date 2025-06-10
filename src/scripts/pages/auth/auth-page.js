import AuthView from './auth-view';
import AuthPresenter from './auth-presenter';

export default class AuthPage {
  constructor() {
    this.view = new AuthView();
    this.presenter = new AuthPresenter(this.view);
  }

  async render() {
    return this.view.render();
  }

  async afterRender() {
    await this.presenter.init();
  }
}