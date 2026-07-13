import React, { useState, useEffect, useMemo } from "react";
import { feeApi, classApi } from "@/api/api";
import { toast } from "sonner";
import { Search, UserPlus, CheckCircle2, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const apiErrorMessage = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  "Something went wrong";

// Each bucket's opt-in flag + its gross/concession/paid field names -
// mirrors FEE_BUCKETS in feeController.js so the checkbox toggle and the
// backend's own zero-out-when-disabled sanitization can't drift apart.
const FEE_BUCKETS = [
  {
    key: "admission",
    flag: "has_admission_fee",
    label: "Admission Fee",
    gross: "adm_gross_fee",
    concession: "adm_concession",
    paid: "paid_adm_fee",
  },
  {
    key: "term",
    flag: "has_term_fee",
    label: "Term Fee",
    gross: "gross_term_fee",
    concession: "term_concession",
    paid: "paid_term_fee",
  },
  {
    key: "transport",
    flag: "has_transport_fee",
    label: "Transport Fee",
    gross: "transport_gross_fee",
    concession: "transport_concession",
    paid: "paid_transport_fee",
  },
  {
    key: "application",
    flag: "has_application_fee",
    label: "Application Fee",
    gross: "application_gross_fee",
    concession: "application_concession",
    paid: "paid_application_fee",
  },
  {
    key: "registration",
    flag: "has_registration_fee",
    label: "Registration Fee",
    gross: "registration_gross_fee",
    concession: "registration_concession",
    paid: "paid_registration_fee",
  },
];

const emptyFeeFields = {
  student_type: "New",
  old_fee: 0,
  has_admission_fee: true,
  adm_gross_fee: 0,
  adm_concession: 0,
  paid_adm_fee: 0,
  has_term_fee: true,
  gross_term_fee: 0,
  term_concession: 0,
  paid_term_fee: 0,
  has_transport_fee: false,
  transport_gross_fee: 0,
  transport_concession: 0,
  paid_transport_fee: 0,
  has_application_fee: false,
  application_gross_fee: 0,
  application_concession: 0,
  paid_application_fee: 0,
  has_registration_fee: false,
  registration_gross_fee: 0,
  registration_concession: 0,
  paid_registration_fee: 0,
  remarks: "",
  status: "Active",
};

const feeFieldsFromRecord = (r) => ({
  student_type: r.student_type,
  old_fee: r.old_fee || 0,
  has_admission_fee: r.has_admission_fee ?? true,
  adm_gross_fee: r.adm_gross_fee || 0,
  adm_concession: r.adm_concession || 0,
  paid_adm_fee: r.paid_adm_fee || 0,
  has_term_fee: r.has_term_fee ?? true,
  gross_term_fee: r.gross_term_fee || 0,
  term_concession: r.term_concession || 0,
  paid_term_fee: r.paid_term_fee || 0,
  has_transport_fee: r.has_transport_fee ?? false,
  transport_gross_fee: r.transport_gross_fee || 0,
  transport_concession: r.transport_concession || 0,
  paid_transport_fee: r.paid_transport_fee || 0,
  has_application_fee: r.has_application_fee ?? false,
  application_gross_fee: r.application_gross_fee || 0,
  application_concession: r.application_concession || 0,
  paid_application_fee: r.paid_application_fee || 0,
  has_registration_fee: r.has_registration_fee ?? false,
  registration_gross_fee: r.registration_gross_fee || 0,
  registration_concession: r.registration_concession || 0,
  paid_registration_fee: r.paid_registration_fee || 0,
  remarks: r.remarks || "",
  status: r.status || "Active",
});

// A number input that behaves the way people actually expect:
// - clicking/tabbing in selects the whole value, so typing "5" over a "0"
//   gives you "5", not "05" (the classic controlled-input-starting-at-zero
//   bug where the cursor lands before the digit instead of after it)
// - only digits can be typed at all (regex strips everything else as you go,
//   rather than validating after the fact)
// - blur normalizes the display (drops any leading zeros, empty -> "0")
function NumberInput({ value, onChange, disabled, className = "", ...props }) {
  const [text, setText] = useState(String(value ?? 0));

  useEffect(() => {
    setText(String(value ?? 0));
  }, [value]);

  return (
    <Input
      type="text"
      inputMode="numeric"
      disabled={disabled}
      className={className}
      value={text}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
        setText(digitsOnly);
        onChange(digitsOnly === "" ? 0 : Number(digitsOnly));
      }}
      onBlur={() => {
        const n = text === "" ? 0 : Number(text);
        setText(String(n));
      }}
      {...props}
    />
  );
}

