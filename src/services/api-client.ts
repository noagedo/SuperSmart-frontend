import axios, { CanceledError } from "axios";

export { CanceledError };

const backend_url = import.meta.env.VITE_BACKEND_URL 

const apiClient = axios.create({
  baseURL: backend_url,
});

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("Missing refresh token");

  const response = await axios.post(`${backend_url}/auth/refresh`, {
    refreshToken,
  });

  const newAccessToken = response.data.accessToken;
  const newRefreshToken = response.data.refreshToken;

  localStorage.setItem("token", newAccessToken);
  localStorage.setItem("refreshToken", newRefreshToken);

  return newAccessToken;
};

apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/signin";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
