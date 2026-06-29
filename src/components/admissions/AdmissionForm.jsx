import React, { useState, useEffect, useRef } from "react";
import { entities } from "@/api/entityClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Upload, Printer, CheckCircle } from "lucide-react";
import { uploadApi } from "@/api/uploadApi";

const CLASSES = [
  "LKG",
  "UKG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const EMPTY_FORM = {
  academic_year: "",
  unique_id: "",
  application_no: "",
  admission_no: "",
  state: "Telangana",
  branch: "",
  form_status: "Enquiry",
  class_sought: "",
  student_name: "",
  gender: "",
  dob: "",
  height_cm: "",
  weight_kg: "",
  nationality: "Indian",
  religion: "",
  mother_tongue: "",
  caste: "",
  id_mark_1: "",
  id_mark_2: "",
  blood_group: "",
  health_status: "",
  passport_photo: "",
  father_name: "",
  father_qualification: "",
  father_occupation: "",
  father_mobile: "",
  father_email: "",
  mother_name: "",
  mother_qualification: "",
  mother_occupation: "",
  mother_mobile: "",
  mother_email: "",
  family_income_pa: "",
  communication_address: "",
  permanent_address: "",
  same_as_communication: false,
  prev_school_1_standard: "",
  prev_school_1_year: "",
  prev_school_1_name: "",
  prev_school_2_standard: "",
  prev_school_2_year: "",
  prev_school_2_name: "",
  prev_school_3_standard: "",
  prev_school_3_year: "",
  prev_school_3_name: "",
  doc_dob_cert: false,
  doc_passport_photos: false,
  doc_transfer_cert: false,
  doc_id_proof: false,
  doc_progress_record: false,
  doc_caste_cert: false,
  aadhaar_no: "",
  submit_aadhaar: false,
  submit_ration_card: false,
  submit_passport: false,
  submit_other: false,
  source_direct: false,
  source_tele_call: false,
  source_outdoor_ads: false,
  staff_pro_name: "",
  fee_payable_amount: "",
  term1_due_date: "",
  term2_due_date: "",
  term3_due_date: "",
  declaration_accepted: false,
  declaration_date: "",
  student_signature: "",
  parent_signature: "",
  principal_signature: "",
};

function SectionBanner({ num, title, color = "blue" }) {
  const colors = {
    blue: "bg-blue-600 text-white",
    green: "bg-green-600 text-white",
    amber: "bg-amber-600 text-white",
  };
  return (
    <div
      className={`${colors[color]} px-4 py-2 rounded-lg mb-4 flex items-center gap-2`}
    >
      <span className="font-bold text-base">{num}.</span>
      <span className="font-semibold text-sm tracking-wide uppercase">
        {title}
      </span>
    </div>
  );
}

