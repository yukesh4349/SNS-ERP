"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowsLeftRight, 
  UserCircle, 
  MagnifyingGlass, 
  CheckCircle,
  Clock,
  Warning,
  Plus,
  Calendar,
  UserFocus,
  Sparkle,
  TrendUp,
  XCircle,
  Selection,
  Faders,
  ArrowRight
} from "@phosphor-icons/react";
import { PageSection } from "./page-section";
import { getAllUsers } from "../../services/users-service";
import { getAvailableSubstitutes, createSubstitution, getSubstitutions } from "../../services/substitutions-service";

export function SubstitutionsPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ pendingApproval: 0, emergencyReplacements: 0, autoAssigned: 0 });
  
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [selectedPeriods, setSelectedPeriods] = useState<number[]>([]);
  const [availableSubstitutes, setAvailableSubstitutes] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, subs] = await Promise.all([
          getAllUsers(),
          getSubstitutions()
        ]);
        setTeachers(users.filter((u: any) => u.role === 'teacher'));
        setHistory(subs.requests);
        setSummary(subs.summary);
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };
    fetchData();
  }, []);

  const togglePeriod = (period: number) => {
    setSelectedPeriods(prev => 
      prev.includes(period) ? prev.filter(p => p !== period) : [...prev, period]
    );
  };

  const selectAllPeriods = () => {
    if (selectedPeriods.length === 8) {
      setSelectedPeriods([]);
    } else {
      setSelectedPeriods([1, 2, 3, 4, 5, 6, 7, 8]);
    }
  };

  const handleFetchAvailable = async () => {
    if (selectedPeriods.length === 0) return;
    setIsLoading(true);
    try {
      // Fetch available substitutes for EACH period and find the intersection
      const results = await Promise.all(
        selectedPeriods.map(p => getAvailableSubstitutes(selectedDate, p, selectedTeacher.id))
      );
      
      // Find teachers who are available in ALL selected periods
      const intersection = results.reduce((acc, current) => {
        if (acc === null) return current;
        const currentIds = current.map((t: any) => t.id);
        return acc.filter((t: any) => currentIds.includes(t.id));
      }, null as any[] | null) || [];

      setAvailableSubstitutes(intersection);
      setStep(3);
    } catch (err) {
      console.error("Failed to fetch available substitutes", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async (substituteId: string) => {
    setIsSubmitting(true);
    try {
      // Loop through all selected periods and create substitutions
      await Promise.all(selectedPeriods.map(period => 
        createSubstitution({
          date: selectedDate,
          period: period,
          absentTeacherId: selectedTeacher.id,
          substituteTeacherId: substituteId,
          notes: "Manual Assignment (Bulk)",
        })
      ));
      
      setIsSuccess(true);
      // Refresh history
      const subs = await getSubstitutions();
      setHistory(subs.requests);
      setSummary(subs.summary);
    } catch (err) {
      console.error("Failed to assign substitute", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setSelectedTeacher(null);
    setSelectedPeriods([]);
    setAvailableSubstitutes([]);
    setIsSuccess(false);
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageSection
      eyebrow="Admin Operations"
      title="Substitution Management"
      description="Manage staff absences by intelligently assigning available substitutes based on timetable and specialization."
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { label: "Pending Requests", value: summary.pendingApproval, icon: <Clock size={20} />, color: "orange" },
          { label: "Emergency Replacements", value: summary.emergencyReplacements, icon: <Warning size={20} />, color: "rose" },
          { label: "Auto Assignments", value: summary.autoAssigned, icon: <TrendUp size={20} />, color: "emerald" },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-500`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
              <div className="text-2xl font-black text-slate-900">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Wizard Column */}
        <div className="lg:col-span-8">
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_24px_70px_rgba(15,23,42,0.05)] overflow-hidden">
              <div className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <Selection size={28} className="text-[#FF7F50]" weight="fill" />
                    New Assignment Wizard
                  </h3>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((s) => (
                      <div key={s} className={`h-1.5 w-8 rounded-full transition-all duration-500 ${step >= s ? "bg-[#FF7F50]" : "bg-slate-100"}`} />
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {!isSuccess ? (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      {step === 1 && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Assignment Date</label>
                              <div className="relative">
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                  type="date" 
                                  value={selectedDate}
                                  onChange={(e) => setSelectedDate(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#FF7F50]/20 transition-all outline-none"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Search Teacher</label>
                              <div className="relative">
                                <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                  type="text" 
                                  placeholder="Search by name or dept..." 
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#FF7F50]/20 transition-all outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredTeachers.map((t) => (
                              <button
                                key={t.id}
                                onClick={() => { setSelectedTeacher(t); setStep(2); }}
                                className={`p-4 rounded-2xl border text-left transition-all hover:shadow-lg flex items-center gap-4 ${
                                  selectedTeacher?.id === t.id ? "border-[#FF7F50] bg-[#FF7F50]/5" : "border-slate-50 bg-slate-50/50 hover:bg-white"
                                }`}
                              >
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                  <UserCircle size={24} weight="duotone" />
                                </div>
                                <div>
                                  <div className="text-sm font-black text-slate-900">{t.name}</div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t.department} • {t.teacherProfile?.specialization || 'General'}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {step === 2 && (
                        <div className="space-y-6">
                          <div className="flex items-center gap-4 p-4 rounded-2xl bg-orange-50 border border-orange-100">
                            <div className="w-12 h-12 rounded-xl bg-[#FF7F50] text-white flex items-center justify-center">
                              <UserFocus size={24} weight="fill" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-400 uppercase">Absent Teacher</div>
                              <div className="text-lg font-black text-slate-900">{selectedTeacher?.name}</div>
                            </div>
                            <button onClick={() => setStep(1)} className="ml-auto p-2 text-slate-400 hover:text-slate-600 transition-colors">
                              <Faders size={20} />
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Select Absent Periods</label>
                              <button 
                                onClick={selectAllPeriods}
                                className="text-[10px] font-black text-[#FF7F50] uppercase tracking-widest bg-[#FF7F50]/5 px-3 py-1 rounded-lg"
                              >
                                {selectedPeriods.length === 8 ? "Deselect All" : "Select All"}
                              </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                                <button
                                  key={p}
                                  onClick={() => togglePeriod(p)}
                                  className={`py-4 rounded-2xl border-2 font-black transition-all ${
                                    selectedPeriods.includes(p) ? "border-[#FF7F50] bg-[#FF7F50] text-white shadow-lg shadow-orange-500/20" : "border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200"
                                  }`}
                                >
                                  Period {p}
                                </button>
                              ))}
                            </div>
                          </div>

                          <button 
                            onClick={handleFetchAvailable}
                            disabled={isLoading || selectedPeriods.length === 0}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                          >
                            {isLoading ? (
                               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                Find Available Substitutes
                                <ArrowRight size={18} />
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {step === 3 && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                               <Sparkle size={20} weight="fill" className="text-[#FF7F50]" />
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Substitutes</span>
                             </div>
                             <button onClick={() => setStep(2)} className="text-[10px] font-black text-[#FF7F50] uppercase tracking-widest">Back to Periods</button>
                          </div>

                          <div className="space-y-3">
                            {availableSubstitutes.length === 0 ? (
                              <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                                <Warning size={40} className="mx-auto text-slate-200 mb-4" />
                                <div className="text-slate-400 font-bold">No free teachers found for this period.</div>
                              </div>
                            ) : (
                              availableSubstitutes.map((sub, i) => (
                                <motion.div
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  key={sub.id}
                                  className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:border-[#FF7F50]/30"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="relative">
                                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-300 border border-slate-100">
                                        <UserCircle size={32} weight="duotone" />
                                      </div>
                                      {sub.score > 0 && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                                          <CheckCircle size={12} weight="fill" className="text-white" />
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                                        {sub.name}
                                        {sub.score > 0 && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest">Best Match</span>}
                                      </div>
                                      <div className="text-[10px] font-bold text-slate-400 uppercase">{sub.dept} • {sub.specialization || 'General'}</div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleAssign(sub.id)}
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-[#FF7F50] hover:scale-105 active:scale-95 disabled:opacity-50"
                                  >
                                    {isSubmitting ? "Assigning..." : "Assign"}
                                  </button>
                                </motion.div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-10 text-center"
                    >
                      <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/10">
                        <CheckCircle size={56} weight="fill" />
                      </div>
                      <h4 className="text-2xl font-black text-slate-900 mb-2">Assignment Complete!</h4>
                      <p className="text-slate-500 text-sm max-w-xs mx-auto mb-10 font-medium">
                        The substitution for {selectedTeacher?.name} has been successfully recorded and the substitute has been notified.
                      </p>
                      <button
                        onClick={resetWizard}
                        className="px-10 py-4 bg-[#FF7F50] text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-[#FF7F50]/20 hover:scale-105 transition-all active:scale-95"
                      >
                        Start New Assignment
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Wizard Footer */}
              {!isSuccess && (
                <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      {selectedTeacher && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-100 text-[10px] font-bold text-slate-600">
                          <UserFocus size={14} className="text-[#FF7F50]" />
                          {selectedTeacher.name}
                        </div>
                      )}
                      {selectedPeriods.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-100 text-[10px] font-bold text-slate-600">
                          <Clock size={14} className="text-[#FF7F50]" />
                          Periods: {selectedPeriods.sort((a,b) => a-b).join(", ")}
                        </div>
                      )}
                   </div>
                   {step > 1 && (
                     <button 
                      onClick={() => setStep(step - 1)}
                      className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                     >
                        Cancel Wizard
                     </button>
                   )}
                </div>
              )}
           </div>
        </div>

        {/* History Column */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.05)]">
              <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3">
                 <ArrowsLeftRight size={24} className="text-[#FF7F50]" weight="duotone" />
                 Recent Assignments
              </h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="text-center py-10">
                    <Clock size={32} className="mx-auto text-slate-100 mb-2" />
                    <p className="text-[10px] font-bold text-slate-300 uppercase">No recent history</p>
                  </div>
                ) : (
                  history.map((log) => (
                    <div key={log.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 relative group overflow-hidden">
                       <div className="absolute right-0 top-0 w-1 h-full bg-[#FF7F50] opacity-0 group-hover:opacity-100 transition-all" />
                       <div className="flex justify-between items-start mb-3">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.date}</div>
                          <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            log.status === 'completed' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'
                          }`}>
                            {log.status}
                          </div>
                       </div>
                       <div className="flex items-center gap-3 mb-2">
                          <div className="text-xs font-black text-slate-900">{log.absentTeacher}</div>
                          <ArrowRight size={12} className="text-slate-300" />
                          <div className="text-xs font-black text-slate-900">{log.suggestedTeacher}</div>
                       </div>
                       <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                          <Clock size={12} />
                          Period {log.period} • {log.mode}
                       </div>
                    </div>
                  ))
                )}
              </div>
           </div>

           <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-10">
                <Warning size={140} weight="fill" />
              </div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 rounded-xl bg-[#FF7F50] flex items-center justify-center">
                     <Warning size={20} className="text-white" />
                   </div>
                   <h4 className="font-black text-lg">Emergency Need?</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-8">
                   In case of multiple unplanned absences, use the <strong>Auto-Assign</strong> tool to optimize coverage across all departments instantly.
                </p>
                <button className="w-full py-4 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">
                   Launch Auto-Optimizer
                </button>
              </div>
           </div>
        </div>

      </div>
    </PageSection>
  );
}
