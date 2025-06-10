import StoryView from './story-view';
import StoryPresenter from './story-presenter';
import { startStoryPolling } from '../../utils/story-watcher';

export default class StoryPage {
  constructor() {
    this.view = new StoryView();
    this.presenter = new StoryPresenter(this.view);
  }

  async render() {
    return this.view.render();
  }

  async afterRender() {
    await this.presenter.init();
    startStoryPolling();
  }
}