function Field({ label, required, children, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// Letter-box style name input
function LetterBoxInput({ value, onChange, maxLength = 30 }) {
  const boxes = Array.from({ length: maxLength });
  const chars = (value || "").toUpperCase().split("");
  const inputRef = useRef(null);
  return (
    <div
      className="flex flex-wrap gap-1 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {boxes.map((_, i) => (
        <div
          key={i}
          className={`w-7 h-8 border-b-2 flex items-end justify-center pb-0.5 text-sm font-mono font-bold text-slate-800 ${chars[i] ? "border-indigo-500" : "border-slate-300"}`}
        >
          {chars[i] || ""}
        </div>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        maxLength={maxLength}
        className="sr-only"
      />
    </div>
  );
}

// Aadhaar 4-4-4 grouped input
function AadhaarInput({ value, onChange }) {
  const digits = (value || "").replace(/\D/g, "").slice(0, 12);
  const g1 = digits.slice(0, 4);
  const g2 = digits.slice(4, 8);
  const g3 = digits.slice(8, 12);
  const inputRef = useRef(null);
  return (
    <div
      className="flex items-center gap-2"
      onClick={() => inputRef.current?.focus()}
    >
      {[g1, g2, g3].map((g, i) => (
        <React.Fragment key={i}>
          <div className="flex gap-0.5">
            {Array.from({ length: 4 }).map((_, j) => (
              <div
                key={j}
                className={`w-7 h-8 border rounded flex items-center justify-center text-sm font-mono font-semibold ${g[j] ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-300 bg-slate-50 text-slate-800"}`}
              >
                {g[j] || ""}
              </div>
            ))}
          </div>
          {i < 2 && <span className="text-slate-400 font-bold">—</span>}
        </React.Fragment>
      ))}
      <Input
        ref={inputRef}
        type="text"
        value={digits}
        onChange={(e) =>
          onChange(e.target.value.replace(/\D/g, "").slice(0, 12))
        }
        className="h-8 text-sm w-36 ml-2"
        placeholder="Type 12 digits"
      />
    </div>
  );
}

export default function AdmissionForm({
  admission,
  readOnly = false,
  onClose,
  onSaved,
  onAdmit,
}) {
  const [form, setForm] = useState(
    admission ? { ...EMPTY_FORM, ...admission } : { ...EMPTY_FORM },
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({});
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (form.same_as_communication) {
      setForm((prev) => ({
        ...prev,
        permanent_address: prev.communication_address,
      }));
    }
  }, [form.same_as_communication, form.communication_address]);

  const feeAmt = parseFloat(form.fee_payable_amount) || 0;
  const term1 = Math.round(feeAmt * 0.4);
  const term2 = Math.round(feeAmt * 0.4);
  const term3 = Math.round(feeAmt * 0.2);

  const uploadFile = async (field, file) => {
    if (!file) return;
    setUploading((p) => ({ ...p, [field]: true }));
    const { file_url } = await integrations.Core.UploadFile({ file });
    set(field, file_url);
    setUploading((p) => ({ ...p, [field]: false }));
  };

  const validate = (isSubmit) => {
    const e = {};
    if (!form.student_name) e.student_name = "Required";
    if (!form.gender) e.gender = "Required";
    if (!form.dob) e.dob = "Required";
    if (!form.class_sought) e.class_sought = "Required";
    if (!form.father_mobile || form.father_mobile.length !== 10)
      e.father_mobile = "Must be 10 digits";
    if (!form.mother_mobile || form.mother_mobile.length !== 10)
      e.mother_mobile = "Must be 10 digits";
    if (form.aadhaar_no && form.aadhaar_no.length !== 12)
      e.aadhaar_no = "Must be 12 digits";
    if (isSubmit) {
      if (!form.declaration_accepted) e.declaration_accepted = "Required";
      if (!form.passport_photo) e.passport_photo = "Required";
      if (!form.aadhaar_no || form.aadhaar_no.length !== 12)
        e.aadhaar_no = "Must be 12 digits";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveDraft = async () => {
    if (!validate(false)) return;
    setSaving(true);
    const payload = {
      ...form,
      form_status: "Applied",
      family_income_pa: parseFloat(form.family_income_pa) || 0,
      height_cm: parseFloat(form.height_cm) || 0,
      weight_kg: parseFloat(form.weight_kg) || 0,
      fee_payable_amount: parseFloat(form.fee_payable_amount) || 0,
    };
    if (!payload.application_no) {
      const list = await entities.Admission.list();
      payload.application_no = `APP-${String(list.length + 1).padStart(3, "0")}`;
    }
    if (admission?.id) await entities.Admission.update(admission.id, payload);
    else await entities.Admission.create(payload);
    setSaving(false);
    onSaved();
  };

  const handleSubmit = async () => {
    if (!validate(true)) return;
    setSaving(true);
    const payload = {
      ...form,
      form_status: "Under Review",
      family_income_pa: parseFloat(form.family_income_pa) || 0,
      height_cm: parseFloat(form.height_cm) || 0,
      weight_kg: parseFloat(form.weight_kg) || 0,
      fee_payable_amount: parseFloat(form.fee_payable_amount) || 0,
    };
    if (!payload.application_no) {
      const list = await entities.Admission.list();
      payload.application_no = `APP-${String(list.length + 1).padStart(3, "0")}`;
    }

    // Save admission
    let savedAdmission;
    if (admission?.id) {
      savedAdmission = await entities.Admission.update(admission.id, payload);
    } else {
      savedAdmission = await entities.Admission.create(payload);
    }

    // Create StudentFeeReport entry for fee tracking
    const feeAmt = parseFloat(form.fee_payable_amount) || 0;
    const term1 = Math.round(feeAmt * 0.4);
    const term2 = Math.round(feeAmt * 0.4);
    const term3 = Math.round(feeAmt * 0.2);

    await entities.StudentFeeReport.create({
      student_id: savedAdmission.id,
      student_name: form.student_name,
      father_name: form.father_name,
      mob_number: form.father_mobile,
      class: form.class_sought,
      student_type: "New",
      adm_gross_fee: feeAmt,
      adm_concession: 0,
      net_adm_fee: feeAmt,
      paid_adm_fee: 0,
      balance_adm_fee: feeAmt,
      gross_term_fee: term1 + term2 + term3,
      term_concession: 0,
      net_term_fee: term1 + term2 + term3,
      paid_term_fee: 0,
      balance_term_fee: term1 + term2 + term3,
      status: "Active",
      remarks: `New admission - ${form.academic_year}`,
    });

    setSaving(false);
    onSaved();
  };

  const handleAdmit = async () => {
    if (!admission?.id) return;
    setSaving(true);
    const list = await entities.Admission.list();
    const admNo = `ADM-${String(list.filter((a) => a.form_status === "Admitted").length + 1).padStart(3, "0")}`;
    await entities.Admission.update(admission.id, {
      ...form,
      form_status: "Admitted",
      admission_no: admNo,
    });

    // Create student record
    const student = await entities.Student.create({
      full_name: form.student_name,
      admission_no: admNo,
      class: form.class_sought.replace("Class ", ""),
      section: "",
      gender: form.gender,
      dob: form.dob,
      blood_group: form.blood_group || "",
      parent_name: form.father_name,
      parent_phone: form.father_mobile,
      parent_email: form.father_email || "",
      address: form.communication_address,
      joining_date: new Date().toISOString().split("T")[0],
      status: "Active",
    });

    setSaving(false);
    onSaved();
    if (onAdmit) onAdmit(student);
  };

  const handlePrint = () => window.print();

  const inp = (k, placeholder = "", type = "text") => (
    <div>
      <Input
        type={type}
        value={form[k] || ""}
        onChange={(e) => set(k, e.target.value)}
        placeholder={placeholder}
        className={`h-8 text-sm ${errors[k] ? "border-red-400" : ""}`}
        disabled={readOnly}
      />
      {errors[k] && <p className="text-xs text-red-500 mt-0.5">{errors[k]}</p>}
    </div>
  );

  const textArea = (k, placeholder = "") => (
    <textarea
      value={form[k] || ""}
      onChange={(e) => set(k, e.target.value)}
      placeholder={placeholder}
      rows={3}
      disabled={readOnly}
      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
    />
  );

  const sel = (k, options, placeholder) => (
    <Select
      value={form[k] || ""}
      onValueChange={(v) => set(k, v)}
      disabled={readOnly}
    >
      <SelectTrigger className="h-8 text-sm">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const chk = (k, label) => (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={!!form[k]}
        onChange={(e) => set(k, e.target.checked)}
        disabled={readOnly}
        className="rounded border-slate-300 h-4 w-4 accent-indigo-600"
      />
      <span className="text-slate-700">{label}</span>
    </label>
  );

  const fileUpload = (k, label) => (
    <div className="border-2 border-dashed border-slate-300 rounded-lg p-3 text-center min-h-[80px] flex flex-col items-center justify-center gap-1">
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      {form[k] ? (
        <div className="flex items-center gap-2">
          <a
            href={form[k]}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-600 underline"
          >
            View
          </a>
          {!readOnly && (
            <button
              type="button"
              onClick={() => set(k, "")}
              className="text-red-400"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : !readOnly ? (
        <label className="cursor-pointer">
          <span className="inline-flex items-center gap-1 text-xs text-indigo-600 border border-indigo-300 rounded px-2 py-1 hover:bg-indigo-50">
            {uploading[k] ? (
              "Uploading..."
            ) : (
              <>
                <Upload className="w-3 h-3" /> Upload
              </>
            )}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => uploadFile(k, e.target.files[0])}
          />
        </label>
      ) : (
        <span className="text-xs text-slate-400">Not uploaded</span>
      )}
      {errors[k] && <p className="text-xs text-red-500">{errors[k]}</p>}
    </div>
  );

  const isUnderReview =
    admission?.form_status === "Under Review" ||
    form.form_status === "Under Review";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 py-6 px-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              The Masterminds School
            </p>
            <h2 className="text-base font-bold text-slate-800">
              Provisional Application for Admission
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 no-print"
              title="Print"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* TOP HEADER FIELDS */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <Field label="Academic Year" required>
              {inp("academic_year", "2024-25")}
            </Field>
            <Field label="Unique ID">{inp("unique_id")}</Field>
            <Field label="Application No." required>
              {inp("application_no", "APP-001")}
            </Field>
            <Field label="Admission No.">
              {inp("admission_no", "ADM-001")}
            </Field>
            <Field label="State">
              {sel(
                "state",
                ["Telangana", "Andhra Pradesh", "Maharashtra", "Karnataka"],
                "Select State",
              )}
            </Field>
            <Field label="Branch">
              {sel(
                "branch",
                ["Hyderabad", "Secunderabad", "Kukatpally", "Miyapur"],
                "Select Branch",
              )}
            </Field>
          </div>

          {/* SECTION 1 — STUDENT DETAILS */}
          <div>
            <SectionBanner num="1" title="Student Details" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
              {/* Left block */}
              <div className="md:col-span-2 space-y-4">
                <Field label="Class Sought" required>
                  {sel("class_sought", CLASSES, "Select Class")}
                </Field>
                <Field label="Student Name (In Block Letters)" required>
                  <LetterBoxInput
                    value={form.student_name}
                    onChange={(v) => set("student_name", v)}
                    maxLength={28}
                  />
                  {errors.student_name && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.student_name}
                    </p>
                  )}
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Gender" required>
                    <div className="flex gap-4 mt-1">
                      {["Male", "Female"].map((g) => (
                        <label
                          key={g}
                          className="flex items-center gap-1.5 cursor-pointer text-sm font-medium"
                        >
                          <input
                            type="radio"
                            name="gender"
                            value={g}
                            checked={form.gender === g}
                            onChange={() => set("gender", g)}
                            disabled={readOnly}
                            className="accent-indigo-600"
                          />
                          {g}
                        </label>
                      ))}
                    </div>
                    {errors.gender && (
                      <p className="text-xs text-red-500 mt-0.5">
                        {errors.gender}
                      </p>
                    )}
                  </Field>
                  <Field label="Date of Birth" required>
                    <Input
                      type="date"
                      value={form.dob || ""}
                      onChange={(e) => set("dob", e.target.value)}
                      className={`h-8 text-sm ${errors.dob ? "border-red-400" : ""}`}
                      disabled={readOnly}
                    />
                    {errors.dob && (
                      <p className="text-xs text-red-500 mt-0.5">
                        {errors.dob}
                      </p>
                    )}
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Blood Group">
                    {sel("blood_group", BLOOD_GROUPS, "Select")}
                  </Field>
                  <Field label="Height (cm)">
                    <Input
                      type="number"
                      value={form.height_cm || ""}
                      onChange={(e) =>
                        set(
                          "height_cm",
                          e.target.value === ""
                            ? ""
                            : parseFloat(e.target.value) || 0,
                        )
                      }
                      className="h-8 text-sm"
                      disabled={readOnly}
                    />
                  </Field>
                  <Field label="Weight (kg)">
                    <Input
                      type="number"
                      value={form.weight_kg || ""}
                      onChange={(e) =>
                        set(
                          "weight_kg",
                          e.target.value === ""
                            ? ""
                            : parseFloat(e.target.value) || 0,
                        )
                      }
                      className="h-8 text-sm"
                      disabled={readOnly}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Nationality">{inp("nationality")}</Field>
                  <Field label="Religion">{inp("religion")}</Field>
                  <Field label="Mother Tongue">{inp("mother_tongue")}</Field>
                </div>
                <Field label="Caste" required>
                  <div className="flex gap-4 mt-1">
                    {["SC", "ST", "BC", "OC"].map((c) => (
                      <label
                        key={c}
                        className="flex items-center gap-1.5 cursor-pointer text-sm font-medium"
                      >
                        <input
                          type="radio"
                          name="caste"
                          value={c}
                          checked={form.caste === c}
                          onChange={() => set("caste", c)}
                          disabled={readOnly}
                          className="accent-indigo-600"
                        />
                        {c}
                      </label>
                    ))}
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="ID Mark 1">{inp("id_mark_1")}</Field>
                  <Field label="ID Mark 2">{inp("id_mark_2")}</Field>
                </div>
                <Field label="Medical / Health Information (any info school should know)">
                  {textArea(
                    "health_status",
                    "Allergies, conditions, special needs...",
                  )}
                </Field>
              </div>
              {/* Right — passport photo */}
              <div className="flex flex-col gap-3">
                <div
                  className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden"
                  style={{ minHeight: 160 }}
                >
                  {form.passport_photo ? (
                    <div className="relative">
                      <img
                        src={form.passport_photo}
                        alt="Passport"
                        className="w-full h-40 object-cover"
                      />
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => set("passport_photo", "")}
                          className="absolute top-1 right-1 bg-white rounded-full p-0.5 text-red-500 shadow"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-40 cursor-pointer hover:bg-slate-50">
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs text-slate-500 text-center px-2">
                        Passport Size Photo
                        <span className="text-red-500">*</span>
                      </span>
                      <span className="text-xs text-slate-400 mt-1">
                        {uploading.passport_photo
                          ? "Uploading..."
                          : "Click to upload"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          uploadFile("passport_photo", e.target.files[0])
                        }
                      />
                    </label>
                  )}
                </div>
                {errors.passport_photo && (
                  <p className="text-xs text-red-500">
                    {errors.passport_photo}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2 — PARENT DETAILS */}
          <div>
            <SectionBanner num="2" title="Parent / Guardian Details" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Father */}
              <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide border-b border-blue-200 pb-1 mb-2">
                  Father's Details
                </p>
                <Field label="Father's Name" required>
                  {inp("father_name")}
                </Field>
                <Field label="Qualification">
                  {inp("father_qualification")}
                </Field>
                <Field label="Occupation">{inp("father_occupation")}</Field>
                <Field label="Mobile (Mandatory)" required>
                  <Input
                    value={form.father_mobile || ""}
                    onChange={(e) =>
                      set(
                        "father_mobile",
                        e.target.value.replace(/\D/g, "").slice(0, 10),
                      )
                    }
                    placeholder="10-digit mobile"
                    className={`h-8 text-sm ${errors.father_mobile ? "border-red-400" : ""}`}
                    disabled={readOnly}
                  />
                  {errors.father_mobile && (
                    <p className="text-xs text-red-500 mt-0.5">
                      {errors.father_mobile}
                    </p>
                  )}
                </Field>
                <Field label="Email">{inp("father_email")}</Field>
              </div>
              {/* Mother */}
              <div className="bg-pink-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-pink-700 uppercase tracking-wide border-b border-pink-200 pb-1 mb-2">
                  Mother's Details
                </p>
                <Field label="Mother's Name" required>
                  {inp("mother_name")}
                </Field>
                <Field label="Qualification">
                  {inp("mother_qualification")}
                </Field>
                <Field label="Occupation">{inp("mother_occupation")}</Field>
                <Field label="Mobile (Mandatory)" required>
                  <Input
                    value={form.mother_mobile || ""}
                    onChange={(e) =>
                      set(
                        "mother_mobile",
                        e.target.value.replace(/\D/g, "").slice(0, 10),
                      )
                    }
                    placeholder="10-digit mobile"
                    className={`h-8 text-sm ${errors.mother_mobile ? "border-red-400" : ""}`}
                    disabled={readOnly}
                  />
                  {errors.mother_mobile && (
                    <p className="text-xs text-red-500 mt-0.5">
                      {errors.mother_mobile}
                    </p>
                  )}
                </Field>
                <Field label="Email">{inp("mother_email")}</Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Family Income Per Annum ₹">
                  <Input
                    type="number"
                    value={form.family_income_pa || ""}
                    onChange={(e) =>
                      set(
                        "family_income_pa",
                        e.target.value === ""
                          ? ""
                          : parseFloat(e.target.value) || 0,
                      )
                    }
                    className="h-8 text-sm w-60"
                    disabled={readOnly}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* SECTION 3 — ADDRESS */}
          <div>
            <SectionBanner num="3" title="Address / Contact Details" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Communication Address" required>
                {textArea("communication_address")}
              </Field>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-600">
                    Permanent Address <span className="text-red-500">*</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer text-indigo-600 font-medium">
                    <input
                      type="checkbox"
                      checked={!!form.same_as_communication}
                      onChange={(e) =>
                        set("same_as_communication", e.target.checked)
                      }
                      className="h-3.5 w-3.5 accent-indigo-600"
                      disabled={readOnly}
                    />
                    Same as above
                  </label>
                </div>
                {textArea("permanent_address")}
              </div>
            </div>
          </div>

          {/* SECTION 4 — PREVIOUS SCHOOL */}
          <div>
            <SectionBanner
              num="4"
              title="Details of the School Last Studied In"
            />
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 w-12">
                      #
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">
                      Standard
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">
                      Academic Year
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">
                      School Name & Address
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-slate-400 font-medium">
                        {i}
                      </td>
                      <td className="px-4 py-2">
                        {inp(`prev_school_${i}_standard`, "e.g. Class 7")}
                      </td>
                      <td className="px-4 py-2">
                        {inp(`prev_school_${i}_year`, "e.g. 2022-23")}
                      </td>
                      <td className="px-4 py-2">
                        {inp(
                          `prev_school_${i}_name`,
                          "School name and address",
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 5 — DOCUMENTS */}
          <div>
            <SectionBanner num="5" title="Documents Collected" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Documents Required
                </p>
                {chk("doc_dob_cert", "Date of Birth Certificate")}
                {chk("doc_passport_photos", "Passport Size Photos")}
                {chk("doc_transfer_cert", "Transfer Certificate")}
                {chk("doc_id_proof", "ID Proof")}
                {chk("doc_progress_record", "Progress Record / Report Card")}
                {chk("doc_caste_cert", "Caste Certificate")}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Submitted Docs
                </p>
                {chk("submit_aadhaar", "Aadhaar Card")}
                {chk("submit_ration_card", "Ration Card")}
                {chk("submit_passport", "Passport")}
                {chk("submit_other", "Other")}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                    Source of Enquiry
                  </p>
                  {chk("source_direct", "Direct")}
                  {chk("source_tele_call", "Tele Call")}
                  {chk("source_outdoor_ads", "Outdoor Advertisements")}
                </div>
              </div>
              <div>
                <Field label="Aadhaar No. — Mandatory" required>
                  <AadhaarInput
                    value={form.aadhaar_no}
                    onChange={(v) => set("aadhaar_no", v)}
                  />
                  {errors.aadhaar_no && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.aadhaar_no}
                    </p>
                  )}
                </Field>
              </div>
            </div>
          </div>

          {/* SECTION 6 — STAFF & FEE */}
          <div>
            <SectionBanner num="6" title="Staff & Fee Info" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <Field label="Staff / PRO Name">{inp("staff_pro_name")}</Field>
              <div className="md:col-span-2">
                <Field label="Fee Payable ₹ for Academic Year" required>
                  <Input
                    type="number"
                    value={form.fee_payable_amount || ""}
                    onChange={(e) => set("fee_payable_amount", e.target.value)}
                    className="h-8 text-sm w-48"
                    disabled={readOnly}
                  />
                </Field>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "Term 1",
                  pct: "40%",
                  amount: term1,
                  due: "On or before 30th June",
                  key: "term1_due_date",
                  color: "bg-blue-50 border-blue-200",
                },
                {
                  label: "Term 2",
                  pct: "40%",
                  amount: term2,
                  due: "On or before 31st Oct",
                  key: "term2_due_date",
                  color: "bg-indigo-50 border-indigo-200",
                },
                {
                  label: "Term 3",
                  pct: "20%",
                  amount: term3,
                  due: "On or before 31st Dec",
                  key: "term3_due_date",
                  color: "bg-violet-50 border-violet-200",
                },
              ].map((t) => (
                <div
                  key={t.label}
                  className={`${t.color} border rounded-xl p-4 text-center`}
                >
                  <p className="text-xs font-semibold text-slate-500 uppercase">
                    {t.label} ({t.pct})
                  </p>
                  <p className="text-2xl font-bold text-indigo-700 my-1">
                    ₹{t.amount.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-slate-400 mb-2">{t.due}</p>
                  <Input
                    type="date"
                    value={form[t.key] || ""}
                    onChange={(e) => set(t.key, e.target.value)}
                    className="h-7 text-xs"
                    disabled={readOnly}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 7 — DECLARATION */}
          <div>
            <SectionBanner num="7" title="Declaration" color="amber" />
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-4">
              <p className="text-sm text-amber-900 leading-relaxed mb-3">
                I/We hereby declare that all information provided in this
                application form is true, correct and complete to the best of
                my/our knowledge and belief. I/We understand that in case of any
                false or misleading information, the school reserves the right
                to cancel the admission of the student at any stage without any
                notice and without assigning any reason whatsoever.
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.declaration_accepted}
                  onChange={(e) =>
                    set("declaration_accepted", e.target.checked)
                  }
                  disabled={readOnly}
                  className="mt-0.5 h-4 w-4 accent-indigo-600"
                />
                <span className="text-sm font-semibold text-amber-800">
                  I accept the above declaration{" "}
                  <span className="text-red-500">*</span>
                </span>
              </label>
              {errors.declaration_accepted && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.declaration_accepted}
                </p>
              )}
            </div>
            <div className="mb-4">
              <Field label="Application Date" required>
                <Input
                  type="date"
                  value={form.declaration_date || ""}
                  onChange={(e) => set("declaration_date", e.target.value)}
                  className="h-8 text-sm w-full max-w-xs"
                  disabled={readOnly}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {fileUpload("student_signature", "Student Signature")}
              {fileUpload("parent_signature", "Parent Signature *")}
              {fileUpload("principal_signature", "Principal's Signature")}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 rounded-b-2xl px-6 py-3 flex items-center justify-between gap-3 no-print">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save as Draft"}
              </Button>
              {isUnderReview && (
                <Button
                  onClick={handleAdmit}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 gap-1"
                >
                  <CheckCircle className="w-4 h-4" /> Admit Student
                </Button>
              )}
              {!isUnderReview && (
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {saving ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
