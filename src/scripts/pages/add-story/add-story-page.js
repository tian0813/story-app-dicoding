import AddStoryView from './add-story-view';
import AddStoryPresenter from './add-story-presenter';

export default class AddStoryPage {
  constructor() {
    this.view = new AddStoryView();
    this.presenter = new AddStoryPresenter(this.view);
  }

  async render() {
    return this.view.render();
  }

  async afterRender() {
    await this.presenter.init();
  }
}