/**
 * entityClient.js
 *
 *
 * New usage:   entities.Student.list("-created_date", 50)
 *
 * API surface:
 *   .list(sort?, limit?, extraParams?)  →  GET  /api/entities/:name?sort=&limit=
 *   .filter(params)                     →  GET  /api/entities/:name?key=val...
 *   .getById(id)                        →  GET  /api/entities/:name/:id
 *   .create(data)                       →  POST /api/entities/:name
 *   .update(id, data)                   →  PUT  /api/entities/:name/:id
 *   .delete(id)                         →  DELETE /api/entities/:name/:id
 *   .bulkCreate(array)                  →  POST /api/entities/:name/bulk
 *   .bulkUpdate(array)                  →  PUT  /api/entities/:name/bulk
 *   .updateMany(filter, update)         →  PATCH /api/entities/:name/update-many
 *   .restore(id)                        →  PUT  /api/entities/:name/:id/restore
 */

import http from "./http";

function createEntityAPI(entityName) {
  const base = `/api/entities/${entityName}`;

  return {
    /**
     * List records.
     * @param {string} [sort="-created_date"] - Sort field, prefix - for desc
     * @param {number} [limit=1000] - Max records to return
     * @param {object} [extraParams={}] - Additional query filters
     */
    async list(sort = "-created_date", limit = 1000, extraParams = {}) {
      const { data } = await http.get(base, {
        params: { sort, limit, ...extraParams },
      });
      // Backend returns { data, total, page, limit }
      // Return the array directly so existing code doesn't break
      return data.data ?? data;
    },

    /**
     * Filter records by field values.
     * Maps to query params on the list endpoint.
     * @param {object} params - Key/value pairs to filter by
     */
    async filter(params = {}) {
      const { data } = await http.get(base, { params });
      return data.data ?? data;
    },

    /**
     * Get a single record by ID.
     */
    async getById(id) {
      const { data } = await http.get(`${base}/${id}`);
      return data;
    },

    /**
     * Create a new record.
     */
    async create(body) {
      const { data } = await http.post(base, body);
      return data;
    },

    /**
     * Update a record by ID.
     */
    async update(id, body) {
      const { data } = await http.put(`${base}/${id}`, body);
      return data;
    },

    /**
     * Soft-delete a record by ID.
     */
    async delete(id) {
      const { data } = await http.delete(`${base}/${id}`);
      return data;
    },

    /**
     * Soft-delete multiple records by IDs.
     */
    async deleteMany(ids) {
      const { data } = await http.delete(base, { data: { ids } });
      return data;
    },

    /**
     * Bulk-create an array of records.
     */
    async bulkCreate(records) {
      const { data } = await http.post(`${base}/bulk`, records);
      return data;
    },

    /**
     * Bulk-update an array of { id, data } records.
     */
    async bulkUpdate(records) {
      const { data } = await http.put(`${base}/bulk`, records);
      return data;
    },

    /**
     * Update many records matching a filter.
     */
    async updateMany(filter, update) {
      const { data } = await http.patch(`${base}/update-many`, {
        filter,
        update,
      });
      return data;
    },

    /**
     * Restore a soft-deleted record.
     */
    async restore(id) {
      const { data } = await http.put(`${base}/${id}/restore`);
      return data;
    },
  };
}

// ── Entity registry ─────────────────────────────────────────────────────────
// Mirrors backend ENTITY_NAMES in src/config/constants.js
const ENTITY_NAMES = [
  "Admission",
  "Student",
  "Staff",
  "Branch",
  "Attendance",
  "Marks",
  "Exam",
  "ExamSchedule",
  "Homework",
  "HomeworkNotification",
  "FeePayment",
  "StudentFeeReport",
  "Income",
  "Expenditure",
  "Event",
  "Appointment",
];

export const entities = Object.fromEntries(
  ENTITY_NAMES.map((name) => [name, createEntityAPI(name)]),
);
