/**
 * authApi.js
 *
 * Wraps all /api/auth/* endpoints.
 * Used by AuthContext and the login page.
 */

import http from "./http";

export const authApi = {
  /**
   * POST /api/auth/login
   * Returns { user, accessToken, refreshToken }
   */
  async login(email, password) {
    const { data } = await http.post("/api/auth/login", { email, password });
    console.log(data);
    return data;
  },

  /**
   * GET /api/auth/me
   * Returns the current user object (uses stored access token).
   */
  async me() {
    const { data } = await http.get("/api/auth/me");
    return data;
  },

  /**
   * POST /api/auth/logout
   * Bumps refresh_token_version on the server, invalidating all sessions.
   */
  async logout() {
    try {
      await http.post("/api/auth/logout");
    } catch {
      // Best-effort — clear local state regardless
    }
    localStorage.removeItem("mm_access_token");
    localStorage.removeItem("mm_refresh_token");
    localStorage.removeItem("mm_user");
    localStorage.removeItem("mm_erp_role");
  },

  /**
   * PUT /api/auth/change-password
   */
  async changePassword(currentPassword, newPassword) {
    const { data } = await http.put("/api/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return data;
  },

  // ── User management (Principal only) ────────────────────────────────────────

  /**
   * POST /api/auth/users
   */
  async createUser(payload) {
    const { data } = await http.post("/api/auth/users", payload);
    return data;
  },

  /**
   * GET /api/auth/users
   */
  async listUsers() {
    const { data } = await http.get("/api/auth/users");
    return data;
  },

  /**
   * PUT /api/auth/users/:id
   */
  async updateUser(id, payload) {
    const { data } = await http.put(`/api/auth/users/${id}`, payload);
    return data;
  },

  /**
   * PUT /api/auth/users/:id/reset-password
   */
  async resetUserPassword(id, newPassword) {
    const { data } = await http.put(`/api/auth/users/${id}/reset-password`, {
      newPassword,
    });
    return data;
  },
};
