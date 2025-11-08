const DEFAULT_BASE = 'http://localhost:5000';
export const API_BASE = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim()) || DEFAULT_BASE;
export const api = (path) => {
  if (!path) return API_BASE;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
};