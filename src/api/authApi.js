/**
 * authApi.js
 *
 * Wraps all /api/auth/* endpoints.
 * Used by AuthContext and the login page.
 */

import http from "./http";

export const authApi = {
  async login(email, password) {
    const { data } = await http.post("/api/auth/login", { email, password });
    return data;
  },

  async me() {
    const { data } = await http.get("/api/auth/me");
    return data;
  },

  async logout() {
    await http.post("/api/auth/logout");
  },

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

  async listUsers(params = {}) {
    const { data } = await http.get("/api/auth/users", { params });
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
