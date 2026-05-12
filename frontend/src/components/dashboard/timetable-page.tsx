"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  CaretLeft,
  GraduationCap,
  ChalkboardTeacher,
  User,
  MapPin
} from "@phosphor-icons/react";
import { PageSection } from "./page-section";
import { getMyTimetable, getAvailableClasses, getClassTimetable } from "../../services/mock-data-service";
import { ResourceLoading, ResourceError } from "./resource-states";

export function TimetablePage() {
  const [viewMode, setViewMode] = useState<"mine" | "class">("mine");
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [schedule, setSchedule] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, [viewMode]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (viewMode === "mine") {
        const data = await getMyTimetable();
        setSchedule(data);
      } else {
        const classList = await getAvailableClasses();
        setClasses(classList);
        setSchedule(null);
        setSelectedClass(null);
      }
    } catch (err) {
      setError("Failed to fetch timetable data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassSelect = async (cls: any) => {
    setIsLoading(true);
    setSelectedClass(cls);
    try {
      const data = await getClassTimetable(cls.class, cls.section);
      setSchedule(data);
    } catch (err) {
      setError("Failed to fetch class timetable");
    } finally {
      setIsLoading(false);
    }
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const renderTimetable = (data: any) => {
    if (!data || !data.schedule) return null;

    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left border-r border-slate-100">Day / Period</th>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                  <th key={p} className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map(day => {
                const dayData = data.schedule.find((s: any) => s.day === day);
                return (
                  <tr key={day} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-6 font-black text-xs text-slate-900 uppercase tracking-wider border-r border-slate-100 bg-slate-50/20">{day}</td>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(pNum => {
                      const period = dayData?.periods[pNum - 1];
                      if (!period) return <td key={pNum} className="px-4 py-6 text-center text-slate-200">-</td>;
                      
                      return (
                        <td key={pNum} className="px-4 py-6">
                          <div className="flex flex-col items-center text-center gap-1">
                            <span className="text-[11px] font-black text-slate-900">{period.subject}</span>
                            {viewMode === "class" && period.teacher && (
                              <span className="text-[9px] font-bold text-[#FF7F50] uppercase tracking-tighter flex items-center gap-1">
                                <User size={10} weight="fill" /> {period.teacher}
                              </span>
                            )}
                            {viewMode === "mine" && period.grade && (
                              <span className="text-[9px] font-bold text-sky-500 uppercase tracking-tighter flex items-center gap-1">
                                <GraduationCap size={10} weight="fill" /> {period.grade}
                              </span>
                            )}
                            <span className="text-[8px] font-medium text-slate-400 flex items-center gap-1">
                               <MapPin size={10} /> {period.room}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <PageSection
      eyebrow="Academic Logistics"
      title="School Timetable"
      description="Manage and view class-wise or personal schedules with real-time period updates."
    >
      <div className="flex flex-col gap-6">
        {/* View Switcher */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
            <button 
              onClick={() => setViewMode("mine")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === "mine" ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}
            >
              <ChalkboardTeacher size={16} weight="duotone" />
              My Timetable
            </button>
            <button 
              onClick={() => setViewMode("class")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === "class" ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}
            >
              <GraduationCap size={16} weight="duotone" />
              Class Timetable
            </button>
          </div>

          {viewMode === "class" && selectedClass && (
            <button 
              onClick={() => { setSelectedClass(null); setSchedule(null); }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#FF7F50] hover:bg-orange-50 rounded-xl transition-all"
            >
              <CaretLeft size={16} weight="bold" /> Back to Classes
            </button>
          )}

          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-orange-50 text-[#FF7F50] flex items-center justify-center">
                <Clock size={20} weight="duotone" />
             </div>
             <div className="text-right hidden md:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Current Term</p>
                <p className="text-sm font-black text-slate-900 leading-none">Term 1 (2026)</p>
             </div>
          </div>
        </div>

        {isLoading && <ResourceLoading label="Timetable" />}
        {error && <ResourceError label="Timetable" message={error} />}

        {!isLoading && !error && (
          <AnimatePresence mode="wait">
            {viewMode === "class" && !selectedClass ? (
              <motion.div 
                key="class-grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6"
              >
                {classes.map((cls, idx) => (
                  <motion.button
                    key={`${cls.class}-${cls.section}`}
                    whileHover={{ y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleClassSelect(cls)}
                    className="group relative flex flex-col items-center justify-center p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 transition-all gap-4 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50/50 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-150" />
                    <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#FF7F50] group-hover:text-white transition-all shadow-sm">
                      <GraduationCap size={32} weight="duotone" />
                    </div>
                    <div className="text-center relative z-10">
                      <span className="text-2xl font-black text-slate-900">{cls.class}</span>
                      <span className="text-lg font-black text-[#FF7F50] ml-1">{cls.section}</span>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Section View</p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="timetable-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col"
              >
                <div className="flex items-center gap-4 mb-2">
                   <div className="h-1 w-12 bg-[#FF7F50] rounded-full" />
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                      {viewMode === "mine" ? "My Personal Schedule" : `Timetable: Class ${selectedClass.class} - ${selectedClass.section}`}
                   </h3>
                </div>
                {renderTimetable(schedule)}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </PageSection>
  );
}
