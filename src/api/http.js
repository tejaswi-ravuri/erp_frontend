import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const http = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
});
console.log(BASE_URL);
// ── Token injection ────────────────────────────────────────────────────────────
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("mm_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Silent token refresh ───────────────────────────────────────────────────────
let isRefreshing = false;
let queue = []; // pending requests while refresh is in-flight

function processQueue(error, token = null) {
  queue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token),
  );
  queue = [];
}

http.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return http(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("mm_refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        localStorage.setItem("mm_access_token", data.accessToken);
        localStorage.setItem("mm_refresh_token", data.refreshToken);
        processQueue(null, data.accessToken);

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return http(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Clear session and redirect to login
        localStorage.removeItem("mm_access_token");
        localStorage.removeItem("mm_refresh_token");
        localStorage.removeItem("mm_user");
        localStorage.removeItem("mm_erp_role");
        window.location.href = "/";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  },
);

export default http;
