import { Presenter } from '../mvp/mvp-base';
import { register, login } from '../../data/api';
import { isValidToken } from '../../utils/auth';
import { showToast } from '../../utils/toast';

export default class AuthPresenter extends Presenter {
  constructor(view) {
    super(view);
  }

  async handleTabChange(isLogin) {
    try {
      await this.view.performViewTransition(async () => {
        await this.view.updateAuthForm(isLogin);
      });
    } catch (error) {
      console.error('Tab change error:', error);
      showToast('Gagal mengganti tab', 'error');
    }
  }

  async handleAuthSubmit(isLogin, { name, email, password }) {
    this.view.showLoading(true);
    
    try {
      let response;

      if (isLogin) {
        response = await login({ email, password });
        
        if (response.error) {
          throw new Error(response.message || 'Login gagal.');
        }
        
        if (!response.loginResult || !isValidToken(response.loginResult.token)) {
          throw new Error('Respons login tidak valid atau token kosong.');
        }
        
        localStorage.setItem('token', response.loginResult.token);
        localStorage.setItem('userId', response.loginResult.userId);
        localStorage.setItem('name', response.loginResult.name);
        
        showToast('Autentikasi berhasil!', 'success');
        this.view.navigateToHome();
        
      } else {
        if (!name) {
          throw new Error('Silakan masukkan nama Anda.');
        }
        
        response = await register({ name, email, password });

        if (response.error) {
          throw new Error(response.message || 'Registrasi gagal.');
        }
        
        showToast('Registrasi berhasil! Mencoba login otomatis...', 'info');
        
        const loginAfterRegisterResponse = await login({ email, password });

        if (loginAfterRegisterResponse.error) {
          throw new Error(loginAfterRegisterResponse.message || 'Login otomatis gagal setelah registrasi. Silakan login secara manual.');
        }

        if (!loginAfterRegisterResponse.loginResult || !isValidToken(loginAfterRegisterResponse.loginResult.token)) {
          throw new Error('Respons login otomatis tidak valid atau token kosong.');
        }

        localStorage.setItem('token', loginAfterRegisterResponse.loginResult.token);
        localStorage.setItem('userId', loginAfterRegisterResponse.loginResult.userId);
        localStorage.setItem('name', loginAfterRegisterResponse.loginResult.name);
        
        showToast('Login otomatis berhasil!', 'success');
        this.view.navigateToHome();
      }
      
    } catch (error) {
      console.error('Authentication Error:', error);
      this.view.showError(error.message);
      showToast(error.message, 'error');
    } finally {
      this.view.showLoading(false);
    }
  }
}
