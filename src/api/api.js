import axios from "axios";
import http from "./http";

// controllers/userController.js.
export const userApi = {
  async list(params = {}) {
    const { data } = await http.get("/api/users", { params });
    return data?.data ?? data;
  },

  async create(body) {
    const { data } = await http.post("/api/users", body);
    return data?.data ?? data;
  },

  /** PUT /api/users/:id — omit `password` entirely to leave it unchanged. */
  async update(id, body) {
    const { data } = await http.put(`/api/users/${id}`, body);
    return data?.data ?? data;
  },

  async remove(id) {
    const { data } = await http.delete(`/api/users/${id}`);
    return data?.data ?? data;
  },
};

//student api
export const studentApi = {
  /** GET /api/students — branch/teacher scoping handled server-side */
  async list(params = {}) {
    const { data } = await http.get("/api/students", { params });
    return data.data ?? data;
  },

  /** GET /api/students/:id */
  async getById(id) {
    const { data } = await http.get(`/api/students/${id}`);
    return data;
  },

  /** POST /api/students */
  async create(body) {
    const { data } = await http.post("/api/students", body);
    return data;
  },

  /** POST /api/students/bulk */
  async bulkCreate(records) {
    const { data } = await http.post("/api/students/bulk", records);
    return data;
  },

  /** PUT /api/students/:id */
  async update(id, body) {
    const { data } = await http.put(`/api/students/${id}`, body);
    return data;
  },

  /** DELETE /api/students/:id */
  async remove(id) {
    const { data } = await http.delete(`/api/students/${id}`);
    return data;
  },
};

export const classApi = {
  async list(params = {}) {
    const { data } = await http.get("/api/classes", { params });
    console.log(data);

    return data;
  },

  async listWithMeta(params = {}) {
    const { data } = await http.get("/api/classes", { params });
    return data?.data ?? data;
  },
  async create(body) {
    const { data } = await http.post("/api/classes", body);
    return data;
  },
  async update(id, body) {
    const { data } = await http.put(`/api/classes/${id}`, body);
    return data;
  },
  async remove(id) {
    const { data } = await http.delete(`/api/classes/${id}`);
    return data;
  },
  async assignSubjectTeacher(classId, { teacher_id, subject }) {
    const { data } = await http.put(
      `/api/classes/${classId}/subject-teachers`,
      { teacher_id, subject },
    );
    return data;
  },
  async removeSubjectTeacher(classId, { teacher_id, subject }) {
    // axios requires body on DELETE to go under `data`
    const { data } = await http.delete(
      `/api/classes/${classId}/subject-teachers`,
      {
        data: { teacher_id, subject },
      },
    );
    return data;
  },
};

// attendance api
export const attendanceApi = {
  /**
   * GET /api/attendance — role-aware scoping handled server-side.
   *
   * Two usage shapes:
   *  - Daily marking view: { date, subject, class_id } — teacher must be
   *    assigned to that exact (class_id, subject), enforced server-side.
   *  - Monthly / analytics view: no params (or just { class_id }) — for a
   *    teacher this returns only classes where they are the Class Teacher.
   */
  async list(params = {}) {
    const { data } = await http.get("/api/attendance", { params });
    return data.data ?? data;
  },

  /**
   * POST /api/attendance/bulk-mark — upserts an entire class/subject/date
   * roll call in one call instead of one create-or-update per student.
   * body: { class_id, subject, date, records: [{ student_id, student_name, status }] }
   */
  async bulkMark(body) {
    const { data } = await http.post("/api/attendance/bulk-mark", body);
    return data.data ?? data;
  },

  /** POST /api/attendance — single record create (kept for other callers) */
  async create(body) {
    const { data } = await http.post("/api/attendance", body);
    return data.data ?? data;
  },

  /** PUT /api/attendance/:id */
  async update(id, body) {
    const { data } = await http.put(`/api/attendance/${id}`, body);
    return data.data ?? data;
  },
};

// marks api
export const marksApi = {
  /**
   * GET /api/marks — role-aware scoping handled server-side.
   * A teacher only ever receives:
   *   (a) every subject for classes where they are the Class Teacher, and
   *   (b) their own subject's marks for classes they teach but aren't
   *       Class Teacher of.
   * params (all optional): { class_id, exam_type, subject, student_id }
   */
  async list(params = {}) {
    const { data } = await http.get("/api/marks", { params });
    return data.data ?? data;
  },

  /**
   * POST /api/marks — server validates (class_id, subject) against the
   * teacher's subject_assignments before allowing the write.
   */
  async create(body) {
    const { data } = await http.post("/api/marks", body);
    return data.data ?? data;
  },

  /** PUT /api/marks/:id */
  async update(id, body) {
    const { data } = await http.put(`/api/marks/${id}`, body);
    return data.data ?? data;
  },
};