// `record` = an existing StudentFeeReport, passed in when opened via the
// page's edit (pencil) action - student/class are already fixed and locked.
export default function StudentFeeReportForm({ record, onClose, onSaved }) {
  const isEditingDirectly = !!record;

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(
    record && typeof record.class === "object"
      ? record.class._id
      : record?.class || "",
  );

  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [reportId, setReportId] = useState(record?._id || null);
  const [fields, setFields] = useState(
    record ? feeFieldsFromRecord(record) : emptyFeeFields,
  );
  const [saving, setSaving] = useState(false);

  // A student is "locked in" once picked (or when editing an existing
  // record directly) - the class/student pickers disable at that point so
  // they can't be changed out from under the fee data you're entering.
  const studentLocked = isEditingDirectly || !!selectedStudent;
  const activeStudent = isEditingDirectly
    ? {
        name: record.student_name,
        father_name: record.father_name,
        mobile: record.mob_number,
      }
    : selectedStudent;

  useEffect(() => {
    classApi
      .list()
      .then((data) => setClasses(data.data))
      .catch((err) => toast.error(apiErrorMessage(err)));
  }, []);

  useEffect(() => {
    if (!selectedClass || studentLocked) return;
    setLoadingStudents(true);
    feeApi
      .listEligibleStudents({ class: selectedClass })
      .then(setStudents)
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setLoadingStudents(false));
  }, [selectedClass, studentLocked]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase();
    if (!q) return students;
    return students.filter((s) => (s.name || "").toLowerCase().includes(q));
  }, [students, studentSearch]);

  const pickStudent = (s) => {
    setSelectedStudent(s);
    if (s.has_report && s.existing_report) {
      // Already has a fee record - open it for editing rather than
      // creating a duplicate report for the same student.
      setReportId(s.existing_report._id);
      setFields(feeFieldsFromRecord(s.existing_report));
      toast.info(`${s.name} already has a fee record — editing it.`);
    } else {
      setReportId(null);
      setFields({ ...emptyFeeFields });
    }
  };

  const handleChangeStudent = () => {
    setSelectedStudent(null);
    setReportId(null);
    setFields({ ...emptyFeeFields });
    setStudentSearch("");
  };

  const setField = (k, v) => setFields((f) => ({ ...f, [k]: v }));

  // Zero out a bucket's numbers whenever its checkbox is off - defense in
  // depth alongside the same sanitization feeController.js does server-side.
  const sanitizedFields = () => {
    const out = { ...fields };
    for (const bucket of FEE_BUCKETS) {
      if (!out[bucket.flag]) {
        out[bucket.gross] = 0;
        out[bucket.concession] = 0;
        out[bucket.paid] = 0;
      }
    }
    return out;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentLocked) {
      toast.error("Select a class and student first.");
      return;
    }
    setSaving(true);
    try {
      const payload = sanitizedFields();
      if (reportId) {
        await feeApi.updateReport(reportId, payload);
        toast.success("Fee record updated.");
      } else {
        await feeApi.createReport({
          student_id: selectedStudent.student_id,
          student_name: selectedStudent.name,
          father_name: selectedStudent.father_name,
          mob_number: selectedStudent.mobile,
          class: selectedClass,
          ...payload,
        });
        toast.success("Fee record created.");
      }
      onSaved();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const feeFieldsDisabled = !studentLocked;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">
            {reportId ? "Edit Fee Record" : "Add Student Fee Record"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500">Class</label>
            <Select
              value={selectedClass}
              disabled={studentLocked}
              onValueChange={(v) => setSelectedClass(v)}
            >
              <SelectTrigger className="h-10 mt-1">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    Class {c.grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedClass && !studentLocked && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">
                Student
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search student by name..."
                  className="pl-9 h-9"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {loadingStudents ? (
                  <p className="text-center text-sm text-slate-400 py-6">
                    Loading students...
                  </p>
                ) : filteredStudents.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-6">
                    No students found in this class.
                  </p>
                ) : (
                  filteredStudents.map((s) => (
                    <button
                      type="button"
                      key={s.student_id}
                      onClick={() => pickStudent(s)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {s.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {s.father_name} · {s.mobile}
                        </p>
                      </div>
                      {s.has_report ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Recorded
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
                          <UserPlus className="w-3 h-3" /> New
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {studentLocked && activeStudent && (
            <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {activeStudent.name}
                </p>
                <p className="text-xs text-slate-500">
                  {activeStudent.father_name} · {activeStudent.mobile}
                </p>
              </div>
              {!isEditingDirectly && (
                <button
                  type="button"
                  onClick={handleChangeStudent}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:underline shrink-0"
                >
                  <Pencil className="w-3 h-3" /> Change
                </button>
              )}
            </div>
          )}

          <div
            className={`grid grid-cols-2 gap-3 ${feeFieldsDisabled ? "opacity-60" : ""}`}
          >
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-500">
                Student Type
              </label>
              <Select
                value={fields.student_type}
                disabled={feeFieldsDisabled}
                onValueChange={(v) => setField("student_type", v)}
              >
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Existing">Existing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-500">
                Old Fee (Previous Due)
              </label>
              <NumberInput
                className="h-9 mt-1"
                disabled={feeFieldsDisabled}
                value={fields.old_fee}
                onChange={(n) => setField("old_fee", n)}
              />
            </div>

            {FEE_BUCKETS.map((bucket) => (
              <div key={bucket.key} className="col-span-2 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <Checkbox
                    checked={fields[bucket.flag]}
                    disabled={feeFieldsDisabled}
                    onCheckedChange={(checked) =>
                      setField(bucket.flag, !!checked)
                    }
                  />
                  {bucket.label}
                </label>
                {fields[bucket.flag] && (
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    <div>
                      <label className="text-xs font-medium text-slate-500">
                        Gross Fee
                      </label>
                      <NumberInput
                        className="h-9 mt-1"
                        disabled={feeFieldsDisabled}
                        value={fields[bucket.gross]}
                        onChange={(n) => setField(bucket.gross, n)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500">
                        Concession
                      </label>
                      <NumberInput
                        className="h-9 mt-1"
                        disabled={feeFieldsDisabled}
                        value={fields[bucket.concession]}
                        onChange={(n) => setField(bucket.concession, n)}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-slate-500">
                        Paid
                      </label>
                      <NumberInput
                        className="h-9 mt-1"
                        disabled={feeFieldsDisabled}
                        value={fields[bucket.paid]}
                        onChange={(n) => setField(bucket.paid, n)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-500">
                Remarks
              </label>
              <Input
                maxLength={100}
                className="h-9 mt-1"
                disabled={feeFieldsDisabled}
                value={fields.remarks}
                onChange={(e) => setField("remarks", e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-500">
                Status
              </label>
              <Select
                value={fields.status}
                disabled={feeFieldsDisabled}
                onValueChange={(v) => setField("status", v)}
              >
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || feeFieldsDisabled}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving
                ? "Saving..."
                : reportId
                  ? "Update Record"
                  : "Save Record"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
