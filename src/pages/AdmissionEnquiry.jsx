import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Edit,
  Trash2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import http from "../api/http";
import { CLASS_LIST } from "@/lib/constants";

// Same convention as HallTicket.jsx / BPAttendance.jsx elsewhere in the app -
// plain numbers ("Class 5"), never roman numerals.
const classLabel = (grade) => (/^\d+$/.test(grade) ? `Class ${grade}` : grade);
const CLASS_OPTIONS = CLASS_LIST.map(classLabel);

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const statesOfIndia = [
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
];

const boardOptions = ["CBSE", "ICSE", "Others"];

const enquiryTypeOptions = [
  "Advertisement",
  "Hoarding",
  "Friends",
  "Door to Door",
  "Existing Parent",
  "Staff Referral",
  "Entrance Test",
  "Others",
];

const statusOptions = ["Under Review", "Admitted", "Rejected"];

const academicYears = ["2026-2027", "2025-2026", "2024-2025"];

const EMPTY_FORM = {
  academicYear: "2026-2027",
  studentName: "",
  className: "",
  fatherName: "",
  phoneNo: "",
  addressLine1: "",
  landmark: "",
  city: "",
  district: "",
  state: "",
  previousSchool: "",
  board: "",
  emailId: "",
  enquiryType: "",
  proName: "",
};

const apiErrorMessage = (err) =>
  err?.response?.data?.message || err?.message || "Something went wrong";

