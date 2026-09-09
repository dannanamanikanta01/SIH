import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const authConfig = () => {
  const token = localStorage.getItem('sih_token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const api = {
  login: async ({ email, password }) => {
    const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
    return response.data;
  },

  getAdminUsers: async () => {
    const response = await axios.get(`${API_BASE}/auth/admin/users`, authConfig());
    return response.data;
  },

  getAdminStats: async () => {
    const response = await axios.get(`${API_BASE}/auth/admin/stats`, authConfig());
    return response.data;
  },

  createAdminUser: async (payload) => {
    const response = await axios.post(`${API_BASE}/auth/admin/users`, payload, authConfig());
    return response.data;
  },

  updateAdminUser: async (id, payload) => {
    const response = await axios.patch(`${API_BASE}/auth/admin/users/${id}`, payload, authConfig());
    return response.data;
  },

  /**
   * Verify uploaded image or demo sample
   */
  verifyProduct: async ({ file, demoSampleId, isDemo = false }) => {
    const formData = new FormData();
    if (file) {
      formData.append('image', file);
    }
    if (demoSampleId) {
      formData.append('demoSampleId', demoSampleId);
    }
    if (isDemo) {
      formData.append('isDemo', 'true');
    }

    const response = await axios.post(`${API_BASE}/verify`, formData, authConfig());
    return response.data;
  },

  /**
   * Fetch demo sample packages for quick demonstration
   */
  getDemoSamples: async () => {
    const response = await axios.get(`${API_BASE}/demo-samples`, authConfig());
    return response.data;
  },

  /**
   * Fetch recent verification history
   */
  getHistory: async () => {
    const response = await axios.get(`${API_BASE}/verifications`, authConfig());
    return response.data;
  },

  updateReview: async (id, payload) => {
    const response = await axios.patch(`${API_BASE}/verifications/${id}/review`, payload, authConfig());
    return response.data;
  },

  downloadReport: async (id) => {
    const response = await axios.get(`${API_BASE}/verifications/${id}/report`, {
      ...authConfig(),
      responseType: 'blob'
    });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compliance-${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
};
