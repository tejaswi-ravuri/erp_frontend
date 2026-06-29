import React, { useEffect, useState } from "react";
import { entities } from "@/api/entityClient";
import { ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";

export default function StudentProfile({ student, onBack }) {
  const [attendance, setAttendance] = useState([]);
  const [fees, setFees] = useState([]);
  const [marks, setMarks] = useState([]);

  useEffect(() => {
    Promise.all([
      entities.Attendance.filter({ student_id: student.id }),
      entities.FeePayment.filter({ student_id: student.id }),
      entities.Marks.filter({ student_id: student.id }),
    ]).then(([att, feeData, marksData]) => {
      setAttendance(att);
      setFees(feeData);
      setMarks(marksData);
    });
  }, [student.id]);

  const present = attendance.filter((a) => a.status === "Present").length;
  const attPct =
    attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0;
  const totalFee = fees.reduce((s, f) => s + (f.amount || 0), 0);
  const paidFee = fees
    .filter((f) => f.status === "Paid")
    .reduce((s, f) => s + (f.amount || 0), 0);
  const totalMarks = marks.reduce((s, m) => s + (m.marks_obtained || 0), 0);
  const maxMarks = marks.reduce((s, m) => s + (m.max_marks || 0), 0);
  const pct = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;

  const fields = [
    ["Admission No", student.admission_no],
    ["Class", `Class ${student.class}`],
    ["Section", student.section],
    ["Roll No", student.roll_no],
    ["Gender", student.gender],
    ["Blood Group", student.blood_group],
    ["Date of Birth", student.dob],
    ["City", student.city],
    ["Parent Name", student.parent_name],
    ["Parent Phone", student.parent_phone],
    ["Parent Email", student.parent_email],
    ["Joining Date", student.joining_date],
    ["Address", student.address],
  ];

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </button>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            {student.photo_url ? (
              <img
                src={student.photo_url}
                alt=""
                className="w-16 h-16 rounded-xl object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-emerald-600" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-800">
                {student.full_name}
              </h2>
              <StatusBadge value={student.status} />
            </div>
            <p className="text-sm text-slate-500">
              {student.admission_no} · Class {student.class} {student.section}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-100">
          {fields.map(
            ([label, val]) =>
              val && (
                <div key={label}>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-sm font-medium text-slate-700">{val}</p>
                </div>
              ),
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{attPct}%</p>
          <p className="text-xs text-slate-500 mt-1">Attendance</p>
          <p className="text-xs text-slate-400">
            {present}/{attendance.length} days
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{pct}%</p>
          <p className="text-xs text-slate-500 mt-1">Academic Score</p>
          <p className="text-xs text-slate-400">
            {totalMarks}/{maxMarks} marks
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">
            ₹{paidFee.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-slate-500 mt-1">Fee Paid</p>
          <p className="text-xs text-slate-400">
            of ₹{totalFee.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {marks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Marks Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2 text-xs text-slate-500">
                    Subject
                  </th>
                  <th className="text-left px-3 py-2 text-xs text-slate-500">
                    Exam
                  </th>
                  <th className="text-left px-3 py-2 text-xs text-slate-500">
                    Marks
                  </th>
                  <th className="text-left px-3 py-2 text-xs text-slate-500">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {marks.map((m) => (
                  <tr key={m.id}>
                    <td className="px-3 py-2 text-slate-700">{m.subject}</td>
                    <td className="px-3 py-2 text-slate-500">{m.exam_type}</td>
                    <td className="px-3 py-2 font-medium">
                      {m.marks_obtained}/{m.max_marks}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge value={m.grade} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
