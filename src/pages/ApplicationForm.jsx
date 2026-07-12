import React, { useState } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";

function ApplicationForm() {
  const [formData, setFormData] = useState({
    studentName: "",
    fatherName: "",
    className: "",
    academicYear: "2026-2027",
    address: "",
    phoneNo: "",
    addressPermanent: "",
    phoneNo2: "",
    proName: "",
    selectMV: "",
    mvNo: "",
    bank: "",
    applicationNo: "",
    previousSchool: "",
    mobileNo: "",
  });

  const [applications, setApplications] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle form submit (Add/Update)
  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if all required fields are filled
    if (
      !formData.studentName ||
      !formData.fatherName ||
      !formData.className ||
      !formData.mobileNo
    ) {
      alert(
        "Please fill all required fields (Student Name, Father Name, Class, Mobile No)",
      );
      return;
    }

    if (editingId) {
      // Update existing application
      const updatedApplications = applications.map((app) =>
        app.id === editingId ? { ...formData, id: editingId } : app,
      );
      setApplications(updatedApplications);
      console.log("Updated Application:", { ...formData, id: editingId });
      setEditingId(null);
    } else {
      // Add new application
      const newApplication = {
        ...formData,
        id: Date.now(),
        applicationNo: formData.applicationNo || `APP-${Date.now()}`,
      };
      setApplications([...applications, newApplication]);
      console.log("New Application:", newApplication);
    }

    // Reset form and close modal
    resetForm();
    closeModal();
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      studentName: "",
      fatherName: "",
      className: "",
      academicYear: "2026-2027",
      address: "",
      phoneNo: "",
      addressPermanent: "",
      phoneNo2: "",
      proName: "",
      selectMV: "",
      mvNo: "",
      bank: "",
      applicationNo: "",
      previousSchool: "",
      mobileNo: "",
    });
  };

  // Open modal for adding new application
  const openAddModal = () => {
    setEditingId(null);
    resetForm();
    setIsModalOpen(true);
  };

  // Open modal for editing
  const openEditModal = (id) => {
    const applicationToEdit = applications.find((app) => app.id === id);
    if (applicationToEdit) {
      setFormData(applicationToEdit);
      setEditingId(id);
      setIsModalOpen(true);
    }
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    resetForm();
  };

  // Handle Delete
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      setApplications(applications.filter((app) => app.id !== id));
    }
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

      {/* Modal Overlay with glassmorphism effect */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop with blur and transparency */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-all duration-300"
            onClick={closeModal}
          ></div>

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
              {/* Modal Header */}
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

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Student Name */}
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

                  {/* Father Name */}
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

                  {/* Class */}
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
                      <option value="Class 1">Class 1</option>
                      <option value="Class 2">Class 2</option>
                      <option value="Class 3">Class 3</option>
                      <option value="Class 4">Class 4</option>
                      <option value="Class 5">Class 5</option>
                      <option value="Class 6">Class 6</option>
                      <option value="Class 7">Class 7</option>
                      <option value="Class 8">Class 8</option>
                      <option value="Class 9">Class 9</option>
                      <option value="Class 10">Class 10</option>
                    </select>
                  </div>

                  {/* Academic Year */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Academic Year
                    </label>
                    <input
                      type="text"
                      name="academicYear"
                      value={formData.academicYear}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/80"
                      readOnly
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                      placeholder="Enter Address"
                    />
                  </div>

                  {/* Phone No */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone No
                    </label>
                    <input
                      type="text"
                      name="phoneNo"
                      value={formData.phoneNo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                      placeholder="Enter Phone No"
                    />
                  </div>

                  {/* Address Permanent */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Permanent
                    </label>
                    <input
                      type="text"
                      name="addressPermanent"
                      value={formData.addressPermanent}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                      placeholder="Enter Permanent Address"
                    />
                  </div>

                  {/* Phone No 2 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone No 2
                    </label>
                    <input
                      type="text"
                      name="phoneNo2"
                      value={formData.phoneNo2}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                      placeholder="Enter Phone No 2"
                    />
                  </div>

                  {/* Mobile No (Required) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile No <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="mobileNo"
                      value={formData.mobileNo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                      placeholder="Enter Mobile No"
                      required
                    />
                  </div>

                  {/* Pro Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pro Name
                    </label>
                    <select
                      name="proName"
                      value={formData.proName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                    >
                      <option value="">Select a ProName</option>
                      <option value="Pro 1">Pro 1</option>
                      <option value="Pro 2">Pro 2</option>
                      <option value="Pro 3">Pro 3</option>
                    </select>
                  </div>

                  {/* Select MV/CV */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select MV/CV No
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="selectMV"
                          value="MvNo"
                          checked={formData.selectMV === "MvNo"}
                          onChange={handleInputChange}
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
                          className="mr-2"
                        />
                        CV No
                      </label>
                    </div>
                  </div>

                  {/* MV No */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mv No
                    </label>
                    <input
                      type="text"
                      name="mvNo"
                      value={formData.mvNo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                      placeholder="Enter Mv/CV No."
                    />
                  </div>

                  {/* Bank */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank
                    </label>
                    <input
                      type="text"
                      name="bank"
                      value={formData.bank}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                      placeholder="Enter Bank Name"
                    />
                  </div>

                  {/* Application No */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Application No
                    </label>
                    <input
                      type="text"
                      name="applicationNo"
                      value={formData.applicationNo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                      placeholder="Enter Application No"
                    />
                  </div>

                  {/* Previous School */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Previous School
                    </label>
                    <input
                      type="text"
                      name="previousSchool"
                      value={formData.previousSchool}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                      placeholder="Enter Previous School Name"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
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

      {/* Applications Table */}
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
                    key={app.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {app.applicationNo || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {app.studentName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {app.fatherName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {app.className}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {app.academicYear}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {app.mobileNo}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEditModal(app.id)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(app.id)}
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
