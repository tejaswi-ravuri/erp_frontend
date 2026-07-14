import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
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
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import http from "../api/http";

const AdmissionEnquiry = () => {
  // State for form
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const [formData, setFormData] = useState({
    academicYear: "2026-2027",
    schoolBranch: "",
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
  });

  // State for enquiries data
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("All Classes");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [filterYear, setFilterYear] = useState("All Years");
  const [filterBranch, setFilterBranch] = useState("All Branches");
  const [editingId, setEditingId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Class options
  const classOptions = [
    "NURSERY",
    "L.K.G",
    "U.K.G",
    "I Class",
    "II Class",
    "III Class",
    "IV Class",
    "V Class",
    "VI Class",
    "VII Class",
    "VIII Class",
    "IX Class",
    "X Class",
  ];

  // Board options
  const boardOptions = ["CBSE", "ICSE", "Others"];

  // Enquiry type options
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

  // Status options
  const statusOptions = ["Under Review", "Admitted", "Rejected"];

  // Branch options
  const branchOptions = ["Miyapur", "Boduppal", "Kompally"];

  // Academic years
  const academicYears = ["2026-2027", "2025-2026", "2024-2025"];

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    try {
      setIsLoading(true);
      const response = await http.get("/api/admissions/enquiries");
      console.log("Fetched enquiries:", response.data);

      if (response.data.success) {
        const enquiriesData = response.data.data.map((item) => ({
          ...item,
          id: item.applicationid || item._id,
          // Format date for display
          date: item.date
            ? new Date(item.date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
          mobile: item.mobile || item.phoneNo,
          addressLine1: item.addressLine1 || item.address || "",
          landmark: item.landmark || "",
          city: item.city || "",
          district: item.district || "",
          state: item.state || "",
        }));
        setEnquiries(enquiriesData);
      } else {
        toast.error("Failed to fetch Application enquiries");
      }
    } catch (error) {
      console.log("Error fetching enquiries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and search enquiries
  useEffect(() => {
    let filtered = [...enquiries];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.studentName?.toLowerCase().includes(term) ||
          item.id?.toLowerCase().includes(term) ||
          item.mobile?.includes(term),
      );
    }

    // Class filter
    if (filterClass !== "All Classes") {
      filtered = filtered.filter((item) => item.className === filterClass);
    }

    // Status filter
    if (filterStatus !== "All Status") {
      filtered = filtered.filter((item) => item.status === filterStatus);
    }

    // Year filter
    if (filterYear !== "All Years") {
      filtered = filtered.filter((item) => item.academicYear === filterYear);
    }

    // Branch filter
    if (filterBranch !== "All Branches") {
      filtered = filtered.filter((item) => item.branch === filterBranch);
    }

    setFilteredEnquiries(filtered);
    setCurrentPage(1);
  }, [
    searchTerm,
    filterClass,
    filterStatus,
    filterYear,
    filterBranch,
    enquiries,
  ]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Generate unique ID
  const generateId = () => {
    const count = Math.floor(Math.random() * 10000);
    const year = new Date().getFullYear();
    return `MM${year}${String(count).padStart(4, "0")}`;
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate required fields
    if (
      !formData.studentName ||
      !formData.className ||
      !formData.fatherName ||
      !formData.phoneNo ||
      !formData.academicYear ||
      !formData.schoolBranch ||
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
      branch: formData.schoolBranch,
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
      console.log("Backend response:", response.data);

      if (response.data.success) {
        const responseData = response.data.data;

        let updatedEnquiries;
        if (editingId) {
          // Update existing enquiry
          updatedEnquiries = enquiries.map((item) =>
            item.id === editingId || item._id === editingId
              ? {
                  ...responseData,
                  id: responseData.applicationid || editingId,
                  date: responseData.date
                    ? new Date(responseData.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : new Date().toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }),
                  mobile: responseData.mobile || formData.phoneNo,
                }
              : item,
          );
          toast.success("Enquiry updated successfully!");
        } else {
          // Add new enquiry
          const newEntry = {
            ...responseData,
            // Ensure the UI uses the correct application id immediately (no refresh).
            id:
              responseData.applicationid || responseData.id || responseData._id,
            date: responseData.date
              ? new Date(responseData.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }),
            mobile: responseData.mobile || formData.phoneNo,
          };

          updatedEnquiries = [newEntry, ...enquiries];
          toast.success("Enquiry added successfully!");
        }

        // Update local state and localStorage
        setEnquiries(updatedEnquiries);
      } else {
        toast.error(response.data.message || "Failed to save enquiry");
      }
    } catch (error) {
      console.error("Error saving enquiry:", error);
      toast.error(
        error.response?.data?.message ||
          "Error saving enquiry. Please try again.",
      );
    } finally {
      // Reset form and close dialog
      resetForm();
      setIsDialogOpen(false);
      setEditingId(null);
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      academicYear: "2026-2027",
      schoolBranch: "",
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
    });
  };

  // Edit enquiry
  const handleEdit = (enquiry) => {
    setFormData({
      academicYear: enquiry.academicYear || "2026-2027",
      schoolBranch: enquiry.branch || "",
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
    setEditingId(enquiry._id || enquiry.id || enquiry.applicationid);
    setIsDialogOpen(true);
  };

  // Delete enquiry
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this enquiry?")) {
      return;
    }

    try {
      setIsLoading(true);
      // Find the enquiry to get its _id for backend deletion
      const enquiryToDelete = enquiries.find(
        (item) =>
          item.id === id || item._id === id || item.applicationid === id,
      );

      if (enquiryToDelete) {
        const deleteId =
          enquiryToDelete._id || enquiryToDelete.applicationid || id;
        const response = await http.delete(
          `/api/admissions/enquiry/${deleteId}`,
        );

        if (response.data.success) {
          const updatedEnquiries = enquiries.filter(
            (item) =>
              item.id !== id && item._id !== id && item.applicationid !== id,
          );
          setEnquiries(updatedEnquiries);
          localStorage.setItem("enquiries", JSON.stringify(updatedEnquiries));
          toast.success("Enquiry deleted successfully!");
        } else {
          toast.error(response.data.message || "Failed to delete enquiry");
        }
      }
    } catch (error) {
      console.error("Error deleting enquiry:", error);
      toast.error(error.response?.data?.message || "Failed to delete enquiry");
    } finally {
      setIsLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "Admitted":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="w-3 h-3 mr-1" /> Admitted
          </Badge>
        );
      case "Under Review":
        return (
          <Badge className="bg-yellow-500 text-white">
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

  // Get paginated data
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredEnquiries.slice(startIndex, endIndex);
  };

  // Total pages
  const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage);

  // Get stats
  const stats = {
    total: enquiries.length,
    admitted: enquiries.filter((e) => e.status === "Admitted").length,
    underReview: enquiries.filter((e) => e.status === "Under Review").length,
    rejected: enquiries.filter((e) => e.status === "Rejected").length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Application Enquiry
          </h1>
          <p className="text-sm text-gray-500">
            {stats.total} total applications
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingId(null);
            setIsDialogOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Enquiry
        </Button>
      </div>

      {/* Statistics Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Admitted</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.admitted}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Under Review</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.underReview}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.rejected}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div> */}

      {/* Filters */}
      {/* <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search name, app no, or unique ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Years">All Years</SelectItem>
              {academicYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterBranch} onValueChange={setFilterBranch}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Branches">All Branches</SelectItem>
              {branchOptions.map((branch) => (
                <SelectItem key={branch} value={branch}>
                  {branch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Classes">All Classes</SelectItem>
              {classOptions.map((cls) => (
                <SelectItem key={cls} value={cls}>
                  {cls}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Status">All Status</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div> */}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">
                  APP NO.
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  STUDENT NAME
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  FATHER NAME
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  PHONE NUMBER
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  CLASS
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  PREVIOUS SCHOOL
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  ENQUIRY TYPE
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  ACAD. YEAR
                </TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">
                  ACTIONS
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && getPaginatedData().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : getPaginatedData().length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-gray-500"
                  >
                    No enquiries found
                  </TableCell>
                </TableRow>
              ) : (
                getPaginatedData().map((enquiry) => (
                  <TableRow
                    key={enquiry._id || enquiry.id}
                    className="hover:bg-gray-50"
                  >
                    <TableCell className="font-medium text-blue-600">
                      {enquiry.applicationid}
                    </TableCell>
                    <TableCell>{enquiry.studentName}</TableCell>
                    <TableCell>{enquiry.fatherName}</TableCell>
                    <TableCell>{enquiry.mobile}</TableCell>
                    <TableCell>{enquiry.className}</TableCell>
                    <TableCell>{enquiry.previousSchool}</TableCell>
                    <TableCell>{enquiry.enquiryType}</TableCell>
                    <TableCell>{enquiry.academicYear}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(enquiry)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          title="Edit Enquiry"
                          disabled={isLoading}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDelete(enquiry.id || enquiry._id)
                          }
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          title="Delete Enquiry"
                          disabled={isLoading}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredEnquiries.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredEnquiries.length)}{" "}
              of {filteredEnquiries.length}
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={String(itemsPerPage)}
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-25">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 / page</SelectItem>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-blue-50 text-blue-600 border-blue-200"
                >
                  {currentPage}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Enquiry Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(nextOpen) => {
          // Allow closing only when triggered explicitly (Cancel/Submit success
          // and the built-in dialog close button).
          setIsDialogOpen(nextOpen);
        }}
      >
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          onPointerDownOutside={(e) => {
            // Prevent close on outside click
            e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            // Prevent close on ESC
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingId ? "Edit Enquiry" : "Add New Enquiry"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label
                htmlFor="academicYear"
                className="text-sm font-medium text-gray-700"
              >
                Academic Year
              </Label>
              <Select
                value={formData.academicYear}
                onValueChange={(value) =>
                  handleInputChange("academicYear", value)
                }
              >
                <SelectTrigger className="mt-1">
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
              <Label
                htmlFor="schoolBranch"
                className="text-sm font-medium text-gray-700"
              >
                School Branch
              </Label>
              <Select
                id="schoolBranch"
                value={formData.schoolBranch}
                onValueChange={(value) =>
                  handleInputChange("schoolBranch", value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select School Branch" />
                </SelectTrigger>
                <SelectContent>
                  {branchOptions.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label
                htmlFor="studentName"
                className="text-sm font-medium text-gray-700"
              >
                Student Name *
              </Label>
              <Input
                id="studentName"
                value={formData.studentName}
                onChange={(e) =>
                  handleInputChange("studentName", e.target.value)
                }
                className="mt-1"
                placeholder="Enter Student Name"
                required
              />
            </div>

            <div>
              <Label
                htmlFor="className"
                className="text-sm font-medium text-gray-700"
              >
                Class Name *
              </Label>
              <Select
                value={formData.className}
                onValueChange={(value) => handleInputChange("className", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classOptions.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label
                htmlFor="fatherName"
                className="text-sm font-medium text-gray-700"
              >
                Father Name *
              </Label>
              <Input
                id="fatherName"
                value={formData.fatherName}
                onChange={(e) =>
                  handleInputChange("fatherName", e.target.value)
                }
                className="mt-1"
                placeholder="Enter Father Name"
                required
              />
            </div>

            <div>
              <Label
                htmlFor="phoneNo"
                className="text-sm font-medium text-gray-700"
              >
                Phone No *
              </Label>
              <Input
                id="phoneNo"
                type="tel"
                value={formData.phoneNo}
                onChange={(e) => handleInputChange("phoneNo", e.target.value)}
                className="mt-1"
                placeholder="Enter Phone No"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label
                htmlFor="addressLine1"
                className="text-sm font-medium text-gray-700"
              >
                Address (Line 1) *
              </Label>
              <Input
                id="addressLine1"
                value={formData.addressLine1}
                onChange={(e) =>
                  handleInputChange("addressLine1", e.target.value)
                }
                className="mt-1"
                placeholder="Enter Address"
                required
              />
            </div>

            <div>
              <Label
                htmlFor="landmark"
                className="text-sm font-medium text-gray-700"
              >
                Landmark *
              </Label>
              <Input
                id="landmark"
                value={formData.landmark}
                onChange={(e) => handleInputChange("landmark", e.target.value)}
                className="mt-1"
                placeholder="Enter Landmark"
                required
              />
            </div>

            <div>
              <Label
                htmlFor="city"
                className="text-sm font-medium text-gray-700"
              >
                City *
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                className="mt-1"
                placeholder="Enter City"
                required
              />
            </div>

            <div>
              <Label
                htmlFor="district"
                className="text-sm font-medium text-gray-700"
              >
                District *
              </Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) => handleInputChange("district", e.target.value)}
                className="mt-1"
                placeholder="Enter District"
                required
              />
            </div>

            <div>
              <Label
                htmlFor="state"
                className="text-sm font-medium text-gray-700"
              >
                State *
              </Label>
              <Select
                value={formData.state}
                onValueChange={(value) => handleInputChange("state", value)}
              >
                <SelectTrigger className="mt-1">
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
              <Label
                htmlFor="previousSchool"
                className="text-sm font-medium text-gray-700"
              >
                Previous School *
              </Label>
              <Input
                id="previousSchool"
                value={formData.previousSchool}
                onChange={(e) =>
                  handleInputChange("previousSchool", e.target.value)
                }
                className="mt-1"
                placeholder="Enter Previous School"
                required
              />
            </div>

            <div>
              <Label
                htmlFor="board"
                className="text-sm font-medium text-gray-700"
              >
                Board *
              </Label>
              <Select
                value={formData.board}
                onValueChange={(value) => handleInputChange("board", value)}
              >
                <SelectTrigger className="mt-1">
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
              <Label
                htmlFor="emailId"
                className="text-sm font-medium text-gray-700"
              >
                Email Id *
              </Label>

              <Input
                id="emailId"
                type="email"
                value={formData.emailId}
                onChange={(e) => handleInputChange("emailId", e.target.value)}
                className="mt-1"
                placeholder="Enter Email Id"
                required
              />
            </div>

            <div>
              <Label
                htmlFor="enquiryType"
                className="text-sm font-medium text-gray-700"
              >
                Enquiry Type *
              </Label>

              <Select
                value={formData.enquiryType}
                onValueChange={(value) =>
                  handleInputChange("enquiryType", value)
                }
              >
                <SelectTrigger className="mt-1">
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
              <Label
                htmlFor="proName"
                className="text-sm font-medium text-gray-700"
              >
                Pro Name *
              </Label>
              <Input
                id="proName"
                value={formData.proName}
                onChange={(e) => handleInputChange("proName", e.target.value)}
                className="mt-1"
                placeholder="Enter Pro Name"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
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
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingId ? "Updating..." : "Submitting..."}
                </>
              ) : editingId ? (
                "Update Enquiry"
              ) : (
                "Submit Enquiry"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdmissionEnquiry;
