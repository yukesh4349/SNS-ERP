"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  PencilSimple, 
  Plus, 
  Clock, 
  CheckCircle,
  X,
  CaretLeft,
  GraduationCap,
  GearSix,
  FloppyDisk,
  Trash,
  Minus
} from "@phosphor-icons/react";
import { PageSection } from "./page-section";
import { apiRequest } from "../../services/api-client";
import { ResourceLoading, ResourceError } from "./resource-states";
import { 
  getClassTimetable, 
  saveTimetable, 
  getTimetableConfig, 
  updateTimetableConfig,
  getClassTimetableConfig,
  updateClassTimetableConfig,
  TimetableConfig, 
  TimetableEntry 
} from "../../services/timetable-service";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

const DEFAULT_CONFIG: TimetableConfig = {
  periodsCount: 8,
  lunchAfterPeriod: 4,
  timings: [
    { period: 1, start: "08:45", end: "09:30" },
    { period: 2, start: "09:30", end: "10:15" },
    { period: 3, start: "10:15", end: "11:00" },
    { period: 4, start: "11:00", end: "11:45" },
    { period: 5, start: "12:15", end: "13:00" },
    { period: 6, start: "13:00", end: "13:45" },
    { period: 7, start: "13:45", end: "14:30" },
    { period: 8, start: "14:30", end: "15:15" },
  ],
};

