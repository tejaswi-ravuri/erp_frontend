import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Paperclip, Mic, MicOff, Send, X, CheckCircle } from "lucide-react";
import { entities } from "@/api/entityClient";
import { uploadApi } from "@/api/uploadApi";

export default function SupportDialog({ open, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [file, setFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = (e) => chunksRef.current.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      stream.getTracks().forEach((t) => t.stop());
    };
    mr.start();
    mediaRef.current = mr;
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    let fileUrl = "";
    let audioFileUrl = "";
    if (file) {
      const res = await integrations.Core.UploadFile({ file });
      fileUrl = res.file_url;
    }
    if (audioBlob) {
      const audioFile = new File([audioBlob], "voice-note.webm", {
        type: "audio/webm",
      });
      const res = await integrations.Core.UploadFile({
        file: audioFile,
      });
      audioFileUrl = res.file_url;
    }
    await integrations.Core.SendEmail({
      to: "support@dtg.com",
      subject: `Support Ticket from ${form.name}`,
      body: `Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}\n\n${fileUrl ? `Attachment: ${fileUrl}` : ""}\n${audioFileUrl ? `Voice Note: ${audioFileUrl}` : ""}`,
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleClose = () => {
    setForm({ name: "", email: "", message: "" });
    setFile(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">D</span>
            </span>
            DTG Support
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-slate-800">Ticket Submitted!</p>
            <p className="text-sm text-slate-500 mt-1">
              Our team will get back to you shortly.
            </p>
            <Button
              onClick={handleClose}
              className="mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
            >
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-3 mt-1">
            <div>
              <Label className="text-xs mb-1 block">Your Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Full name"
                className="rounded-xl text-sm"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="you@example.com"
                className="rounded-xl text-sm"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Describe Your Issue</Label>
              <Textarea
                value={form.message}
                onChange={(e) =>
                  setForm((p) => ({ ...p, message: e.target.value }))
                }
                placeholder="Explain your issue in detail..."
                className="rounded-xl text-sm"
                rows={4}
              />
            </div>

            {/* Attachments */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                <Paperclip className="w-3.5 h-3.5" />
                {file ? file.name.slice(0, 20) + "..." : "Attach Document"}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </label>
              {file && (
                <button onClick={() => setFile(null)}>
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>

            {/* Voice Recording */}
            <div className="flex items-center gap-3">
              <button
                onClick={recording ? stopRecording : startRecording}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-colors ${recording ? "border-red-300 bg-red-50 text-red-600 animate-pulse" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                {recording ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" /> Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" /> Record Voice Note
                  </>
                )}
              </button>
              {audioUrl && !recording && (
                <audio src={audioUrl} controls className="h-8 w-40" />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="rounded-xl text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !form.name || !form.message}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? "Sending..." : "Submit Ticket"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
