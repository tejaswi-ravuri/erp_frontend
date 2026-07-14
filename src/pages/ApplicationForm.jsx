import React, { useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2, X, UserPlus } from "lucide-react";
import http from "../api/http";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

  const [applications, setApplications] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  const defaultAcademicYear = "2026-2027";

  const initialFormData = {
    // Student Details
    studentName: "",
    fatherName: "",
    className: "",
    academicYear: defaultAcademicYear,
    mobileNo: "",

    // Application Number (auto, disabled)
    applicationNo: "",

    // Communication Address
    commAddressLine1: "",
    commLandmark: "",
    commCity: "",
    commDistrict: "",
    commState: "",

    // Permanent Address
    permenantAddressLine1: "",
    permenantLandmark: "",
    permenantCity: "",
    permenantDistrict: "",
    permenantState: "",

    // Permanent = Communication
    isPermanentSameAsCommunication: false,

    // Payment Details
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
    // MM{year}000{lengthof number of applications of that year}
    // Example asked: MM20260001
    // That implies: MM + year + 00 + seq(2 digits or more). We'll follow example:
    // MM{year}000{seq padded to 2 digits}
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

  const fetchApplications = async () => {
    const { data } = await http.get("/api/admissions/applications");
    setApplications(data?.data ?? []);
  };

  const fetchApplicationById = async (id) => {
    const { data } = await http.get(`/api/admissions/application/${id}`);
    return data?.data;
  };

  useEffect(() => {
    fetchApplications().catch((e) =>
      console.error("fetchApplications error", e),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

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
      // backend fields: keep these as-is (student_name etc if backend uses snake_case)
      // try mapping if needed
      studentName: app.studentName ?? app.student_name ?? "",
      fatherName: app.fatherName ?? app.father_name ?? "",
      className: app.className ?? app.class_name ?? app.className ?? "",
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

      permenantAddressLine1:
        app.permenantAddressLine1 ??
        app.permenantAddressLine1 ??
        app.permanentAddressLine1 ??
        "",
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
      alert(
        "Please fill all required fields (Student Name, Father Name, Class).",
      );
      return;
    }

    if (!validateMobile(formData.mobileNo)) {
      alert("Mobile No must be exactly 10 digits.");
      return;
    }

    // Guard permanent fields: if checkbox checked, they should be synced and disabled.
    // If unchecked, backend expects permanent fields; keep as empty if user didn't fill.

    if (!editingId) {
      await http.post("/api/admissions/addApplication", formData);
    } else {
      await http.put(`/api/admissions/application/${editingId}`, formData);
    }

    await fetchApplications();
    closeModal();
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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?"))
      return;
    await http.delete(`/api/admissions/application/${id}`);
    await fetchApplications();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Student Applications</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Application
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-all duration-300"
            onClick={closeModal}
          ></div>

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4 rounded-t-lg z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingId ? "Edit Application" : "New Application"}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={24} className="text-gray-500" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-4">
                <fieldset className="border border-gray-200 rounded-lg px-4 py-4 mb-5">
                  <legend className="px-2 text-sm font-semibold text-gray-700">
                    Student Details
                  </legend>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Student Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="studentName"
                        value={formData.studentName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                        placeholder="Enter Student Name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Father Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                        placeholder="Enter Father Name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Class <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="className"
                        value={formData.className}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                        required
                      >
                        <option value="">--Select--</option>
                        {classOptions.map((cls) => (
                          <option key={cls} value={cls}>
                            {cls}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Academic Year
                      </label>
                      <input
                        type="text"
                        name="academicYear"
                        value={formData.academicYear}
                        readOnly
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/80"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile No <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mobileNo"
                        value={formData.mobileNo}
                        onChange={handleInputChange}
                        inputMode="numeric"
                        maxLength={10}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                        placeholder="Enter 10-digit Mobile No"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Application No
                      </label>
                      <input
                        type="text"
                        name="applicationNo"
                        value={formData.applicationNo}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                      />
                    </div>
                  </div>
                </fieldset>

                <fieldset className="border border-gray-200 rounded-lg px-4 py-4 mb-5">
                  <legend className="px-2 text-sm font-semibold text-gray-700">
                    Communication Address
                  </legend>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="commAddressLine1"
                        value={formData.commAddressLine1}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                        placeholder="Enter Communication Address"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Landmark <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="commLandmark"
                        value={formData.commLandmark}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                        placeholder="Enter Landmark"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="commCity"
                        value={formData.commCity}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                        placeholder="Enter City"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        District <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="commDistrict"
                        value={formData.commDistrict}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                        placeholder="Enter District"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="commState"
                        value={formData.commState}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                        required
                      >
                        <option value="">--Select State--</option>
                        {STATES_28.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="border border-gray-200 rounded-lg px-4 py-4 mb-5">
                  <legend className="px-2 text-sm font-semibold text-gray-700">
                    Permanent Address
                  </legend>

                  <div className="mb-4 flex items-center gap-3">
                    <input
                      id="permSame"
                      type="checkbox"
                      name="isPermanentSameAsCommunication"
                      checked={formData.isPermanentSameAsCommunication}
                      onChange={(e) =>
                        handlePermanentSameToggle(e.target.checked)
                      }
                      className="h-4 w-4"
                    />
                    <label htmlFor="permSame" className="text-sm text-gray-700">
                      Permanent Address is same as Communication Address
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="permenantAddressLine1"
                        value={formData.permenantAddressLine1}
                        onChange={handleInputChange}
                        disabled={formData.isPermanentSameAsCommunication}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter Permanent Address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Landmark <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="permenantLandmark"
                        value={formData.permenantLandmark}
                        onChange={handleInputChange}
                        disabled={formData.isPermanentSameAsCommunication}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter Landmark"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="permenantCity"
                        value={formData.permenantCity}
                        onChange={handleInputChange}
                        disabled={formData.isPermanentSameAsCommunication}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter City"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        District <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="permenantDistrict"
                        value={formData.permenantDistrict}
                        onChange={handleInputChange}
                        disabled={formData.isPermanentSameAsCommunication}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter District"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="permenantState"
                        value={formData.permenantState}
                        onChange={handleInputChange}
                        disabled={formData.isPermanentSameAsCommunication}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">--Select State--</option>
                        {STATES_28.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="border border-gray-200 rounded-lg px-4 py-4 mb-5">
                  <legend className="px-2 text-sm font-semibold text-gray-700">
                    Payment Details
                  </legend>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pro Name <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="proName"
                        value={formData.proName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                        required
                      >
                        <option value="">Select a ProName</option>
                        <option value="Pro 1">Pro 1</option>
                        <option value="Pro 2">Pro 2</option>
                        <option value="Pro 3">Pro 3</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select MV/CV No <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
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
                        <label className="flex items-center">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mv No <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="mvNo"
                        value={formData.mvNo}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                        placeholder="Enter Mv/CV No."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="bank"
                        value={formData.bank}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                        placeholder="Enter Bank Name"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Previous School <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="previousSchool"
                        value={formData.previousSchool}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                        placeholder="Enter Previous School Name"
                        required
                      />
                    </div>
                  </div>
                </fieldset>

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-200/50 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-200/80 text-gray-800 rounded-lg hover:bg-gray-300/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingId ? "Update Application" : "Submit Application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Application No
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Student Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Father Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Class
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Academic Year
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Mobile No
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No applications found. Click "Add Application" to create
                    one.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr
                    key={app._id || app.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {app.applicationNo || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {app.studentName || app.student_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {app.fatherName || app.father_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {app.className || app.class_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {app.academicYear}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {app.mobileNo || app.mobile}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        {!app.isAdmitted && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                            title="Convert to Admission"
                            onClick={() => handleConvertToAdmission(app)}
                          >
                            <UserPlus className="w-3 h-3" />
                          </Button>
                        )}
                        <button
                          onClick={() => openEditModal(app._id || app.id)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(app._id || app.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ApplicationForm;
