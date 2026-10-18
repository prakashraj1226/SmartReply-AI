export const environment = {
  production: true,
  get apiUrl(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      const custom = window.localStorage.getItem('sr_custom_api_url');
      if (custom && custom.trim()) {
        return custom.trim().replace(/\/+$/, '');
      }
    }
    return 'https://smartreply-backend-lyda.onrender.com/api';
  }
};
