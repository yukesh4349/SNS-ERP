"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  CaretLeft, 
  GraduationCap, 
  UserCircle, 
  MagnifyingGlass,
  ArrowRight,
  IdentificationCard,
  MapPin,
  Calendar,
  Phone,
  Envelope,
  SuitcaseSimple,
  BookOpen,
  Info
} from "@phosphor-icons/react";
import { PageSection } from "./page-section";
import { getSchoolClasses, getStudents, getStudentsByClass, getStudentDetails } from "../../services/data-service";
import { ResourceLoading, ResourceError } from "./resource-states";

export function StudentDirectoryPage() {
  const [view, setView] = useState<"classes" | "students" | "details">("classes");
  const [classes, setClasses] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [classData, studentData] = await Promise.all([
        getSchoolClasses(),
        getStudents(),
      ]);
      setClasses(classData);
      setAllStudents(studentData);
    } catch (err) {
      setError("Failed to fetch classes or students");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassSelect = async (cls: any) => {
    setIsLoading(true);
    setSelectedClass(cls);
    setSearch(""); // Reset search when switching to class-specific view
    try {
      const data = await getStudentsByClass(cls.class, cls.section);
      setStudents(data);
      setView("students");
    } catch (err) {
      setError("Failed to fetch students");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentSelect = async (student: any) => {
    setIsLoading(true);
    try {
      const data = await getStudentDetails(student.id);
      setSelectedStudent(data);
      setView("details");
    } catch (err) {
      setError("Failed to fetch student details");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) || 
    s.studentProfile?.studentId?.toLowerCase().includes(search.toLowerCase())
  );

  const globalFilteredStudents = allStudents.filter(s => {
    const q = search.toLowerCase();
    if (!q) return false;

    const studentName = s.name?.toLowerCase() || "";
    const studentId = s.studentProfile?.studentId?.toLowerCase() || "";
    const fatherName = s.studentProfile?.fatherName?.toLowerCase() || "";
    const motherName = s.studentProfile?.motherName?.toLowerCase() || "";
    const phone = s.phone || "";
    const profilePhone = s.studentProfile?.phone || "";
    const fatherContact = s.studentProfile?.fatherContact || "";
    const motherContact = s.studentProfile?.motherContact || "";
    const className = s.studentProfile?.class?.toLowerCase() || "";
    const classSection = `${s.studentProfile?.class || ""}-${s.studentProfile?.section || ""}`.toLowerCase();

    return (
      studentName.includes(q) ||
      studentId.includes(q) ||
      fatherName.includes(q) ||
      motherName.includes(q) ||
      phone.includes(q) ||
      profilePhone.includes(q) ||
      fatherContact.includes(q) ||
      motherContact.includes(q) ||
      classSection.includes(q)
    );
  });

  const goBack = () => {
    if (view === "details") {
      // If we got here from search, go back to classes view, otherwise back to students view
      if (selectedClass) {
        setView("students");
      } else {
        setView("classes");
      }
    } else if (view === "students") {
      setView("classes");
      setSelectedClass(null);
    }
  };

  if (isLoading && view === "classes") return <ResourceLoading label="Classes" />;
  if (error && view === "classes") return <ResourceError label="Classes" message={error} />;

  return (
    <PageSection
      eyebrow="School Directory"
      title={
        view === "classes" ? "Student Directory" : 
        view === "students" ? `Students: ${selectedClass.class} - ${selectedClass.section}` : 
        "Student Profile"
      }
      description={
        view === "classes" ? "Select a class or use global search to view roster and academic profiles." :
        view === "students" ? "Browse through the student list. Click on any student to view their complete dossier." :
        "Comprehensive academic and personal record of the selected student."
      }
    >
      <div className="flex flex-col gap-6">
        {/* Navigation / Back Button */}
        {view !== "classes" && (
          <button 
            onClick={goBack}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black text-[#FF7F50] hover:bg-orange-50 rounded-xl transition-all w-fit"
          >
            <CaretLeft size={16} weight="bold" /> 
            {view === "details" ? (selectedClass ? "Back to Student List" : "Back to Classes") : "Back to Classes"}
          </button>
        )}

        <AnimatePresence mode="wait">
          {view === "classes" && (
            <motion.div 
              key="classes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-8"
            >
              {/* Search Bar at the Top */}
              <div className="relative max-w-xl">
                <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by student, parent's name, phone, or class..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-[#FF7F50]/10 transition-all shadow-sm"
                />
              </div>

              {search ? (
                // Search Results View
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Search Results ({globalFilteredStudents.length})</h3>
                  {globalFilteredStudents.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                      {globalFilteredStudents.map((student) => (
                        <motion.div
                          key={student.id}
                          whileHover={{ y: -8 }}
                          onClick={() => handleStudentSelect(student)}
                          className="group bg-white border border-slate-100 rounded-[2rem] p-4 flex flex-col items-center text-center cursor-pointer hover:shadow-2xl hover:shadow-slate-200/50 transition-all"
                        >
                          <div className="relative w-24 h-24 mb-4">
                            <div className="absolute inset-0 bg-orange-100 rounded-full scale-110 blur-xl opacity-0 group-hover:opacity-40 transition-opacity" />
                            <img 
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} 
                              alt={student.name}
                              className="w-full h-full rounded-full bg-slate-50 border-4 border-white shadow-lg relative z-10"
                            />
                          </div>
                          <h4 className="text-sm font-black text-slate-900 leading-tight mb-1">{student.name}</h4>
                          <p className="text-[10px] font-black text-[#FF7F50] uppercase tracking-widest">
                            Class {student.studentProfile?.class || "N/A"}{student.studentProfile?.section || ""}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-1 line-clamp-1">Parent: {student.studentProfile?.fatherName || student.studentProfile?.motherName || "N/A"}</p>
                          
                          <div className="mt-4 w-full pt-4 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">View Profile</span>
                             <ArrowRight size={14} weight="bold" className="text-[#FF7F50]" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 bg-white border border-dashed border-slate-100 rounded-[3rem] text-center">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching students found</p>
                    </div>
                  )}
                </div>
              ) : (
                // Class Folders view
                classes.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {classes.map((cls) => (
                      <motion.button
                        key={`${cls.class}-${cls.section}`}
                        whileHover={{ y: -8, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleClassSelect(cls)}
                        className="group flex flex-col items-center justify-center p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 transition-all gap-4"
                      >
                        <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#FF7F50] group-hover:text-white transition-all">
                          <GraduationCap size={32} weight="duotone" />
                        </div>
                        <div className="text-center">
                          <span className="text-2xl font-black text-slate-900">{cls.class}</span>
                          <span className="text-lg font-black text-[#FF7F50] ml-1">{cls.section}</span>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">{cls.studentCount} Students</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-200 rounded-[3rem] text-center">
                     <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                        <Users size={40} weight="duotone" />
                     </div>
                     <h3 className="text-lg font-black text-slate-900">No Classes Found</h3>
                     <p className="text-sm text-slate-400 max-w-xs mt-1">There are no classes registered in the system yet. Please contact the administrator.</p>
                     <button 
                       onClick={fetchInitialData}
                       className="mt-6 px-6 py-2 bg-[#FF7F50] text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-orange-500/20"
                     >
                       Retry Connection
                     </button>
                  </div>
                )
              )}
            </motion.div>
          )}

          {view === "students" && (
            <motion.div 
              key="students"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col gap-6"
            >
              {/* Search Bar */}
              <div className="relative max-w-md">
                <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search students..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-[#FF7F50]/10 transition-all"
                />
              </div>

              {isLoading ? (
                 <ResourceLoading label="Students" />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {filteredStudents.map((student) => (
                    <motion.div
                      key={student.id}
                      whileHover={{ y: -8 }}
                      onClick={() => handleStudentSelect(student)}
                      className="group bg-white border border-slate-100 rounded-[2rem] p-4 flex flex-col items-center text-center cursor-pointer hover:shadow-2xl hover:shadow-slate-200/50 transition-all"
                    >
                      <div className="relative w-24 h-24 mb-4">
                        <div className="absolute inset-0 bg-orange-100 rounded-full scale-110 blur-xl opacity-0 group-hover:opacity-40 transition-opacity" />
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} 
                          alt={student.name}
                          className="w-full h-full rounded-full bg-slate-50 border-4 border-white shadow-lg relative z-10"
                        />
                      </div>
                      <h4 className="text-sm font-black text-slate-900 leading-tight mb-1">{student.name}</h4>
                      <p className="text-[10px] font-black text-[#FF7F50] uppercase tracking-widest">{student.studentId}</p>
                      
                      <div className="mt-4 w-full pt-4 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">View Profile</span>
                         <ArrowRight size={14} weight="bold" className="text-[#FF7F50]" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === "details" && selectedStudent && (
            <motion.div 
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Profile Card */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 flex flex-col items-center text-center shadow-xl shadow-slate-200/30">
                   <div className="w-40 h-40 rounded-full bg-slate-50 border-8 border-white shadow-2xl mb-6 relative">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStudent.name}`} 
                        alt={selectedStudent.name}
                        className="w-full h-full rounded-full"
                      />
                      <div className="absolute -bottom-2 right-4 bg-emerald-500 text-white p-2 rounded-xl border-4 border-white">
                         <IdentificationCard size={20} weight="fill" />
                      </div>
                   </div>
                   <h2 className="text-2xl font-black text-slate-900 leading-none">{selectedStudent.name}</h2>
                   <p className="text-[#FF7F50] font-black text-xs uppercase tracking-[0.2em] mt-3">ID: {selectedStudent.studentId}</p>
                   
                   <div className="grid grid-cols-2 gap-3 w-full mt-10">
                      <div className="bg-slate-50 p-4 rounded-2xl">
                         <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Class</p>
                         <p className="text-sm font-black text-slate-900">{selectedStudent.class}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl">
                         <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Section</p>
                         <p className="text-sm font-black text-slate-900">{selectedStudent.section}</p>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
                   <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Phone size={16} /></div>
                      Contact Information
                   </h3>
                   <div className="space-y-6">
                      <div className="flex items-center gap-4">
                         <div className="text-white/40"><Envelope size={20} /></div>
                         <div>
                            <p className="text-[9px] font-black uppercase text-white/40">Student Email</p>
                            <p className="text-sm font-bold truncate">{selectedStudent.email || "N/A"}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="text-white/40"><Phone size={20} /></div>
                         <div>
                            <p className="text-[9px] font-black uppercase text-white/40">Father's Contact</p>
                            <p className="text-sm font-bold">{selectedStudent.fatherContact || "N/A"}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="text-white/40"><MapPin size={20} /></div>
                         <div>
                            <p className="text-[9px] font-black uppercase text-white/40">Address</p>
                            <p className="text-sm font-bold leading-snug">{selectedStudent.address || "SNS Academy Main Campus"}</p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Information Tabs */}
              <div className="lg:col-span-2 space-y-6">
                 {/* Academic Snapshot */}
                 <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3">
                       <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF7F50] flex items-center justify-center"><BookOpen size={20} weight="duotone" /></div>
                       Academic Dossier
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                             <span className="text-[10px] font-black text-slate-400 uppercase">Admission No</span>
                             <span className="text-sm font-black text-slate-900">{selectedStudent.admissionNo || "SNS/2024/042"}</span>
                          </div>
                          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                             <span className="text-[10px] font-black text-slate-400 uppercase">Roll Number</span>
                             <span className="text-sm font-black text-slate-900">{selectedStudent.rollNo || "24"}</span>
                          </div>
                       </div>
                       <div className="space-y-6">
                          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                             <span className="text-[10px] font-black text-slate-400 uppercase">Admission Date</span>
                             <span className="text-sm font-black text-slate-900">{selectedStudent.admissionDate || "15 Aug 2023"}</span>
                          </div>
                          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                             <span className="text-[10px] font-black text-slate-400 uppercase">DOB</span>
                             <span className="text-sm font-black text-slate-900">{selectedStudent.dob || "24 May 2012"}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Parent/Guardian Info */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm group hover:border-[#FF7F50] transition-colors">
                       <h4 className="text-[10px] font-black text-[#FF7F50] uppercase tracking-widest mb-6 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#FF7F50]" />
                          Father's Details
                       </h4>
                       <div className="space-y-4">
                          <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase">Full Name</p>
                             <p className="text-sm font-black text-slate-900">{selectedStudent.fatherName || "John Doe"}</p>
                          </div>
                          <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase">Occupation</p>
                             <p className="text-sm font-bold text-slate-600">{selectedStudent.fatherOccupation || "Engineer"}</p>
                          </div>
                       </div>
                    </div>
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm group hover:border-[#FF7F50] transition-colors">
                       <h4 className="text-[10px] font-black text-[#FF7F50] uppercase tracking-widest mb-6 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#FF7F50]" />
                          Mother's Details
                       </h4>
                       <div className="space-y-4">
                          <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase">Full Name</p>
                             <p className="text-sm font-black text-slate-900">{selectedStudent.motherName || "Jane Doe"}</p>
                          </div>
                          <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase">Occupation</p>
                             <p className="text-sm font-bold text-slate-600">{selectedStudent.motherOccupation || "Doctor"}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Additional Metadata */}
                 <div className="bg-orange-50/50 rounded-[2.5rem] border border-orange-100 p-8">
                    <div className="flex items-center gap-4 mb-6">
                       <div className="p-2 bg-white rounded-xl shadow-sm"><Info size={20} weight="fill" className="text-[#FF7F50]" /></div>
                       <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Demographic & Other Details</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                       <div><p className="text-[8px] font-black text-slate-400 uppercase">Nationality</p><p className="text-xs font-black text-slate-900">{selectedStudent.nationality || "Indian"}</p></div>
                       <div><p className="text-[8px] font-black text-slate-400 uppercase">Religion</p><p className="text-xs font-black text-slate-900">{selectedStudent.religion || "Non-Denominational"}</p></div>
                       <div><p className="text-[8px] font-black text-slate-400 uppercase">Community</p><p className="text-xs font-black text-slate-900">{selectedStudent.community || "General"}</p></div>
                       <div><p className="text-[8px] font-black text-slate-400 uppercase">Mother Tongue</p><p className="text-xs font-black text-slate-900">{selectedStudent.motherTongue || "English"}</p></div>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageSection>
  );
}
