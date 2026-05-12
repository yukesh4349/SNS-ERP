import { useState, useEffect } from "react";
import { 
  CaretLeft, 
  CaretRight, 
  Plus, 
  X,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  CalendarCheck,
  TrendUp,
  Info
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/use-auth";
import { PageSection } from "./page-section";
import { getCalendarEvents, createCalendarEvent } from "../../services/mock-data-service";
import { apiRequest } from "../../services/api-client";
import { ResourceLoading } from "./resource-states";

export function CalendarPage() {
  const { session } = useAuth();
  const isAdmin = session?.user.role === "admin" || session?.user.role === "superadmin";
  const isTeacher = session?.user.role === "teacher";
  
  const [viewMode, setViewMode] = useState<"events" | "attendance">("events");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    startDate: "",
    endDate: "",
    type: "holiday",
    description: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const eventData = await getCalendarEvents();
        setEvents(eventData);
        
        if (isTeacher) {
          const monthStr = currentDate.toISOString().slice(0, 7); // YYYY-MM
          const attData = await apiRequest<any>(`/attendance/my-attendance?month=${monthStr}`);
          setAttendance(attData);
        }
      } catch (err) {
        console.error("Failed to fetch calendar data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isTeacher, currentDate]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  const totalDays = daysInMonth(year, month);
  const startOffset = firstDayOfMonth(year, month);

  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  const getDayEvents = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.startDate.startsWith(dateStr));
  };

  const getDayAttendance = (day: number) => {
    if (!attendance?.records) return null;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendance.records.find((r: any) => r.date.startsWith(dateStr));
  };

  const numRows = Math.ceil(days.length / 7);

  const handleSaveEvent = async () => {
    try {
      const newEvent = await createCalendarEvent({ ...formData, endDate: formData.startDate });
      setEvents([...events, newEvent]);
      setIsModalOpen(false);
    } catch (err) {
      alert("Failed to save event");
    }
  };

  if (isLoading) return <ResourceLoading label="Calendar" />;

  return (
    <PageSection
      eyebrow="Schedule & Attendance"
      title="School Calendar"
      description="View school events and your personal attendance records in a unified monthly view."
    >
      <div className="flex flex-col gap-6">
        {/* View Switcher */}
        <div className="flex items-center justify-between gap-4 bg-[var(--bg-secondary)] border border-[var(--border)] p-2 rounded-2xl">
          <div className="flex gap-1">
            <button 
              onClick={() => setViewMode("events")}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === "events" ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20" : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"}`}
            >
              Events
            </button>
            {isTeacher && (
              <button 
                onClick={() => setViewMode("attendance")}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === "attendance" ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20" : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"}`}
              >
                My Attendance
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-[var(--text-primary)]">
              {monthName} <span className="text-[var(--text-secondary)] opacity-50 font-bold">{year}</span>
            </h2>
            <div className="flex items-center bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden p-1">
               <button onClick={handlePrevMonth} className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)] transition-all"><CaretLeft size={16} weight="bold" /></button>
               <button onClick={handleNextMonth} className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)] transition-all"><CaretRight size={16} weight="bold" /></button>
            </div>
            {isAdmin && viewMode === "events" && (
              <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2.5 rounded-xl font-black text-[10px] tracking-widest shadow-lg shadow-[var(--accent)]/20 hover:scale-105 transition-all">
                <Plus size={16} weight="bold" /> ADD EVENT
              </button>
            )}
          </div>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[var(--bg-secondary)] p-6 rounded-[2rem] border border-[var(--border)] shadow-sm flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-slate-500/10 text-slate-500 flex items-center justify-center"><CalendarIcon size={24} weight="duotone" /></div>
             <div><p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Work Days</p><p className="text-2xl font-black text-[var(--text-primary)]">{attendance?.workingDays || 0}</p></div>
          </div>
          <div className="bg-emerald-500/10 p-6 rounded-[2rem] border border-emerald-500/20 shadow-sm flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center"><CheckCircle size={24} weight="fill" /></div>
             <div><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Present</p><p className="text-2xl font-black text-emerald-700">{attendance?.present || 0}</p></div>
          </div>
          <div className="bg-rose-500/10 p-6 rounded-[2rem] border border-rose-500/20 shadow-sm flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center"><XCircle size={24} weight="fill" /></div>
             <div><p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Absent</p><p className="text-2xl font-black text-rose-700">{attendance?.absent || 0}</p></div>
          </div>
          <div className="bg-[#FF7F50] p-6 rounded-[2rem] shadow-lg shadow-[#FF7F50]/20 flex items-center gap-4 text-white">
             <div className="h-12 w-12 rounded-2xl bg-white/20 text-white flex items-center justify-center"><TrendUp size={24} weight="duotone" /></div>
             <div><p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Attendance %</p><p className="text-2xl font-black">{attendance?.percentage || 0}%</p></div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Main Calendar Grid */}
          <div className="xl:col-span-8 bg-[var(--bg-secondary)] rounded-[2.5rem] border border-[var(--border)] shadow-xl overflow-hidden flex flex-col">
            <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--bg-primary)]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">{d}</div>
              ))}
            </div>

            <div 
              className="grid grid-cols-7 border-l border-[var(--border)]"
              style={{ gridTemplateRows: `repeat(${numRows}, minmax(100px, 1fr))` }}
            >
              {days.map((day, idx) => {
                const dayEvents = day ? getDayEvents(day) : [];
                const dayAtt = day ? getDayAttendance(day) : null;
                const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                
                let bgColor = "bg-[var(--bg-secondary)]";
                if (dayAtt) {
                  bgColor = (dayAtt.status === 'Present' || dayAtt.status === 'P') ? "bg-emerald-500/10" : "bg-rose-500/10";
                }
                
                return (
                  <div 
                    key={idx} 
                    className={`p-2 border-r border-b border-[var(--border)] flex flex-col transition-colors ${day ? `${bgColor} hover:brightness-95` : 'bg-[var(--bg-primary)]/50'}`}
                  >
                    {day && (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-lg ${isToday ? 'bg-[#FF7F50] text-white shadow-lg' : 'text-[var(--text-secondary)]'}`}>
                            {day}
                          </span>
                          {dayAtt && (
                             <div className={`w-1.5 h-1.5 rounded-full ${dayAtt.status === 'Present' || dayAtt.status === 'P' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          )}
                        </div>
                        
                        <div className="space-y-1 flex-1 overflow-y-auto hide-scrollbar">
                          {dayEvents.map(e => (
                            <div 
                              key={e.id}
                              className={`px-1.5 py-0.5 rounded-md text-[8px] font-black truncate border ${
                                e.type === 'holiday' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' :
                                e.type === 'exam' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                                'bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[var(--accent)]'
                              }`}
                            >
                              {e.title}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side Events List */}
          <div className="xl:col-span-4 space-y-6">
             <div className="bg-[var(--bg-secondary)] rounded-[2rem] border border-[var(--border)] p-8 shadow-xl">
                <h3 className="text-xl font-black text-[var(--text-primary)] mb-6 uppercase tracking-tight italic">Upcoming <span className="text-[var(--accent)]">Events</span></h3>
                <div className="space-y-4">
                   {events.slice(0, 5).map(e => (
                      <div key={e.id} className="flex gap-4 p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] group hover:border-[var(--accent)] transition-all">
                         <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                           e.type === 'holiday' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                           e.type === 'exam' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                           'bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[var(--accent)]'
                         }`}>
                            <span className="text-xs font-black leading-none">{new Date(e.startDate).getDate()}</span>
                            <span className="text-[8px] font-black uppercase">{new Date(e.startDate).toLocaleString('default', { month: 'short' })}</span>
                         </div>
                         <div className="min-w-0">
                            <h4 className="text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">{e.title}</h4>
                            <p className="text-[10px] font-medium text-[var(--text-secondary)] mt-1">{e.type.toUpperCase()} • {e.description || 'School event'}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/20 blur-[60px] -mr-16 -mt-16 group-hover:bg-[var(--accent)]/40 transition-all" />
                <h3 className="text-lg font-black mb-2 uppercase tracking-widest italic">Attendance Summary</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">Maintain consistent attendance to ensure optimal teaching outcomes and school compliance.</p>
                <div className="flex items-center gap-4">
                   <div className="flex-1">
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${attendance?.percentage || 0}%` }}
                           className="h-full bg-[var(--accent)]" 
                         />
                      </div>
                   </div>
                   <span className="text-sm font-black italic">{attendance?.percentage || 0}%</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Admin Modal for Creating Events */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-slate-900 uppercase">Create Event</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X size={24} weight="bold" /></button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                   <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#FF7F50]/10" placeholder="E.g. Sports Meet" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                   <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                   <div className="grid grid-cols-2 gap-2">
                      {['holiday', 'exam', 'event', 'academic'].map(cat => (
                         <button key={cat} onClick={() => setFormData({...formData, type: cat})} className={`py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${formData.type === cat ? 'bg-[#FF7F50] border-[#FF7F50] text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300'}`}>{cat}</button>
                      ))}
                   </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                 <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-400 border border-slate-100 hover:bg-slate-50 transition-all">Cancel</button>
                 <button onClick={handleSaveEvent} className="flex-[2] px-6 py-4 rounded-2xl bg-[#FF7F50] text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-[#FF7F50]/20 hover:bg-[#e66a3e] transition-all">Post Event</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageSection>
  );
}
