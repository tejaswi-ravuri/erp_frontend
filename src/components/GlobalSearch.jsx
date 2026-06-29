import React, { useState, useEffect } from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { entities } from "@/api/entityClient";
import {
  Users,
  Briefcase,
  BookOpen,
  PartyPopper,
  FileText,
  GraduationCap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function GlobalSearch({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({
    students: [],
    staff: [],
    exams: [],
    events: [],
    homework: [],
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({
        students: [],
        staff: [],
        exams: [],
        events: [],
        homework: [],
      });
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const q = query.toLowerCase();
      const [students, staff, exams, events, homework] = await Promise.all([
        entities.Student.list(),
        entities.Staff.list(),
        entities.Exam.list(),
        entities.Event.list(),
        entities.Homework.list(),
      ]);
      setResults({
        students: students
          .filter(
            (s) =>
              s.name?.toLowerCase().includes(q) ||
              s.class?.toLowerCase().includes(q),
          )
          .slice(0, 4),
        staff: staff
          .filter(
            (s) =>
              s.name?.toLowerCase().includes(q) ||
              s.designation?.toLowerCase().includes(q),
          )
          .slice(0, 4),
        exams: exams
          .filter(
            (e) =>
              e.name?.toLowerCase().includes(q) ||
              e.subject?.toLowerCase().includes(q),
          )
          .slice(0, 3),
        events: events
          .filter((e) => e.title?.toLowerCase().includes(q))
          .slice(0, 3),
        homework: homework
          .filter(
            (h) =>
              h.title?.toLowerCase().includes(q) ||
              h.subject?.toLowerCase().includes(q),
          )
          .slice(0, 3),
      });
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const go = (path) => {
    navigate(path);
    onClose();
    setQuery("");
  };

  const hasResults = Object.values(results).some((r) => r.length > 0);

  return (
    <CommandDialog open={open} onOpenChange={onClose}>
      <CommandInput
        placeholder="Search students, staff, exams, events..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading && (
          <p className="py-6 text-center text-sm text-slate-400">
            Searching...
          </p>
        )}
        {!loading && query.length >= 2 && !hasResults && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        {!loading && query.length < 2 && (
          <p className="py-6 text-center text-sm text-slate-400">
            Type at least 2 characters to search...
          </p>
        )}

        {results.students.length > 0 && (
          <CommandGroup heading="Students">
            {results.students.map((s) => (
              <CommandItem
                key={s.id}
                onSelect={() => go("/students")}
                className="cursor-pointer"
              >
                <Users className="w-4 h-4 mr-2 text-indigo-500" />
                <span>{s.name}</span>
                <span className="ml-auto text-xs text-slate-400">
                  {s.class} {s.section}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results.staff.length > 0 && (
          <CommandGroup heading="Staff">
            {results.staff.map((s) => (
              <CommandItem
                key={s.id}
                onSelect={() => go("/staff")}
                className="cursor-pointer"
              >
                <Briefcase className="w-4 h-4 mr-2 text-sky-500" />
                <span>{s.name}</span>
                <span className="ml-auto text-xs text-slate-400">
                  {s.designation}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results.exams.length > 0 && (
          <CommandGroup heading="Exams">
            {results.exams.map((e) => (
              <CommandItem
                key={e.id}
                onSelect={() => go("/exams")}
                className="cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 mr-2 text-purple-500" />
                <span>{e.name}</span>
                <span className="ml-auto text-xs text-slate-400">
                  {e.subject}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results.events.length > 0 && (
          <CommandGroup heading="Events">
            {results.events.map((e) => (
              <CommandItem
                key={e.id}
                onSelect={() => go("/events")}
                className="cursor-pointer"
              >
                <PartyPopper className="w-4 h-4 mr-2 text-amber-500" />
                <span>{e.title}</span>
                <span className="ml-auto text-xs text-slate-400">{e.date}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results.homework.length > 0 && (
          <CommandGroup heading="Homework">
            {results.homework.map((h) => (
              <CommandItem
                key={h.id}
                onSelect={() => go("/homework")}
                className="cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2 text-orange-500" />
                <span>{h.title}</span>
                <span className="ml-auto text-xs text-slate-400">
                  {h.subject}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