export const admissionApi = {
  /** GET /api/admissions - params (all optional): { form_status, sort, limit } */
  async list(params = {}) {
    const { data } = await http.get("/api/admissions", { params });
    return data?.data ?? data;
  },

  /** POST /api/admissions - unique_id/application_no are generated
   * server-side; branch defaults to the caller's own branch if omitted. */
  async create(body) {
    const { data } = await http.post("/api/admissions", body);
    return data?.data ?? data;
  },

  /** PUT /api/admissions/:id */
  async update(id, body) {
    const { data } = await http.put(`/api/admissions/${id}`, body);
    return data?.data ?? data;
  },

  /** DELETE /api/admissions/:id - only Enquiry/Rejected applications */
  async remove(id) {
    const { data } = await http.delete(`/api/admissions/${id}`);
    return data?.data ?? data;
  },

  /** POST /api/admissions/:id/admit - generates admission_no, resolves
   * class_sought to a real Class, generates roll_no, and creates the
   * linked Student record in one call. Resolves to { admission, student }. */
  async admit(id) {
    const { data } = await http.post(`/api/admissions/${id}/admit`);
    return data?.data ?? data;
  },

  /** POST /api/admissions/:id/convert - fallback for an already-Admitted
   * record with no linked student yet; idempotent. */
  async convert(id) {
    const { data } = await http.post(`/api/admissions/${id}/convert`);
    return data?.data ?? data;
  },
};
export const branchApi = {
  /** GET /api/branches */
  async list(params = {}) {
    const { data } = await http.get("/api/branches", { params });
    return data?.data ?? data;
  },

  /** POST /api/branches — Admin Officer only */
  async create(body) {
    const { data } = await http.post("/api/branches", body);
    return data?.data ?? data;
  },

  /** PUT /api/branches/:id — Admin Officer only */
  async update(id, body) {
    const { data } = await http.put(`/api/branches/${id}`, body);
    return data?.data ?? data;
  },

  /** DELETE /api/branches/:id — Admin Officer only; soft-deletes (is_active: false) */
  async remove(id) {
    const { data } = await http.delete(`/api/branches/${id}`);
    return data?.data ?? data;
  },
};
export const analyticsApi = {
  async overview(params = {}) {
    const { data } = await http.get("/api/analytics/overview", { params });
    return data;
  },
  async feesSummary(params = {}) {
    const { data } = await http.get("/api/analytics/fees-summary", { params });
    return data;
  },
  async attendanceSummary(params = {}) {
    const { data } = await http.get("/api/analytics/attendance-summary", {
      params,
    });
    return data;
  },
  async academicPerformance(params = {}) {
    const { data } = await http.get("/api/analytics/academic-performance", {
      params,
    });
    return data;
  },
  async incomeExpenditure(params = {}) {
    const { data } = await http.get("/api/analytics/income-expenditure", {
      params,
    });
    return data;
  },
  async admissionsFunnel(params = {}) {
    const { data } = await http.get("/api/analytics/admissions-funnel", {
      params,
    });
    return data;
  },
  /** Accounts Manager only */
  async branchComparison(params = {}) {
    const { data } = await http.get("/api/analytics/branch-comparison", {
      params,
    });
    return data;
  },
  /** Admin dashboard stats - combined + per-branch enrollment, fees, income, expenditure */
  async dashboardStats(params = {}) {
    const { data } = await http.get("/api/analytics/dashboard-stats", {
      params,
    });
    return data.data; // Response structure: { success: true, data: { ... } }
  },
};

