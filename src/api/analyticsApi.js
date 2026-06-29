/**
 * analyticsApi.js
 *
 * Wraps all /api/analytics/* endpoints.
 */

import http from "./http";

export const analyticsApi = {
  /** GET /api/analytics/overview */
  async overview(params = {}) {
    const { data } = await http.get("/api/analytics/overview", { params });
    return data;
  },

  /** GET /api/analytics/fees-summary */
  async feesSummary(params = {}) {
    const { data } = await http.get("/api/analytics/fees-summary", { params });
    return data;
  },

  /** GET /api/analytics/attendance-summary */
  async attendanceSummary(params = {}) {
    const { data } = await http.get("/api/analytics/attendance-summary", {
      params,
    });
    return data;
  },

  /** GET /api/analytics/academic-performance */
  async academicPerformance(params = {}) {
    const { data } = await http.get("/api/analytics/academic-performance", {
      params,
    });
    return data;
  },

  /** GET /api/analytics/income-expenditure */
  async incomeExpenditure(params = {}) {
    const { data } = await http.get("/api/analytics/income-expenditure", {
      params,
    });
    return data;
  },

  /** GET /api/analytics/admissions-funnel */
  async admissionsFunnel(params = {}) {
    const { data } = await http.get("/api/analytics/admissions-funnel", {
      params,
    });
    return data;
  },

  /**
   * GET /api/analytics/branch-comparison
   * Accounts Manager only.
   */
  async branchComparison(params = {}) {
    const { data } = await http.get("/api/analytics/branch-comparison", {
      params,
    });
    return data;
  },
};
