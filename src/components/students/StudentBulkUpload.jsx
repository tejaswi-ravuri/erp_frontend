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
import { Upload, Download, CheckCircle2, AlertCircle } from "lucide-react";

const TEMPLATE_HEADERS = [
  "Uniq-id",
  "Student name",
  "Class",
  "Section",
  "Roll.no",
  "Admission ID",
  "Father name",
  "Father mobile number",
  "Mother name",
  "Mother mobile number",
  "Year of joining",
  "Adhar Number",
  "Gender",
  "Date of Birth",
  "Caste",
  "Communication Address",
  "Permanent Address",
];

const REQUIRED_FIELDS = ["Student name", "Class"];

// Maps sheet column headers to the actual Student schema field names.
// Columns not listed here (Uniq-id, Mother name, Mother mobile number,
// Adhar Number, Caste, Permanent Address, Year of joining) have no home
// in the current schema and are dropped rather than silently mis-saved.
const HEADER_FIELD_MAP = {
  "Student name": "full_name",
  Class: "class",
  Section: "section",
  "Roll.no": "roll_no",
  "Admission ID": "admission_no",
  "Father name": "parent_name",
  "Father mobile number": "parent_phone",
  Gender: "gender",
  "Date of Birth": "dob",
  "Communication Address": "address",
};

export default function StudentBulkUpload({ open, onClose, onUploaded }) {
  const [fileName, setFileName] = useState("");
  const [validRows, setValidRows] = useState([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [errors, setErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [uploadErrors, setUploadErrors] = useState([]);
  const fileRef = useRef();

  const reset = () => {
    setFileName("");
    setValidRows([]);
    setValidCount(0);
    setInvalidCount(0);
    setErrors([]);
    setDone(false);
    setSuccessCount(0);
    setUploadErrors([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const downloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/student_bulkUpload_template.xlsx";
    link.download = "student_bulkUpload_template.xlsx";
    link.click();
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, {
        type: "binary",
        cellDates: true,
      });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const errs = [];
      const valid = [];

      data.forEach((row, i) => {
        const raw = {};
        TEMPLATE_HEADERS.forEach((h) => {
          let val = row[h];
          // Normalize date fields before stringifying, so real Date
          // objects (from cellDates: true) don't get turned into a
          // JS Date.toString() blob first.
          if (val instanceof Date) val = val.toISOString().split("T")[0];
          raw[h] = String(val ?? "").trim();
        });

        const missing = REQUIRED_FIELDS.filter((f) => !raw[f]);
        if (missing.length > 0) {
          errs.push(`Row ${i + 2}: missing ${missing.join(", ")}`);
          return;
        }

        // Translate sheet headers into the field names the Student
        // schema actually expects before this row is sent to the API.
        const mapped = {};
        Object.entries(HEADER_FIELD_MAP).forEach(([header, field]) => {
          if (raw[header]) mapped[field] = raw[header];
        });
        valid.push(mapped);
      });

      setErrors(errs);
      setValidRows(valid);
      setValidCount(valid.length);
      setInvalidCount(errs.length);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleUpload = async () => {
    setUploading(true);
    let count = 0;
    const failMsgs = [];
    for (const row of validRows) {
      try {
        await entities.Student.create(row);
        count++;
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unknown error";
        console.error("Failed to create student row:", row, err);
        if (failMsgs.length < 5) failMsgs.push(msg);
      }
    }
    setSuccessCount(count);
    setUploadErrors(failMsgs);
    setUploading(false);
    setDone(true);
    onUploaded();
  };

  const hasFile = validCount > 0 || invalidCount > 0;

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
            {successCount < validRows.length && (
              <p className="text-sm text-slate-500">
                {validRows.length - successCount} row(s) failed during upload.
              </p>
            )}
            {uploadErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-w-md text-left w-full">
                <p className="text-xs font-medium text-red-600 mb-1">
                  Sample error(s):
                </p>
                {uploadErrors.map((m, i) => (
                  <p key={i} className="text-xs text-red-500 break-words">
                    {m}
                  </p>
                ))}
              </div>
            )}
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
              {fileName && (
                <p className="text-xs text-slate-500 mt-2">
                  Selected: {fileName}
                </p>
              )}
            </div>

            {/* Validation summary (no row-by-row table) */}
            {hasFile && (
              <div className="space-y-2">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <p className="text-sm font-medium text-green-700">
                    {validCount} valid row{validCount !== 1 ? "s" : ""} ready to
                    import
                  </p>
                </div>

                {invalidCount > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-600 font-medium text-sm mb-1">
                      <AlertCircle className="w-4 h-4" />
                      {invalidCount} row{invalidCount !== 1 ? "s" : ""} will be
                      skipped
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-0.5 pl-1">
                      {errors.map((e, i) => (
                        <p key={i} className="text-xs text-red-500">
                          {e}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={validCount === 0 || uploading}
                className="bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {uploading
                  ? "Uploading..."
                  : `Upload ${validCount > 0 ? validCount + " Students" : ""}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
