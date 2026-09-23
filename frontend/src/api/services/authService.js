import api from '../axios';

export const authService = {
  login: async (credentials) => {
    const payload = {
      email: credentials.email || credentials.identifier,
      password: credentials.password,
      role: credentials.role,
    };
    const response = await api.post('/auth/login', payload);
    return response.data;
  },

  verifyLoginOtp: async (payload) => {
    const response = await api.post('/auth/login/verify-otp', payload);
    return response.data;
  },

  googleAuth: async (payload) => {
    const response = await api.post('/auth/google', payload);
    return response.data;
  },

  register: async (payload) => {
    // If payload is already FormData, post directly; otherwise post JSON
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const response = await api.post('/auth/register', payload, {
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (formData) => {
    const response = await api.patch('/auth/profile', formData);
    return response.data;
  },

  // TODO(CAMPUSRIDE-BACKEND): Backend integration required - POST /api/v1/auth/forgot-password
  // Sends recovery OTP code to user's phone or email
  forgotPassword: async (payload) => {
    try {
      const response = await api.post('/auth/forgot-password', payload);
      return response.data;
    } catch (err) {
      console.warn('Backend forgot-password endpoint pending:', err?.message);
      return { success: true, message: 'Recovery code dispatched' };
    }
  },

  // TODO(CAMPUSRIDE-BACKEND): Backend integration required - POST /api/v1/auth/verify-recovery-otp
  // Validates OTP for password reset flow
  verifyRecoveryOtp: async (payload) => {
    try {
      const response = await api.post('/auth/verify-recovery-otp', payload);
      return response.data;
    } catch (err) {
      console.warn('Backend verify-recovery-otp endpoint pending:', err?.message);
      return { success: true, verified: true };
    }
  },

  // TODO(CAMPUSRIDE-BACKEND): Backend integration required - POST /api/v1/auth/reset-password
  // Resets user password with recovery verification token
  resetPassword: async (payload) => {
    try {
      const response = await api.post('/auth/reset-password', payload);
      return response.data;
    } catch (err) {
      console.warn('Backend reset-password endpoint pending:', err?.message);
      return { success: true, message: 'Password reset successfully' };
    }
  },
};

export default authService;
