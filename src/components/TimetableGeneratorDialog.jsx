import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { entities } from "@/api/entityClient";

export default function TimetableGeneratorDialog({
  open,
  onClose,
  onGenerated,
}) {
  const [form, setForm] = useState({
    teacher_name: "",
    classes_per_week: "",
    class_teacher_of: "",
    subjects: "",
  });
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    const result = await integrations.Core.InvokeLLM({
      prompt: `Generate a weekly school timetable for the following teacher:
Teacher Name: ${form.teacher_name}
Number of classes per week: ${form.classes_per_week}
Class teacher of: ${form.class_teacher_of}
Subjects taught: ${form.subjects}

Create a realistic weekly timetable (Monday to Saturday) with time slots from 8:00 AM to 2:15 PM.
Distribute the teacher's classes evenly across the week.
Return as a grid where each cell has the subject or "Free".`,
      response_json_schema: {
        type: "object",
        properties: {
          teacher: { type: "string" },
          schedule: {
            type: "array",
            items: {
              type: "object",
              properties: {
                period: { type: "string" },
                Monday: { type: "string" },
                Tuesday: { type: "string" },
                Wednesday: { type: "string" },
                Thursday: { type: "string" },
                Friday: { type: "string" },
                Saturday: { type: "string" },
              },
            },
          },
        },
      },
    });
    setGenerating(false);
    onGenerated(result, form.teacher_name);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Generate Timetable
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-1">
          <div>
            <Label className="text-xs mb-1 block">Teacher Name</Label>
            <Input
              value={form.teacher_name}
              onChange={(e) =>
                setForm((p) => ({ ...p, teacher_name: e.target.value }))
              }
              placeholder="e.g. Mr. Sharma"
              className="rounded-xl text-sm"
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">
              No. of Classes per Week
            </Label>
            <Input
              type="number"
              value={form.classes_per_week}
              onChange={(e) =>
                setForm((p) => ({ ...p, classes_per_week: e.target.value }))
              }
              placeholder="e.g. 24"
              className="rounded-xl text-sm"
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">
              Class Teacher of (Class & Section)
            </Label>
            <Input
              value={form.class_teacher_of}
              onChange={(e) =>
                setForm((p) => ({ ...p, class_teacher_of: e.target.value }))
              }
              placeholder="e.g. Class 9 - Section A"
              className="rounded-xl text-sm"
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">
              Subjects Taught (comma separated)
            </Label>
            <Input
              value={form.subjects}
              onChange={(e) =>
                setForm((p) => ({ ...p, subjects: e.target.value }))
              }
              placeholder="e.g. Mathematics, Physics"
              className="rounded-xl text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating || !form.teacher_name || !form.subjects}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm gap-1.5"
            >
              {generating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
