import { View } from "../mvp/mvp-base";

export default class AuthView extends View {
  constructor() {
    super();
    this._isLogin = true;
  }

  async performViewTransition(transitionCallback) {
    document.startViewTransition(async () => {
      const container = document.querySelector("main");
      if (container) {
        await transitionCallback();
      }
    });
  }

  async updateAuthForm(isLogin) {
    this._isLogin = isLogin;
    const container = document.querySelector("main");
    if (container) {
      container.innerHTML = await this.render();
      await this.afterRender();
    }
  }

  async render() {
    return `
      <section class="container auth-container" aria-labelledby="auth-title">
        <h1 id="auth-title" class="sr-only">Authentication</h1>
        <div class="auth-tabs" role="tablist">
          <button class="auth-tab ${
            this._isLogin ? "active" : ""
          }" data-tab="login">
            Login
          </button>
          <button class="auth-tab ${
            !this._isLogin ? "active" : ""
          }" data-tab="register">
            Register
          </button>
        </div>
        <form id="auth-form" class="auth-form">
          ${
            !this._isLogin
              ? `
            <div class="form-group">
              <label for="auth-name">Full Name</label>
              <input 
                type="text" 
                id="auth-name" 
                name="name"
                required
                aria-required="true"
                minlength="3"
              >
            </div>
          `
              : ""
          }
          
          <div class="form-group">
            <label for="auth-email">Email Address</label>
            <input 
              type="email" 
              id="auth-email" 
              name="email"
              required
              aria-required="true"
              autocomplete="email"
            >
          </div>
          
          <div class="form-group">
            <label for="auth-password">Password</label>
            <input 
              type="password" 
              id="auth-password" 
              name="password"
              required
              aria-required="true"
              minlength="8"
              autocomplete="${
                this._isLogin ? "current-password" : "new-password"
              }"
            >
          </div>
          
          <button type="submit" class="auth-submit">
            ${this._isLogin ? "Login" : "Register"}
          </button>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this.setupTabs();
    this.setupPasswordToggle();
    this.setupForm();
  }

  setupTabs() {
    const tabs = document.querySelectorAll(".auth-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        this._isLogin = tab.dataset.tab === "login";
        this.presenter.handleTabChange(this._isLogin);
      });
    });
  }

  setupPasswordToggle() {
    const toggleBtn = document.querySelector(".toggle-password");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        const passwordInput = document.getElementById("auth-password");
        const type = passwordInput.type === "password" ? "text" : "password";
        passwordInput.type = type;
        toggleBtn.setAttribute(
          "aria-label",
          type === "password" ? "Show password" : "Hide password"
        );
      });
    }
  }

  setupForm() {
    const form = document.getElementById("auth-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = {
        email: document.getElementById("auth-email").value.trim(),
        password: document.getElementById("auth-password").value,
      };

      if (!this._isLogin) {
        formData.name = document.getElementById("auth-name").value.trim();
      }

      this.presenter.handleAuthSubmit(this._isLogin, formData);
    });
  }

  showLoading(show) {
    const submitBtn = document.querySelector(".auth-submit");
    if (submitBtn) {
      submitBtn.disabled = show;
      submitBtn.innerHTML = show
        ? this._isLogin
          ? "Logging in..."
          : "Registering..."
        : this._isLogin
        ? "Login"
        : "Register";
    }
  }

  showError(message) {
    const errorElement = document.createElement("div");
    errorElement.className = "auth-error";
    errorElement.textContent = message;

    const form = document.getElementById("auth-form");
    if (form) {
      const existingError = form.querySelector(".auth-error");
      if (existingError) {
        form.removeChild(existingError);
      }
      form.prepend(errorElement);
    }
  }

  navigateToHome() {
    window.location.hash = "#/";
  }
}
