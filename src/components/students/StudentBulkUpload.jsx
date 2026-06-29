import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { entities } from "@/api/entityClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, CheckCircle2, AlertCircle, X } from "lucide-react";

const TEMPLATE_HEADERS = [
  "admission_no",
  "full_name",
  "dob",
  "gender",
  "blood_group",
  "class",
  "section",
  "roll_no",
  "parent_name",
  "parent_phone",
  "parent_email",
  "address",
  "city",
  "joining_date",
  "status",
];

const SAMPLE_ROW = [
  "ADM001",
  "Rahul Kumar",
  "2010-05-15",
  "Male",
  "O+",
  "Class 8",
  "A",
  "1",
  "Suresh Kumar",
  "9876543210",
  "suresh@email.com",
  "123 Main Street",
  "Hyderabad",
  "2024-06-01",
  "Active",
];

export default function StudentBulkUpload({ open, onClose, onUploaded }) {
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const fileRef = useRef();

  const reset = () => {
    setRows([]);
    setErrors([]);
    setDone(false);
    setSuccessCount(0);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, SAMPLE_ROW]);
    ws["!cols"] = TEMPLATE_HEADERS.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "student-upload-template.xlsx");
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, {
        type: "binary",
        cellDates: true,
      });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const errs = [];
      const parsed = data.map((row, i) => {
        const r = {};
        TEMPLATE_HEADERS.forEach((h) => {
          r[h] = String(row[h] || "").trim();
        });
        if (!r.full_name) errs.push(`Row ${i + 2}: full_name is required`);
        if (!r.class) errs.push(`Row ${i + 2}: class is required`);
        // Normalize date fields
        ["dob", "joining_date"].forEach((f) => {
          if (r[f] && r[f] instanceof Date)
            r[f] = r[f].toISOString().split("T")[0];
        });
        if (!r.status) r.status = "Active";
        return r;
      });
      setErrors(errs);
      setRows(parsed);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleUpload = async () => {
    setUploading(true);
    let count = 0;
    for (const row of rows) {
      await entities.Student.create(row);
      count++;
    }
    setSuccessCount(count);
    setUploading(false);
    setDone(true);
    onUploaded();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Upload Students</DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle2 className="w-14 h-14 text-green-500" />
            <p className="text-lg font-semibold text-slate-800">
              {successCount} students uploaded successfully!
            </p>
            <Button
              onClick={handleClose}
              className="bg-indigo-600 hover:bg-indigo-700 mt-2"
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-5 mt-2">
            {/* Step 1 */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-sm font-semibold text-slate-700 mb-2">
                Step 1 — Download the template
              </p>
              <p className="text-xs text-slate-500 mb-3">
                Fill in student details in the provided Excel template. Do not
                change column headers.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="gap-2"
              >
                <Download className="w-4 h-4" /> Download Template (.xlsx)
              </Button>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-sm font-semibold text-slate-700 mb-2">
                Step 2 — Upload your filled file
              </p>
              <p className="text-xs text-slate-500 mb-3">
                Supports .xlsx, .xls, and .csv files.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFile}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current.click()}
                className="gap-2"
              >
                <Upload className="w-4 h-4" /> Choose File
              </Button>
            </div>

            {/* Preview */}
            {rows.length > 0 && (
              <div>
                {errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 text-red-600 font-medium text-sm mb-1">
                      <AlertCircle className="w-4 h-4" /> {errors.length}{" "}
                      validation error(s)
                    </div>
                    {errors.map((e, i) => (
                      <p key={i} className="text-xs text-red-500">
                        {e}
                      </p>
                    ))}
                  </div>
                )}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                  <p className="text-sm font-medium text-green-700">
                    {rows.length} rows detected and ready to import
                  </p>
                </div>
                <div className="overflow-x-auto max-h-48 border border-slate-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 sticky top-0">
                      <tr>
                        {[
                          "Name",
                          "Class",
                          "Section",
                          "Gender",
                          "Parent",
                          "Phone",
                          "Status",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-3 py-2 text-left text-slate-600 font-semibold whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-3 py-1.5 font-medium text-slate-800 whitespace-nowrap">
                            {r.full_name || (
                              <span className="text-red-500">—</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-slate-600">
                            {r.class || <span className="text-red-500">—</span>}
                          </td>
                          <td className="px-3 py-1.5 text-slate-600">
                            {r.section || "—"}
                          </td>
                          <td className="px-3 py-1.5 text-slate-600">
                            {r.gender || "—"}
                          </td>
                          <td className="px-3 py-1.5 text-slate-600 whitespace-nowrap">
                            {r.parent_name || "—"}
                          </td>
                          <td className="px-3 py-1.5 text-slate-600">
                            {r.parent_phone || "—"}
                          </td>
                          <td className="px-3 py-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === "Active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}
                            >
                              {r.status || "Active"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={rows.length === 0 || errors.length > 0 || uploading}
                className="bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {uploading
                  ? "Uploading..."
                  : `Upload ${rows.length > 0 ? rows.length + " Students" : ""}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
