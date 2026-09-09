import axios from 'axios';

const API_BASE = 'https://sih-zhm8.onrender.com/api';

export const api = {
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

    const response = await axios.post(`${API_BASE}/verify`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Fetch demo sample packages for quick demonstration
   */
  getDemoSamples: async () => {
    const response = await axios.get(`${API_BASE}/demo-samples`);
    return response.data;
  },

  /**
   * Fetch recent verification history
   */
  getHistory: async () => {
    const response = await axios.get(`${API_BASE}/verifications`);
    return response.data;
  }
};
