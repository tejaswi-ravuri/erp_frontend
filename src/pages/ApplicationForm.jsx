import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  UserPlus,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import http from "../api/http";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { CLASS_LIST } from "@/lib/constants";

// Same convention as HallTicket.jsx / BPAttendance.jsx elsewhere in the app -
// plain numbers ("Class 5"), never roman numerals.
const classLabel = (grade) => (/^\d+$/.test(grade) ? `Class ${grade}` : grade);
const CLASS_OPTIONS = CLASS_LIST.map(classLabel);

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const academicYears = ["2026-2027", "2025-2026", "2024-2025"];
const STATUS_FILTERS = ["Pending", "Converted"];

const inputClass =
  "w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";

const apiErrorMessage = (err) =>
  err?.response?.data?.message || err?.message || "Something went wrong";

function ApplicationForm() {
  const STATES_28 = useMemo(
    () => [
      "Andhra Pradesh",
      "Arunachal Pradesh",
      "Assam",
      "Bihar",
      "Chhattisgarh",
      "Goa",
      "Gujarat",
      "Haryana",
      "Himachal Pradesh",
      "Jharkhand",
      "Karnataka",
      "Kerala",
      "Madhya Pradesh",
      "Maharashtra",
      "Manipur",
      "Meghalaya",
      "Mizoram",
      "Nagaland",
      "Odisha",
      "Punjab",
      "Rajasthan",
      "Sikkim",
      "Tamil Nadu",
      "Telangana",
      "Tripura",
      "Uttar Pradesh",
      "Uttarakhand",
      "West Bengal",
    ],
    [],
  );

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  // Filters - sent to the backend, not applied client-side.
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [confirmDeleteApplication, setConfirmDeleteApplication] =
    useState(null);
  const [deleting, setDeleting] = useState(false);

  const defaultAcademicYear = "2026-2027";

  const initialFormData = {
    studentName: "",
    fatherName: "",
    className: "",
    academicYear: defaultAcademicYear,
    mobileNo: "",

    applicationNo: "",

    commAddressLine1: "",
    commLandmark: "",
    commCity: "",
    commDistrict: "",
    commState: "",

    permenantAddressLine1: "",
    permenantLandmark: "",
    permenantCity: "",
    permenantDistrict: "",
    permenantState: "",

    isPermanentSameAsCommunication: false,

    proName: "",
    selectMV: "",
    mvNo: "",
    bank: "",
    previousSchool: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const getAcademicStartYear = (academicYear) => {
    const start = (academicYear || "").split("-")[0];
    return String(start || "").trim();
  };

  const validateMobile = (value) => /^\d{10}$/.test(String(value || ""));

  const generateApplicationNo = (startYear, seq) => {
    const seqStr = String(seq).padStart(2, "0");
    return `MM${startYear}000${seqStr}`;
  };

  const computeNextApplicationNoForYear = (yearStart) => {
    const appsForYear = applications.filter(
      (a) => getAcademicStartYear(a.academicYear) === String(yearStart),
    );
    const nextSeq = appsForYear.length + 1;
    return generateApplicationNo(yearStart, nextSeq);
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterClass, filterYear, filterStatus, dateFrom, dateTo]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = { page, limit: pageSize };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterClass !== "all") params.className = filterClass;
      if (filterYear !== "all") params.academicYear = filterYear;
      if (filterStatus !== "all") params.status = filterStatus;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const { data } = await http.get("/api/admissions/applications", {
        params,
      });
      setApplications(data?.data ?? []);
      setPagination(
        data?.pagination || { total: 0, page: 1, limit: pageSize, pages: 1 },
      );
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationById = async (id) => {
    const { data } = await http.get(`/api/admissions/application/${id}`);
    return data?.data;
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedSearch, filterClass, filterYear, filterStatus, dateFrom, dateTo]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const setField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handlePermanentSameToggle = (checked) => {
    setFormData((prev) => {
      if (checked) {
        return {
          ...prev,
          isPermanentSameAsCommunication: true,
          permenantAddressLine1: prev.commAddressLine1,
          permenantLandmark: prev.commLandmark,
          permenantCity: prev.commCity,
          permenantDistrict: prev.commDistrict,
          permenantState: prev.commState,
        };
      }
      return {
        ...prev,
        isPermanentSameAsCommunication: false,
        permenantAddressLine1: "",
        permenantLandmark: "",
        permenantCity: "",
        permenantDistrict: "",
        permenantState: "",
      };
    });
  };

  const openAddModal = () => {
    setEditingId(null);
    const nextForm = { ...initialFormData, academicYear: defaultAcademicYear };
    const yearStart = getAcademicStartYear(nextForm.academicYear);
    nextForm.applicationNo = computeNextApplicationNoForYear(yearStart);
    setFormData(nextForm);
    setIsModalOpen(true);
  };

  const openEditModal = async (id) => {
    setEditingId(id);
    const app = await fetchApplicationById(id);
    if (!app) return;

    setFormData({
      ...initialFormData,
      ...app,
      studentName: app.studentName ?? app.student_name ?? "",
      fatherName: app.fatherName ?? app.father_name ?? "",
      className: app.className ?? app.class_name ?? "",
      mobileNo: app.mobileNo ?? app.mobile_no ?? app.mobile ?? "",

      commAddressLine1:
        app.commAddressLine1 ??
        app.addressLine1 ??
        app.address_line_1 ??
        app.commAddress ??
        "",
      commLandmark: app.commLandmark ?? app.landmark ?? "",
      commCity: app.commCity ?? app.city ?? "",
      commDistrict: app.commDistrict ?? app.district ?? "",
      commState: app.commState ?? app.state ?? "",

      permenantAddressLine1: app.permenantAddressLine1 ?? "",
      permenantLandmark: app.permenantLandmark ?? "",
      permenantCity: app.permenantCity ?? "",
      permenantDistrict: app.permenantDistrict ?? "",
      permenantState: app.permenantState ?? "",

      proName: app.proName ?? "",
      selectMV: app.selectMV ?? "",
      mvNo: app.mvNo ?? "",
      bank: app.bank ?? "",
      previousSchool: app.previousSchool ?? "",

      applicationNo: app.applicationNo ?? "",

      isPermanentSameAsCommunication: Boolean(
        app.isPermanentSameAsCommunication,
      ),
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.studentName || !formData.fatherName || !formData.className) {
      toast.error(
        "Please fill all required fields (Student Name, Father Name, Class).",
      );
      return;
    }

    if (!validateMobile(formData.mobileNo)) {
      toast.error("Mobile No must be exactly 10 digits.");
      return;
    }

    try {
      if (!editingId) {
        await http.post("/api/admissions/addApplication", formData);
        toast.success("Application added successfully!");
      } else {
        await http.put(`/api/admissions/application/${editingId}`, formData);
        toast.success("Application updated successfully!");
      }
      await fetchApplications();
      closeModal();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const handleConvertToAdmission = async (application) => {
    const updatedApplicationInfo = {
      academic_year: application.academicYear,
      student_name: application.studentName,
      father_name: application.fatherName,
      father_mobile: application.mobileNo,
      same_as_communication: application.isPermanentSameAsCommunication,
      communication_address: {
        line1: application.commAddressLine1,
        line2: application.commLandmark || "",
        city: application.commCity,
        district: application.commDistrict,
        state: application.commState,
      },
      permanent_address: {
        line1: application.permenantAddressLine1,
        line2: application.permenantLandmark || "",
        city: application.permenantCity,
        district: application.permenantDistrict,
        state: application.permenantState,
      },
      previous_schools: application.previousSchool
        ? [{ name: application.previousSchool, standard: "", year: "" }]
        : [],
      saleOfApplicationId: application._id,
    };
    navigate("/admissions/admission-form", {
      state: {
        admissionData: updatedApplicationInfo,
        fromApplication: true,
      },
    });
  };

  const handleDelete = async () => {
    if (!confirmDeleteApplication) return;
    setDeleting(true);
    try {
      await http.delete(
        `/api/admissions/application/${confirmDeleteApplication._id}`,
      );
      toast.success("Application deleted successfully!");
      setConfirmDeleteApplication(null);
      await fetchApplications();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const rangeStart = pagination.total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, pagination.total);
  const totalPages = pagination.pages || 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Sale of Application
          </h2>
          <p className="text-sm text-slate-500">
            {pagination.total} total applications
          </p>
        </div>
        <Button
          onClick={openAddModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Application
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, app no, or mobile..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {CLASS_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {academicYears.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-36"
          title="From date"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-36"
          title="To date"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[
                  "Application No",
                  "Student Name",
                  "Father Name",
                  "Class",
                  "Academic Year",
                  "Mobile No",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No applications found. Click "Add Application" to create
                    one.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-indigo-600">
                      {app.applicationNo || "N/A"}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {app.studentName || app.student_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {app.fatherName || app.father_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {app.className || app.class_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {app.academicYear}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {app.mobileNo || app.mobile}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          app.isAdmitted
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {app.isAdmitted ? "Converted" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {!app.isAdmitted && (
                          <button
                            onClick={() => handleConvertToAdmission(app)}
                            className="p-1.5 rounded hover:bg-emerald-50 text-emerald-500"
                            aria-label="Convert to Admission"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(app._id)}
                          className="p-1.5 rounded hover:bg-indigo-50 text-indigo-500"
                          aria-label="Edit application"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteApplication(app)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-400"
                          aria-label="Delete application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>
              {pagination.total === 0
                ? "0 results"
                : `Showing ${rangeStart}–${rangeEnd} of ${pagination.total}`}
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </Button>
            <span className="text-xs text-slate-500 px-1">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Add/Edit Application Dialog */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Application" : "New Application"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            <fieldset className="border border-slate-200 rounded-lg px-4 py-4">
              <legend className="px-2 text-sm font-semibold text-slate-700">
                Student Details
              </legend>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Student Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Enter Student Name"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Father Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Enter Father Name"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Class <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.className}
                    onValueChange={(v) => setField("className", v)}
                  >
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASS_OPTIONS.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className={labelClass}>Academic Year</label>
                  <input
                    type="text"
                    name="academicYear"
                    value={formData.academicYear}
                    readOnly
                    className={`${inputClass} bg-slate-50`}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Mobile No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobileNo"
                    value={formData.mobileNo}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    maxLength={10}
                    className={inputClass}
                    placeholder="Enter 10-digit Mobile No"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Application No</label>
                  <input
                    type="text"
                    name="applicationNo"
                    value={formData.applicationNo}
                    disabled
                    className={`${inputClass} bg-slate-100 text-slate-500`}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="border border-slate-200 rounded-lg px-4 py-4">
              <legend className="px-2 text-sm font-semibold text-slate-700">
                Communication Address
              </legend>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="commAddressLine1"
                    value={formData.commAddressLine1}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Enter Communication Address"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Landmark <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="commLandmark"
                    value={formData.commLandmark}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Enter Landmark"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="commCity"
                    value={formData.commCity}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Enter City"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    District <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="commDistrict"
                    value={formData.commDistrict}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Enter District"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    State <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.commState}
                    onValueChange={(v) => setField("commState", v)}
                  >
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES_28.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </fieldset>

            <fieldset className="border border-slate-200 rounded-lg px-4 py-4">
              <legend className="px-2 text-sm font-semibold text-slate-700">
                Permanent Address
              </legend>

              <div className="mb-4 flex items-center gap-2">
                <Checkbox
                  id="permSame"
                  checked={formData.isPermanentSameAsCommunication}
                  onCheckedChange={(checked) =>
                    handlePermanentSameToggle(Boolean(checked))
                  }
                />
                <label htmlFor="permSame" className="text-sm text-slate-700">
                  Permanent Address is same as Communication Address
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="permenantAddressLine1"
                    value={formData.permenantAddressLine1}
                    onChange={handleInputChange}
                    disabled={formData.isPermanentSameAsCommunication}
                    required
                    className={`${inputClass} disabled:bg-slate-100 disabled:cursor-not-allowed`}
                    placeholder="Enter Permanent Address"
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Landmark <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="permenantLandmark"
                    value={formData.permenantLandmark}
                    onChange={handleInputChange}
                    disabled={formData.isPermanentSameAsCommunication}
                    required
                    className={`${inputClass} disabled:bg-slate-100 disabled:cursor-not-allowed`}
                    placeholder="Enter Landmark"
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="permenantCity"
                    value={formData.permenantCity}
                    onChange={handleInputChange}
                    disabled={formData.isPermanentSameAsCommunication}
                    required
                    className={`${inputClass} disabled:bg-slate-100 disabled:cursor-not-allowed`}
                    placeholder="Enter City"
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    District <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="permenantDistrict"
                    value={formData.permenantDistrict}
                    onChange={handleInputChange}
                    disabled={formData.isPermanentSameAsCommunication}
                    required
                    className={`${inputClass} disabled:bg-slate-100 disabled:cursor-not-allowed`}
                    placeholder="Enter District"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    State <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.permenantState}
                    onValueChange={(v) => setField("permenantState", v)}
                    disabled={formData.isPermanentSameAsCommunication}
                  >
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES_28.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </fieldset>

            <fieldset className="border border-slate-200 rounded-lg px-4 py-4">
              <legend className="px-2 text-sm font-semibold text-slate-700">
                Payment Details
              </legend>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Pro Name <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.proName}
                    onValueChange={(v) => setField("proName", v)}
                  >
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue placeholder="Select a Pro Name" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pro 1">Pro 1</SelectItem>
                      <SelectItem value="Pro 2">Pro 2</SelectItem>
                      <SelectItem value="Pro 3">Pro 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className={labelClass}>
                    Select MV/CV No <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center text-sm text-slate-700">
                      <input
                        type="radio"
                        name="selectMV"
                        value="MvNo"
                        checked={formData.selectMV === "MvNo"}
                        onChange={handleInputChange}
                        required
                        className="mr-2"
                      />
                      MvNo
                    </label>
                    <label className="flex items-center text-sm text-slate-700">
                      <input
                        type="radio"
                        name="selectMV"
                        value="CV No"
                        checked={formData.selectMV === "CV No"}
                        onChange={handleInputChange}
                        required
                        className="mr-2"
                      />
                      CV No
                    </label>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Mv No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="mvNo"
                    value={formData.mvNo}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Enter Mv/CV No."
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Bank <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bank"
                    value={formData.bank}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Enter Bank Name"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Previous School <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="previousSchool"
                    value={formData.previousSchool}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Enter Previous School Name"
                    required
                  />
                </div>
              </div>
            </fieldset>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {editingId ? "Update Application" : "Submit Application"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!confirmDeleteApplication}
        onOpenChange={() => setConfirmDeleteApplication(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete this application?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 mt-1">
            <span className="font-medium text-slate-800">
              {confirmDeleteApplication?.studentName}
            </span>
            &apos;s application ({confirmDeleteApplication?.applicationNo})
            will be permanently removed.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteApplication(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ApplicationForm;