export function TimetablePage() {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [classes, setClasses] = useState<string[]>([]);
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timetable config
  const [config, setConfig] = useState<TimetableConfig>(DEFAULT_CONFIG);
  const [editConfig, setEditConfig] = useState<TimetableConfig>(DEFAULT_CONFIG);

  // Grid data: grid[day][period] = subject
  const [grid, setGrid] = useState<Record<string, Record<number, string>>>({});

  // Load initial data (classes list and global config as fallback)
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      apiRequest<any>("/timetable"),
      getTimetableConfig().catch(() => DEFAULT_CONFIG),
    ])
      .then(([res, cfg]) => {
        if (res?.metadata?.classes && res.metadata.classes.length > 0) {
          setClasses(res.metadata.classes);
        }
        setConfig(cfg || DEFAULT_CONFIG);
        setEditConfig(cfg || DEFAULT_CONFIG);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  // Load class timetable and its config when a class is selected
  const loadClassTimetable = useCallback(async (classLabel: string) => {
    const parts = classLabel.split("-");
    const cls = parts[0];
    const section = parts.slice(1).join("-") || "A";

    setIsLoading(true);
    try {
      // Fetch class-specific config and timetable entries in parallel
      const [entries, classConfig] = await Promise.all([
        getClassTimetable(cls, section).catch(() => [] as TimetableEntry[]),
        getClassTimetableConfig(cls, section).catch(() => config)
      ]);

      setConfig(classConfig);
      setEditConfig(classConfig);

      const newGrid: Record<string, Record<number, string>> = {};
      DAYS.forEach(day => { newGrid[day] = {}; });
      entries.forEach(entry => {
        if (!newGrid[entry.day]) newGrid[entry.day] = {};
        newGrid[entry.day][entry.period] = entry.subject;
      });
      setGrid(newGrid);
    } catch (err) {
      console.error(err);
      const newGrid: Record<string, Record<number, string>> = {};
      DAYS.forEach(day => { newGrid[day] = {}; });
      setGrid(newGrid);
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  useEffect(() => {
    if (selectedClass) {
      loadClassTimetable(selectedClass);
    } else {
      // Reset config to global when going back to list
      getTimetableConfig().then(cfg => {
        setConfig(cfg);
        setEditConfig(cfg);
      }).catch(() => {});
    }
  }, [selectedClass, loadClassTimetable]);

  const handleCellChange = (day: string, period: number, value: string) => {
    setGrid(prev => ({
      ...prev,
      [day]: {
        ...(prev[day] || {}),
        [period]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedClass) return;
    setIsSaving(true);

    const parts = selectedClass.split("-");
    const cls = parts[0];
    const section = parts.slice(1).join("-") || "A";

    const entries: { day: string; period: number; subject: string; startTime: string; endTime: string }[] = [];
    DAYS.forEach(day => {
      for (let p = 1; p <= config.periodsCount; p++) {
        const subject = grid[day]?.[p] || "";
        if (subject.trim()) {
          const timing = config.timings.find(t => t.period === p);
          entries.push({
            day,
            period: p,
            subject: subject.trim(),
            startTime: timing?.start || "",
            endTime: timing?.end || "",
          });
        }
      }
    });

    try {
      await saveTimetable(cls, section, entries);
      setIsEditing(false);
    } catch (err: any) {
      alert("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddClass = async () => {
    const trimmed = newClassName.trim().toUpperCase();
    if (!trimmed) return;
    if (classes.includes(trimmed)) {
      alert(`Class "${trimmed}" already exists.`);
      return;
    }

    // Parse class and section
    const parts = trimmed.split("-");
    const cls = parts[0];
    const section = parts.slice(1).join("-") || "A";

    // Save an empty timetable to the backend to register this class
    try {
      await saveTimetable(cls, section, []);
      setClasses(prev => [...prev, trimmed].sort());
      setNewClassName("");
      setIsAddClassModalOpen(false);
    } catch (err: any) {
      alert("Failed to add class: " + (err.message || "Unknown error"));
    }
  };

  const handleDeleteClass = async (classLabel: string) => {
    if (!confirm(`Are you sure you want to delete class "${classLabel}" and all its timetable data?`)) return;
    
    const parts = classLabel.split("-");
    const cls = parts[0];
    const section = parts.slice(1).join("-") || "A";

    try {
      await saveTimetable(cls, section, []); // Delete all entries
      setClasses(prev => prev.filter(c => c !== classLabel));
      if (selectedClass === classLabel) {
        setSelectedClass(null);
      }
    } catch (err: any) {
      alert("Failed to delete: " + (err.message || "Unknown error"));
    }
  };

  const handleSaveConfig = async () => {
    try {
      let saved;
      if (selectedClass) {
        const parts = selectedClass.split("-");
        const cls = parts[0];
        const section = parts.slice(1).join("-") || "A";
        saved = await updateClassTimetableConfig(cls, section, editConfig);
      } else {
        saved = await updateTimetableConfig(editConfig);
      }
      setConfig(saved);
      setIsConfigOpen(false);
      // Reload timetable if editing a class
      if (selectedClass) {
        loadClassTimetable(selectedClass);
      }
    } catch (err: any) {
      alert("Failed to save config: " + (err.message || "Unknown error"));
    }
  };

  const handlePeriodsCountChange = (newCount: number) => {
    const clamped = Math.max(4, Math.min(10, newCount));
    const currentTimings = [...editConfig.timings];
    
    // Add or remove timings
    while (currentTimings.length < clamped) {
      const lastTiming = currentTimings[currentTimings.length - 1];
      const lastEnd = lastTiming?.end || "15:00";
      const [h, m] = lastEnd.split(":").map(Number);
      const newStart = lastEnd;
      const endMinutes = h * 60 + m + 45;
      const newEnd = `${Math.floor(endMinutes / 60).toString().padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;
      currentTimings.push({ period: currentTimings.length + 1, start: newStart, end: newEnd });
    }
    while (currentTimings.length > clamped) {
      currentTimings.pop();
    }

    setEditConfig({
      ...editConfig,
      periodsCount: clamped,
      lunchAfterPeriod: Math.min(editConfig.lunchAfterPeriod, clamped),
      timings: currentTimings,
    });
  };

  // Build the column headers
  const buildColumns = () => {
    const cols: { type: "period" | "lunch"; period?: number; label: string; timing?: string }[] = [];
    for (let p = 1; p <= config.periodsCount; p++) {
      const timing = config.timings.find(t => t.period === p);
      cols.push({
        type: "period",
        period: p,
        label: ROMAN[p - 1] || `${p}`,
        timing: timing ? `${timing.start}–${timing.end}` : "",
      });
      if (p === config.lunchAfterPeriod) {
        cols.push({ type: "lunch", label: "LUNCH" });
      }
    }
    return cols;
  };

  const columns = buildColumns();

  return (
    <PageSection
      eyebrow="Academic Schedule"
      title={selectedClass ? `Timetable: ${selectedClass}` : "Master Timetable"}
      description={selectedClass 
        ? `Viewing detailed ${config.periodsCount}-period schedule for Class ${selectedClass}.` 
        : "Select a class to view its specific weekly schedule and coordinate with departments."}
    >
      <div className="flex flex-col gap-8">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm gap-4">
           <div className="flex items-center gap-4">
              {selectedClass ? (
                <button 
                  onClick={() => { setSelectedClass(null); setIsEditing(false); }}
                  className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
                >
                  <CaretLeft size={24} weight="bold" />
                </button>
              ) : (
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#FF7F50]">
                   <Calendar size={24} weight="duotone" />
                </div>
              )}
              <div>
                 <h4 className="text-lg font-bold text-slate-900">{selectedClass ? `Class ${selectedClass}` : "Weekly View"}</h4>
                 <p className="text-xs text-slate-500 font-medium">{`${new Date().getFullYear()} Academic Schedule`}</p>
              </div>
           </div>
           <div className="flex gap-2 flex-wrap">
             {!selectedClass ? (
               <>
                 <button
                   onClick={() => setIsConfigOpen(true)}
                   className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
                 >
                   <GearSix size={18} weight="bold" /> Global Config
                 </button>
                 <button
                   onClick={() => setIsAddClassModalOpen(true)}
                   className="flex items-center gap-2 px-6 py-3 bg-[#FF7F50] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#FF7F50]/20 hover:bg-[#e66a3e] transition-all"
                 >
                   <Plus size={18} weight="bold" /> Add Class
                 </button>
               </>
             ) : (
               <div className="flex gap-2">
                  <button
                    onClick={() => setIsConfigOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all mr-2"
                  >
                    <GearSix size={18} weight="bold" /> Configure Timings
                  </button>
                  {isEditing ? (
                    <>
                      <button 
                        onClick={() => { setIsEditing(false); loadClassTimetable(selectedClass); }}
                        className="px-5 py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all flex items-center gap-2"
                      >
                         <X size={18} /> Cancel
                      </button>
                      <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-3 rounded-xl font-bold text-sm bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                         <FloppyDisk size={18} weight="bold" /> {isSaving ? "Saving..." : "Save Schedule"}
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-3 rounded-xl font-bold text-sm bg-slate-900 text-white transition-all flex items-center gap-2"
                    >
                       <PencilSimple size={18} /> Edit Timetable
                    </button>
                  )}
               </div>
             )}
           </div>
        </div>

        {isLoading ? <ResourceLoading label="timetable" /> : null}
        {error ? <ResourceError label="timetable" message={error} /> : null}

        {!selectedClass ? (
          /* Class Selection Grid */
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {classes.map((cls) => (
              <motion.div
                key={cls}
                className="relative group"
              >
                <motion.button
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedClass(cls)}
                  className="w-full flex flex-col items-center justify-center p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all gap-4"
                >
                  <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#FF7F50] group-hover:text-white transition-all">
                    <GraduationCap size={32} weight="duotone" />
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-black text-slate-900">{cls}</span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Grade {cls.split('-')[0]}</p>
                  </div>
                </motion.button>
                {/* Delete button overlay */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls); }}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 h-8 w-8 rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all z-10"
                  title="Delete class"
                >
                  <Trash size={14} weight="bold" />
                </button>
              </motion.div>
            ))}
            {/* Add Class card */}
            <motion.button
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAddClassModalOpen(true)}
              className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] hover:border-[#FF7F50] hover:bg-orange-50 transition-all gap-4"
            >
              <div className="h-16 w-16 rounded-3xl bg-white flex items-center justify-center text-slate-300 border border-slate-100">
                <Plus size={28} weight="bold" />
              </div>
              <div className="text-center">
                <span className="text-sm font-black text-slate-400">Add Class</span>
              </div>
            </motion.button>
          </div>
        ) : (
          /* Tabular Timetable Grid with Inline Editing */
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/80 text-[10px] uppercase tracking-widest text-slate-500 font-black border-b border-slate-100">
                    <th className="px-6 py-5 border-r border-slate-100 w-36 text-center">DAY / PERIOD</th>
                    {columns.map((col, i) => (
                      <th 
                        key={i} 
                        className={`px-3 py-5 text-center ${col.type === "lunch" ? "text-sky-600 bg-sky-50/50 w-20" : ""}`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[11px]">{col.label}</span>
                          {col.timing && (
                            <span className="text-[8px] font-semibold text-slate-400 normal-case tracking-normal">{col.timing}</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs font-bold text-slate-900">
                  {DAYS.map((day) => (
                    <tr key={day} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 border-r border-slate-100 uppercase tracking-wider font-black text-slate-800 text-center italic text-[11px]">
                        {day}
                      </td>
                      {columns.map((col, ci) => {
                        if (col.type === "lunch") {
                          return (
                            <td key={ci} className="px-3 py-4 text-center text-sky-400 font-bold italic bg-sky-50/20 text-[10px] tracking-widest">
                              LUNCH
                            </td>
                          );
                        }
                        const period = col.period!;
                        const value = grid[day]?.[period] || "";
                        
                        return (
                          <td key={ci} className="px-1 py-1 text-center">
                            {isEditing ? (
                              <input
                                type="text"
                                value={value}
                                onChange={(e) => handleCellChange(day, period, e.target.value)}
                                placeholder="—"
                                className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#FF7F50]/30 focus:border-[#FF7F50] transition-all placeholder:text-slate-300"
                              />
                            ) : (
                              <span className={`text-sm ${value ? "text-slate-700" : "text-slate-300"}`}>
                                {value || "—"}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Editing hint */}
            {isEditing && (
              <div className="p-4 bg-amber-50 border-t border-amber-100 text-center">
                <p className="text-xs font-semibold text-amber-700">
                  ✏️ Type subject names directly into the cells. Leave empty to clear. Press <strong>Save Schedule</strong> when done.
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Add Class Modal */}
      <AnimatePresence>
        {isAddClassModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddClassModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-black text-slate-900">Add New Class</h3>
                <button onClick={() => setIsAddClassModalOpen(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all">
                  <X size={24} weight="bold" />
                </button>
              </div>
              <div className="p-8 space-y-4">
                <p className="text-sm text-slate-500">Enter the class name (e.g. <span className="font-bold text-slate-800">1-C</span>, <span className="font-bold text-slate-800">11-B</span>)</p>
                <input
                  type="text"
                  placeholder="e.g. 1-C"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddClass()}
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-lg font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#FF7F50]/10 uppercase tracking-widest"
                />
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={handleAddClass}
                  className="w-full bg-[#FF7F50] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#FF7F50]/20 hover:bg-[#e66a3e] transition-all"
                >
                  Add Class
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Config Modal */}
      <AnimatePresence>
        {isConfigOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfigOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{selectedClass ? `Timings for ${selectedClass}` : "Global Timetable Config"}</h3>
                  <p className="text-xs text-slate-500 mt-1">Configure periods, timings and lunch break</p>
                </div>
                <button onClick={() => setIsConfigOpen(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all">
                  <X size={24} weight="bold" />
                </button>
              </div>
              
              <div className="p-8 space-y-6 overflow-y-auto flex-1">
                {/* Number of Periods */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Number of Periods</label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handlePeriodsCountChange(editConfig.periodsCount - 1)}
                      className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-all"
                    >
                      <Minus size={20} weight="bold" />
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-4xl font-black text-slate-900">{editConfig.periodsCount}</span>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">PERIODS PER DAY</p>
                    </div>
                    <button
                      onClick={() => handlePeriodsCountChange(editConfig.periodsCount + 1)}
                      className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-all"
                    >
                      <Plus size={20} weight="bold" />
                    </button>
                  </div>
                </div>

                {/* Lunch Position */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Lunch Break After Period</label>
                  <select
                    value={editConfig.lunchAfterPeriod}
                    onChange={(e) => setEditConfig({ ...editConfig, lunchAfterPeriod: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#FF7F50]/10"
                  >
                    {Array.from({ length: editConfig.periodsCount }, (_, i) => i + 1).map(p => (
                      <option key={p} value={p}>After Period {ROMAN[p - 1] || p}</option>
                    ))}
                  </select>
                </div>

                {/* Period Timings */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Period Timings</label>
                  <div className="space-y-2">
                    {editConfig.timings.map((timing, index) => (
                      <div key={index} className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
                        <span className="text-xs font-black text-slate-500 w-10 shrink-0">
                          {ROMAN[timing.period - 1] || timing.period}
                        </span>
                        <input
                          type="time"
                          value={timing.start}
                          onChange={(e) => {
                            const newTimings = [...editConfig.timings];
                            newTimings[index] = { ...newTimings[index], start: e.target.value };
                            setEditConfig({ ...editConfig, timings: newTimings });
                          }}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#FF7F50]/20"
                        />
                        <span className="text-slate-400 text-xs font-bold">to</span>
                        <input
                          type="time"
                          value={timing.end}
                          onChange={(e) => {
                            const newTimings = [...editConfig.timings];
                            newTimings[index] = { ...newTimings[index], end: e.target.value };
                            setEditConfig({ ...editConfig, timings: newTimings });
                          }}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#FF7F50]/20"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0">
                <button 
                  onClick={handleSaveConfig}
                  className="w-full bg-[#FF7F50] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#FF7F50]/20 hover:bg-[#e66a3e] transition-all transform active:scale-95"
                >
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageSection>
  );
}
