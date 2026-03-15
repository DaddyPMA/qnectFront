import axios from 'axios';

const API_URL = 'https://qnectback-production.up.railway.app';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  signup: (email, name, password) =>
    api.post('/auth/signup', { email, name, password }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  verifySession: () => api.post('/auth/verify-session'),
};

// File APIs
export const fileAPI = {
  uploadFile: (file, folderId = null, permission = 'private') => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    formData.append('permission', permission);
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getFiles: (folderId = null) =>
    api.get('/files', { params: { folderId } }),
  getFileDetails: (fileId) => api.get(`/files/${fileId}`),
  downloadFile: (fileId) => api.get(`/files/${fileId}/download`),
  updatePermission: (fileId, permission) =>
    api.patch(`/files/${fileId}/permission`, { permission }),
  deleteFile: (fileId) => api.delete(`/files/${fileId}`),
};

// Folder APIs
export const folderAPI = {
  createFolder: (name, parentId = null) =>
    api.post('/folders', { name, parentId }),
  getFolders: (parentId = null) =>
    api.get('/folders', { params: { parentId } }),
  getFolderDetails: (folderId) => api.get(`/folders/${folderId}`),
  renameFolder: (folderId, name) =>
    api.patch(`/folders/${folderId}`, { name }),
  moveFileToFolder: (folderId, fileId) =>
    api.post(`/folders/${folderId}/move-file`, { fileId }),
  moveFolderToFolder: (folderId, targetParentId) =>
    api.post(`/folders/${folderId}/move-folder`, { targetParentId }),
  deleteFolder: (folderId) => api.delete(`/folders/${folderId}`),
};

// Friend APIs
export const friendAPI = {
  sendRequest: (userId) => api.post(`/friends/request/${userId}`),
  acceptRequest: (friendshipId) =>
    api.post(`/friends/${friendshipId}/accept`),
  getFriends: () => api.get('/friends'),
  getPendingRequests: () => api.get('/friends/requests/pending'),
  removeFriend: (friendId) => api.delete(`/friends/${friendId}`),
};

// Profile APIs
export const profileAPI = {
  getProfile: () => api.get('/profile/me'),
  getPublicProfile: (userId) => api.get(`/profile/${userId}`),
  updateProfile: (name, bio, avatar) =>
    api.patch('/profile/me', { name, bio, avatar }),
  getStats: () => api.get('/profile/me/stats'),
};

export default api;
