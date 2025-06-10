// mvp-base.js
export class View {
    constructor() {
      if (new.target === View) {
        throw new Error("View is abstract and cannot be instantiated directly");
      }
    }
  
    setPresenter(presenter) {
      this.presenter = presenter;
      return this;
    }
  
    async render() {
      throw new Error("render() must be implemented");
    }
  
    async afterRender() {
      throw new Error("afterRender() must be implemented");
    }
  }
  
  export class Presenter {
    constructor(view, model) {
      this.view = view.setPresenter(this);
      this.model = model;
    }
  
    async init() {
      await this.view.render();
      await this.view.afterRender();
    }
  }