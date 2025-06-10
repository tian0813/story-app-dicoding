import BookmarkView from './bookmark-view';
import BookmarkPresenter from './bookmark-presenter';

export default class BookmarkPage {
  constructor() {
    this.view = new BookmarkView();
    this.presenter = new BookmarkPresenter(this.view);
  }

  async render() {
    return this.view.render();
  }

  async afterRender() {
    await this.presenter.init();
  }
}