const AdmissionEnquiry = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [enquiries, setEnquiries] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });

  // Filters - sent to the backend, not applied client-side.
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [confirmDeleteEnquiry, setConfirmDeleteEnquiry] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterClass, filterStatus, filterYear, dateFrom, dateTo]);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const params = { page, limit: pageSize };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterClass !== "all") params.className = filterClass;
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterYear !== "all") params.academicYear = filterYear;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await http.get("/api/admissions/enquiries", {
        params,
      });
      if (response.data.success) {
        setEnquiries(response.data.data || []);
        setPagination(
          response.data.pagination || { total: 0, page: 1, limit: pageSize, pages: 1 },
        );
      } else {
        toast.error("Failed to fetch enquiries");
      }
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedSearch, filterClass, filterStatus, filterYear, dateFrom, dateTo]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const generateId = () => {
    const count = Math.floor(Math.random() * 10000);
    const year = new Date().getFullYear();
    return `MM${year}${String(count).padStart(4, "0")}`;
  };

  const resetForm = () => setFormData(EMPTY_FORM);

  const handleSubmit = async () => {
    if (
      !formData.studentName ||
      !formData.className ||
      !formData.fatherName ||
      !formData.phoneNo ||
      !formData.academicYear ||
      !formData.board ||
      !formData.emailId ||
      !formData.enquiryType ||
      !formData.proName ||
      !formData.previousSchool ||
      !formData.addressLine1 ||
      !formData.landmark ||
      !formData.city ||
      !formData.district ||
      !formData.state
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsLoading(true);

    const newEnquiry = {
      id: generateId(),
      studentName: formData.studentName,
      mobile: formData.phoneNo,
      academicYear: formData.academicYear || "2026-2027",
      status: "Under Review",
      date: new Date().toISOString(),
      fatherName: formData.fatherName,
      className: formData.className,
      board: formData.board || "CBSE",
      emailId: formData.emailId,
      addressLine1: formData.addressLine1 || "",
      landmark: formData.landmark || "",
      city: formData.city || "",
      district: formData.district || "",
      state: formData.state || "",
      previousSchool: formData.previousSchool || "",
      enquiryType: formData.enquiryType || "",
      proName: formData.proName || "",
    };

    try {
      const response = await http.post(
        "/api/admissions/addEnquiry",
        newEnquiry,
      );
      if (response.data.success) {
        toast.success(
          editingId ? "Enquiry updated successfully!" : "Enquiry added successfully!",
        );
        fetchEnquiries();
      } else {
        toast.error(response.data.message || "Failed to save enquiry");
      }
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      resetForm();
      setIsDialogOpen(false);
      setEditingId(null);
      setIsLoading(false);
    }
  };

  const handleEdit = (enquiry) => {
    setFormData({
      academicYear: enquiry.academicYear || "2026-2027",
      studentName: enquiry.studentName || "",
      className: enquiry.className || "",
      fatherName: enquiry.fatherName || "",
      phoneNo: enquiry.mobile || "",
      addressLine1: enquiry.addressLine1 || "",
      landmark: enquiry.landmark || "",
      city: enquiry.city || "",
      district: enquiry.district || "",
      state: enquiry.state || "",
      previousSchool: enquiry.previousSchool || "",
      board: enquiry.board || "",
      emailId: enquiry.emailId || "",
      enquiryType: enquiry.enquiryType || "",
      proName: enquiry.proName || "",
    });
    setEditingId(enquiry._id || enquiry.applicationid);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!confirmDeleteEnquiry) return;
    setDeleting(true);
    try {
      const deleteId =
        confirmDeleteEnquiry._id || confirmDeleteEnquiry.applicationid;
      const response = await http.delete(
        `/api/admissions/enquiry/${deleteId}`,
      );
      if (response.data.success) {
        toast.success("Enquiry deleted successfully!");
        setConfirmDeleteEnquiry(null);
        fetchEnquiries();
      } else {
        toast.error(response.data.message || "Failed to delete enquiry");
      }
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Admitted":
        return (
          <Badge className="bg-emerald-500 text-white">
            <CheckCircle className="w-3 h-3 mr-1" /> Admitted
          </Badge>
        );
      case "Under Review":
        return (
          <Badge className="bg-amber-500 text-white">
            <Clock className="w-3 h-3 mr-1" /> Under Review
          </Badge>
        );
      case "Rejected":
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const rangeStart = pagination.total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, pagination.total);
  const totalPages = pagination.pages || 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Enquiries</h2>
          <p className="text-sm text-slate-500">
            {pagination.total} total enquiries
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingId(null);
            setIsDialogOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm gap-1.5"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4" /> Add Enquiry
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
            {statusOptions.map((s) => (
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
                  "App No.",
                  "Student Name",
                  "Father Name",
                  "Phone Number",
                  "Class",
                  "Previous School",
                  "Enquiry Type",
                  "Acad. Year",
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
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : enquiries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    No enquiries found
                  </td>
                </tr>
              ) : (
                enquiries.map((enquiry) => (
                  <tr key={enquiry._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-indigo-600">
                      {enquiry.applicationid}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {enquiry.studentName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {enquiry.fatherName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {enquiry.mobile}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {enquiry.className}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {enquiry.previousSchool}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {enquiry.enquiryType}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {enquiry.academicYear}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(enquiry.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(enquiry)}
                          className="p-1.5 rounded hover:bg-indigo-50 text-indigo-500"
                          aria-label="Edit enquiry"
                          disabled={isLoading}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteEnquiry(enquiry)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-400"
                          aria-label="Delete enquiry"
                          disabled={isLoading}
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

      {/* Add/Edit Enquiry Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Enquiry" : "Add New Enquiry"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">
                Academic Year
              </Label>
              <Select
                value={formData.academicYear}
                onValueChange={(value) =>
                  handleInputChange("academicYear", value)
                }
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">
                Student Name *
              </Label>
              <Input
                value={formData.studentName}
                onChange={(e) =>
                  handleInputChange("studentName", e.target.value)
                }
                className="text-sm"
                placeholder="Enter Student Name"
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">
                Class *
              </Label>
              <Select
                value={formData.className}
                onValueChange={(value) => handleInputChange("className", value)}
              >
                <SelectTrigger className="text-sm">
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
              <Label className="text-xs font-medium text-slate-600 mb-1 block">
                Father Name *
              </Label>
              <Input
                value={formData.fatherName}
                onChange={(e) =>
                  handleInputChange("fatherName", e.target.value)
                }
                className="text-sm"
                placeholder="Enter Father Name"
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">
                Phone No *
              </Label>
              <Input
                type="tel"
                value={formData.phoneNo}
                onChange={(e) => handleInputChange("phoneNo", e.target.value)}
                className="text-sm"
                placeholder="Enter Phone No"
              />
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs font-medium text-slate-600 mb-1 block">
                Address (Line 1) *
              </Label>
              <Input
                value={formData.addressLine1}
                onChange={(e) =>
                  handleInputChange("addressLine1", e.target.value)
                }
                className="text-sm"
                placeholder="Enter Address"
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">
                Landmark *
              </Label>
              <Input
                value={formData.landmark}
                onChange={(e) => handleInputChange("landmark", e.target.value)}
                className="text-sm"
                placeholder="Enter Landmark"
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">
                City *
              </Label>
              <Input
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                className="text-sm"
                placeholder="Enter City"
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">
                District *
              </Label>
              <Input
                value={formData.district}
                onChange={(e) => handleInputChange("district", e.target.value)}
                className="text-sm"
                placeholder="Enter District"
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">
                State *
              </Label>
              <Select
                value={formData.state}
                onValueChange={(value) => handleInputChange("state", value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {statesOfIndia.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">
                Previous School *
              </Label>
              <Input
                value={formData.previousSchool}
                onChange={(e) =>
                  handleInputChange("previousSchool", e.target.value)
                }
                className="text-sm"
                placeholder="Enter Previous School"
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">
                Board *
              </Label>
              <Select
                value={formData.board}
                onValueChange={(value) => handleInputChange("board", value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select Board" />
                </SelectTrigger>
                <SelectContent>
                  {boardOptions.map((board) => (
                    <SelectItem key={board} value={board}>
                      {board}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">
                Email Id *
              </Label>
              <Input
                type="email"
                value={formData.emailId}
                onChange={(e) => handleInputChange("emailId", e.target.value)}
                className="text-sm"
                placeholder="Enter Email Id"
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">
                Enquiry Type *
              </Label>
              <Select
                value={formData.enquiryType}
                onValueChange={(value) =>
                  handleInputChange("enquiryType", value)
                }
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select Enquiry Type" />
                </SelectTrigger>
                <SelectContent>
                  {enquiryTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">
                Pro Name *
              </Label>
              <Input
                value={formData.proName}
                onChange={(e) => handleInputChange("proName", e.target.value)}
                className="text-sm"
                placeholder="Enter Pro Name"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
                setEditingId(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isLoading}
            >
              {isLoading
                ? editingId
                  ? "Updating..."
                  : "Submitting..."
                : editingId
                  ? "Update Enquiry"
                  : "Submit Enquiry"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!confirmDeleteEnquiry}
        onOpenChange={() => setConfirmDeleteEnquiry(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete this enquiry?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 mt-1">
            <span className="font-medium text-slate-800">
              {confirmDeleteEnquiry?.studentName}
            </span>
            &apos;s enquiry ({confirmDeleteEnquiry?.applicationid}) will be
            permanently removed.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteEnquiry(null)}
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
};

export default AdmissionEnquiry;