export const uploadApi = {
  /**
   * @param {File} file
   * @param {"students"|"staff"|"documents"} [category="documents"]
   * @returns {{ url: string }}
   */
  async uploadFile(file, category = "documents") {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await http.post(`/api/upload/${category}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};

// homework api
export const homeworkApi = {
  /**
   * GET /api/homework — role-aware scoping handled server-side. A
   * teacher only ever receives homework for classes they teach.
   * params (all optional): { class_id, status, sort, limit }
   */
  async list(params = {}) {
    const { data } = await http.get("/api/homework", { params });
    return data?.data ?? data;
  },

  /**
   * POST /api/homework — server validates (class, subject) against the
   * teacher's Class.subject_teachers assignments, and sets `assigned_by`
   * to the logged-in user automatically (it's a User reference now, not
   * free text - don't send it from the client).
   */
  async create(body) {
    const { data } = await http.post("/api/homework", body);
    return data?.data ?? data;
  },

  /** DELETE /api/homework/:id */
  async remove(id) {
    const { data } = await http.delete(`/api/homework/${id}`);
    return data?.data ?? data;
  },

  /**
   * POST /api/homework/:id/notify — creates a notification for every
   * active student in the homework's class, server-side, in one call.
   * Resolves to { notified: <count> }.
   */
  async notify(id) {
    const { data } = await http.post(`/api/homework/${id}/notify`);
    return data?.data ?? data;
  },
};

export const feeApi = {
  // Payments
  /** GET /api/fee-payments - params (all optional): { student_id, academic_year, status, sort, limit } */
  async listPayments(params = {}) {
    const { data } = await http.get("/api/fee/listPayments", {
      params,
    });
    return data?.data ?? data;
  },
  /** GET /api/fee-payments/pending-summary - params: { academic_year }
   * Resolves to { total_collected, total_pending, pending: [...] }. */
  async pendingSummary(params = {}) {
    const { data } = await http.get("/api/fee/pending-summary", {
      params,
    });
    return data?.data ?? data;
  },
  /** POST /api/fee-payments/collect - the actual "Insert" action: pass
   * one or more selected fee-particulars rows (school_fee/admission_fee/
   * previous_due, each with its own amount), one shared receipt is
   * generated, and the linked StudentFeeReport's balances update in the
   * same call. Resolves to { payments: [...], report }. */
  async collectPayment(body) {
    const { data } = await http.post("/api/fee/collectpayment", body);
    return data?.data ?? data;
  },
  /** POST /api/fee-payments - single ad-hoc record, not tied to a fee
   * report row. Prefer collectPayment() for the Fee Payments page. */
  async createPayment(body) {
    const { data } = await http.post("/api/fee/createpayment", body);
    return data?.data ?? data;
  },
  /** PUT /api/fee-payments/:id - also used to cancel a voucher via { status: "Cancelled" } */
  async updatePayment(id, body) {
    const { data } = await http.put(`/api/fee/updatePayment/${id}`, body);
    return data?.data ?? data;
  },
  async removePayment(id) {
    const { data } = await http.delete(`/api/fee/removePayment/${id}`);
    return data?.data ?? data;
  },

  // Fee reports (structure)
  /** GET /api/fee - params (all optional): { student_id, class, status } */
  async listReports(params = {}) {
    const { data } = await http.get("/api/fee", { params });
    return data?.data ?? data;
  },

  listEligibleStudents: async (params) => {
    const { data } = await http.get("/api/fee/eligible-students", { params });
    console.log(data);
    return data.data;
  },

  async createReport(body) {
    const { data } = await http.post("/api/fee", body);
    return data?.data ?? data;
  },

  async updateReport(id, body) {
    const { data } = await http.put(`/api/fee/${id}`, body);
    return data?.data ?? data;
  },

  async removeReport(id) {
    const { data } = await http.delete(`/api/fee/${id}`);
    return data?.data ?? data;
  },
};

export const incomeApi = {
  /**
   * Returns the full { data, meta } envelope (not unwrapped) - when params
   * includes `page`, `meta` carries { total, page, limit, totalPages } for
   * pagination; without it, meta is undefined and data is the full match set.
   */
  async list(params = {}) {
    const { data } = await http.get("/api/income", { params });
    return data;
  },
  async create(body) {
    const { data } = await http.post("/api/income", body);
    return data?.data ?? data;
  },
  /** Saved records only allow editing payment_method - every other field is locked server-side. */
  async update(id, body) {
    const { data } = await http.put(`/api/income/${id}`, body);
    return data?.data ?? data;
  },
  /** Flags the record for deletion - it isn't removed until an Admin Officer approves. */
  async requestDelete(id) {
    const { data } = await http.post(`/api/income/${id}/request-delete`);
    return data?.data ?? data;
  },
  async approveDelete(id) {
    const { data } = await http.post(`/api/income/${id}/approve-delete`);
    return data?.data ?? data;
  },
  async rejectDelete(id) {
    const { data } = await http.post(`/api/income/${id}/reject-delete`);
    return data?.data ?? data;
  },
};

// expenditure api
export const expenditureApi = {
  async list(params = {}) {
    const { data } = await http.get("/api/expenditure", { params });
    return data;
  },
  /** approved_by is set server-side from the logged-in user - don't send it. */
  async create(body) {
    const { data } = await http.post("/api/expenditure", body);
    return data?.data ?? data;
  },
  async update(id, body) {
    const { data } = await http.put(`/api/expenditure/${id}`, body);
    return data?.data ?? data;
  },
  /** Flags the record for deletion - it isn't removed until an Admin Officer approves. */
  async requestDelete(id) {
    const { data } = await http.post(`/api/expenditure/${id}/request-delete`);
    return data?.data ?? data;
  },
  async approveDelete(id) {
    const { data } = await http.post(`/api/expenditure/${id}/approve-delete`);
    return data?.data ?? data;
  },
  async rejectDelete(id) {
    const { data } = await http.post(`/api/expenditure/${id}/reject-delete`);
    return data?.data ?? data;
  },
};
