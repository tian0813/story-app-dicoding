import { Presenter } from '../mvp/mvp-base';
import { getStories, getStoriesGuest } from '../../data/api';

export default class HomePresenter extends Presenter {
  constructor(view, model) {
    super(view, model);
    this._allLoadedStories = []; // Menyimpan semua cerita yang sudah berhasil dimuat sejauh ini
    this._currentPage = 1;       // Nomor halaman saat ini untuk permintaan API
    this._isLoading = false;     // Status loading untuk mencegah permintaan ganda
    this._hasMore = true;        // Menunjukkan apakah ada lebih banyak cerita untuk dimuat dari API
    this._pageSize = 6;          // Ukuran halaman konsisten untuk semua panggilan API (bisa disesuaikan)
  }

  /**
   * Memuat cerita awal atau saat halaman pertama diakses.
   */
  async loadInitialStories() {
    // Hindari pemuatan awal ganda jika sudah dalam proses loading
    if (this._isLoading) return;

    this.showLoading(true);
    this._isLoading = true; // Set status loading ke true

    try {
      this._currentPage = 1;     // Reset halaman ke 1 untuk pemuatan awal
      this._allLoadedStories = []; // Hapus cerita yang sebelumnya dimuat
      this._hasMore = true;      // Asumsikan ada lebih banyak cerita yang bisa diambil dari API

      const token = localStorage.getItem('token');
      const serviceCall = token ? getStories : getStoriesGuest;
      
      // Menggunakan _pageSize untuk ukuran pengambilan awal
      const response = await serviceCall({ page: this._currentPage, size: this._pageSize });

      // Memeriksa format respons API
      if (!response || !response.listStory) {
        throw new Error('Respons API tidak valid atau properti listStory tidak ditemukan');
      }

      this._allLoadedStories = response.listStory;
      // Menentukan apakah ada lebih banyak cerita: jika jumlah cerita yang diterima sama dengan ukuran halaman,
      // kemungkinan ada lebih banyak. Jika kurang, berarti sudah mencapai akhir.
      this._hasMore = response.listStory.length === this._pageSize;

      // Render cerita yang sudah diambil dan status _hasMore yang diperbarui ke tampilan
      this.view.renderStories(this._allLoadedStories, this._hasMore);
      
    } catch (error) {
      console.error("Error loading initial stories:", error);
      this.view.showError(`Gagal memuat cerita: ${error.message}. Silakan coba lagi.`);
      // Jika pemuatan awal gagal, atur _hasMore ke false agar tombol "See More" tidak muncul
      this._hasMore = false; 
      this.view.renderStories([], false); // Kosongkan cerita dan sembunyikan tombol "See More"
    } finally {
      this.showLoading(false);
      this._isLoading = false; // Reset status loading
    }
  }

  /**
   * Memuat lebih banyak cerita saat tombol "See More" diklik.
   */
  async loadMoreStories() {
    // Hindari pemuatan ganda jika sudah dalam proses loading atau tidak ada lagi cerita yang bisa diambil
    if (this._isLoading || !this._hasMore) {
      console.log('Melewati loadMoreStories: sedang loading atau tidak ada lagi cerita yang bisa diambil.');
      return;
    }

    this.showLoading(true);
    this._isLoading = true; // Set status loading ke true

    try {
      this._currentPage++; // Tambah nomor halaman untuk pengambilan selanjutnya

      const token = localStorage.getItem('token');
      const serviceCall = token ? getStories : getStoriesGuest;

      const response = await serviceCall({ page: this._currentPage, size: this._pageSize });

      // Memeriksa format respons API
      if (!response || !response.listStory) {
        // Jika API mengembalikan daftar kosong atau format tidak valid, asumsikan tidak ada lagi cerita.
        this._hasMore = false;
        this.view.renderStories(this._allLoadedStories, this._hasMore); // Perbarui tampilan dengan data yang ada
        return; // Keluar lebih awal
      }

      const newStories = response.listStory;
      // Gabungkan cerita baru dengan cerita yang sudah dimuat
      this._allLoadedStories = [...this._allLoadedStories, ...newStories];
      
      // Menentukan apakah ada lebih banyak cerita yang mungkin ada di halaman berikutnya
      this._hasMore = newStories.length === this._pageSize;

      // Kirim daftar cerita yang sudah diperbarui dan status _hasMore yang baru ke tampilan
      this.view.renderStories(this._allLoadedStories, this._hasMore);
    } catch (error) {
      console.error("Error loading more stories:", error);
      this.view.showError(`Gagal memuat cerita lainnya: ${error.message}.`);
      // Saat terjadi error, asumsikan tidak ada lagi cerita yang bisa dimuat untuk mencegah upaya berulang
      this._hasMore = false; 
      this.view.renderStories(this._allLoadedStories, false); // Perbarui tampilan dengan data yang ada dan tanpa tombol "See More"
    } finally {
      this.showLoading(false);
      this._isLoading = false; // Reset status loading
    }
  }

  /**
   * Menampilkan/menyembunyikan indikator loading di tampilan.
   * @param {boolean} show - true untuk menampilkan, false untuk menyembunyikan.
   */
  showLoading(show) {
    this._isLoading = show; // Perbarui status loading internal presenter
    this.view.showLoading(show); // Beri tahu tampilan untuk menampilkan/menyembunyikan indikator loading
  }

  /**
   * Memeriksa status otentikasi pengguna dan memperbarui elemen UI yang sesuai.
   */
  checkAuthStatus() {
    const token = localStorage.getItem('token');
    this.view.updateAuthElements(!!token);
  }

  /**
   * Menangani proses logout pengguna.
   */
  handleLogout() {
    localStorage.removeItem('token');
    window.location.href = '#/auth'; // Arahkan ke halaman otentikasi setelah logout
  }
}
