"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Student,
  MagnifyingGlass,
  EnvelopeSimple,
  GraduationCap,
  IdentificationCard,
  Phone,
  X,
} from "@phosphor-icons/react";
import { PageSection } from "./page-section";
import { getAllUsers } from "../../services/users-service";

type StudentRecord = {
  dbId: string;
  name: string;
  email: string;
  status: string;
  studentId: string;
  admissionNo: string;
  className: string;
  section: string;
  contact: string;
  fatherName: string;
  motherName: string;
};

export function AlumniPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"passed-out" | "inactivated">("passed-out");
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadStudents() {
      try {
        setIsLoading(true);
        const users = (await getAllUsers()) as any[];

        if (!isMounted) return;

        const mappedStudents = users
          .filter((user) => user.role === "parent" && user.studentProfile)
          .map((user) => {
            const profile = user.studentProfile ?? {};

            return {
              dbId: user.id,
              name: user.name,
              email: user.email,
              status: user.status,
              studentId: profile.studentId ?? user.id.slice(0, 8),
              admissionNo: profile.admissionNo ?? "",
              className: profile.class ?? "",
              section: profile.section ?? "",
              contact: profile.phone ?? profile.fatherContact ?? profile.motherContact ?? "",
              fatherName: profile.fatherName ?? "",
              motherName: profile.motherName ?? "",
            };
          });

        setStudents(mappedStudents);
        setError("");
      } catch (err) {
        console.error("Failed to fetch alumni records", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load student records.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadStudents();

    return () => {
      isMounted = false;
    };
  }, []);

  const inactiveStudents = useMemo(
    () => students.filter((student) => student.status === "inactive"),
    [students],
  );

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return inactiveStudents;

    return inactiveStudents.filter((student) =>
      [
        student.name,
        student.studentId,
        student.admissionNo,
        student.className,
        student.section,
        student.email,
        student.contact,
        student.fatherName,
        student.motherName,
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [inactiveStudents, search]);

  const emptyMessage = view === "passed-out" ? "No alumni records found" : "No inactive students found";

  return (
    <PageSection
      eyebrow="Student Records"
      title="Alumni & Inactive Students"
      description="Track graduated students and those who have left the institution."
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => {
                setView("passed-out");
                setSearch("");
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                view === "passed-out"
                  ? "bg-slate-900 text-white shadow-lg"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <GraduationCap size={20} weight="duotone" />
              Passed Out Students
            </button>
            <button
              onClick={() => {
                setView("inactivated");
                setSearch("");
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                view === "inactivated"
                  ? "bg-slate-900 text-white shadow-lg"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Student size={20} weight="duotone" />
              Inactivated Students
            </button>
          </div>

          <div className="flex-1 flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm">
            <MagnifyingGlass size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by name, ID, class, contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-slate-900 placeholder:text-slate-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-600 transition-colors">
                <X size={16} weight="bold" />
              </button>
            )}
          </div>
        </div>

        <div className={`rounded-[2rem] p-6 text-white flex items-center justify-between shadow-lg ${
          view === "passed-out" ? "bg-[#FF7F50] shadow-[#FF7F50]/20" : "bg-slate-800 shadow-slate-900/20"
        }`}>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">
              {view === "passed-out" ? "Total Alumni" : "Inactive Records"}
            </div>
            <div className="text-4xl font-black">{filteredRecords.length}</div>
            <p className="text-xs opacity-60 mt-1">
              {search ? `Showing results for "${search}"` : "Student records marked inactive in the system"}
            </p>
          </div>
          {view === "passed-out" ? (
            <GraduationCap size={64} weight="duotone" className="opacity-25" />
          ) : (
            <Student size={64} weight="duotone" className="opacity-25" />
          )}
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {isLoading ? (
            <div className="col-span-full py-20 text-center">
              <div className="mx-auto mb-3 h-8 w-8 rounded-full border-4 border-[#FF7F50] border-t-transparent animate-spin" />
              <p className="text-sm font-bold text-slate-400">Loading student records...</p>
            </div>
          ) : filteredRecords.length > 0 ? (
            filteredRecords.map((student) => (
              <motion.div
                key={student.dbId}
                whileHover={{ y: -5 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] group flex flex-col"
              >
                <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 mb-6 group-hover:bg-[#FF7F50] group-hover:text-white transition-all duration-500">
                  <Student size={32} weight="duotone" />
                </div>
                <div className="mb-5 flex-1">
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{student.name}</h4>
                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {student.className ? `Class ${student.className}${student.section ? `-${student.section}` : ""}` : "No class"}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-[#FF7F50]">{student.status}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <IdentificationCard size={16} className="text-slate-300 shrink-0" />
                      <span className="truncate">{student.admissionNo || student.studentId}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone size={16} className="text-slate-300 shrink-0" />
                      <span className="truncate">{student.contact || "No contact added"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-5 border-t border-slate-50 mt-auto">
                  <a
                    href={`mailto:${student.email}`}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-sky-50 hover:text-sky-600 transition-all"
                  >
                    <EnvelopeSimple size={16} /> Email
                  </a>
                  <a
                    href={student.contact ? `tel:${student.contact}` : undefined}
                    aria-disabled={!student.contact}
                    className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all aria-disabled:pointer-events-none aria-disabled:opacity-40"
                  >
                    <Phone size={16} />
                  </a>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-slate-400 font-medium">
              {search ? (
                <>
                  {emptyMessage} matching <span className="font-bold text-slate-600">"{search}"</span>
                </>
              ) : (
                emptyMessage
              )}
            </div>
          )}
        </div>
      </div>
    </PageSection>
  );
}
