"use client";

import { useState } from "react";
import { 
  CaretLeft, 
  CaretRight, 
  Plus, 
  PencilSimple, 
  Trash, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  X,
  CheckCircle,
  Tag
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/use-auth";
import { PageSection } from "./page-section";
import { apiRequest } from "../../services/api-client";
import { useEffect } from "react";

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO format YYYY-MM-DD
  time: string;
  type: "academic" | "holiday" | "event" | "exam" | "attendance-present" | "attendance-absent";
  location?: string;
  description?: string;
}

export function CalendarPage() {
  const { session } = useAuth();
  const isAdmin = session?.user.role === "admin";
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  
  // Modal Form State
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    type: "academic" as "academic" | "holiday" | "event" | "exam" | "attendance-present" | "attendance-absent",
    location: "",
    description: ""
  });

  const fetchCalendarData = async () => {
    setIsLoading(true);
    try {
      // Fetch school events
      const dbEvents = await apiRequest<any[]>("/calendar/events");
      let mappedEvents: CalendarEvent[] = dbEvents.map((e: any) => ({
        id: e.id,
        title: e.title,
        date: new Date(e.startDate).toISOString().split("T")[0],
        time: e.allDay ? "Full Day" : new Date(e.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: e.type,
        location: e.description || "",
      }));

      // Fetch teacher attendance if user is a teacher
      if (session?.user.role === "teacher") {
        try {
          const attendanceData = await apiRequest<any>("/calendar/my-attendance");
          if (attendanceData && Array.isArray(attendanceData.records)) {
            const attendanceEvents: CalendarEvent[] = attendanceData.records.map((rec: any, idx: number) => {
              const statusLower = rec.status.toLowerCase();
              const isPresent = statusLower === 'present' || statusLower === 'p';
              return {
                id: `attendance-${idx}`,
                title: isPresent ? "PRESENT (Faculty)" : "ABSENT (Faculty)",
                date: new Date(rec.date).toISOString().split("T")[0],
                time: "08:30 AM - 06:00 PM",
                type: isPresent ? "attendance-present" : "attendance-absent",
                location: "SNS Academy",
              };
            });
            mappedEvents = [...mappedEvents, ...attendanceEvents];
          }
        } catch (attErr) {
          console.error("Failed to load teacher attendance", attErr);
        }
      }

      setEvents(mappedEvents);
    } catch (err) {
      console.error("Failed to load calendar events", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [session]);

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

  // Fill leading empty days
  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }
  // Fill actual days
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const openModal = (event?: CalendarEvent) => {
    // Prevent non-admin editing or viewing modal for attendance markers
    if (event && event.id.startsWith("attendance-")) return;
    if (!isAdmin && !event) return; // Non-admin cannot create
    if (!isAdmin && event) return; // Non-admin cannot edit

    if (event) {
      setEditingEvent(event);
      setFormData({ 
        title: event.title,
        date: event.date,
        time: event.time,
        type: event.type,
        location: event.location || "", 
        description: event.description || "" 
      });
    } else {
      setEditingEvent(null);
      setFormData({ title: "", date: "", time: "", type: "academic", location: "", description: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (editingEvent) {
      // Edit logic
      setEvents(events.map(e => e.id === editingEvent.id ? { ...formData, id: e.id } : e));
    } else {
      try {
        await apiRequest("/calendar/events", {
          method: "POST",
          body: JSON.stringify({
            title: formData.title,
            startDate: new Date(formData.date + "T" + (formData.time || "09:00")),
            endDate: new Date(formData.date + "T" + (formData.time || "17:00")),
            type: formData.type,
            allDay: !formData.time,
          }),
        });
        fetchCalendarData();
      } catch (err) {
        console.error("Failed to create event", err);
      }
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this event?")) {
      setEvents(events.filter(e => e.id !== id));
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "academic": return "bg-blue-50 text-blue-600 border-blue-100";
      case "holiday": return "bg-rose-50 text-rose-600 border-rose-100";
      case "exam": return "bg-amber-50 text-amber-600 border-amber-100";
      case "event": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "attendance-present": return "bg-emerald-100 text-emerald-800 border-emerald-200 font-bold";
      case "attendance-absent": return "bg-rose-100 text-rose-800 border-rose-200 font-bold";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  return (
    <>
    <PageSection
      eyebrow="Schedule & Events"
      title="School Calendar"
      description="Manage the official school timeline, schedule events, and broadcast academic dates to the community."
    >
      <div className="flex flex-col gap-6">
        {/* Unified Calendar Card */}
        <div className="w-full rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl shadow-slate-200/40 overflow-hidden flex flex-col">
          {/* Unified Top Header: Title + Month Controls */}
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <CalendarIcon size={24} weight="duotone" className="text-[#FF7F50]" />
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">School Schedule</h1>
              </div>
              <p className="text-xs font-bold text-slate-400 mt-2 ml-9">Academic events, exams and holidays for the current year.</p>
            </div>

            <div className="flex items-center gap-6">
              <h2 className="text-2xl font-black text-slate-900 leading-none">
                {monthName} <span className="text-slate-300 font-bold ml-1">{year}</span>
              </h2>
              <div className="flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden p-1 shadow-sm">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-all active:scale-90">
                  <CaretLeft size={20} weight="bold" />
                </button>
                <div className="w-px h-6 bg-slate-100 mx-1"></div>
                <button onClick={handleNextMonth} className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-all active:scale-90">
                  <CaretRight size={20} weight="bold" />
                </button>
              </div>
              
              {isAdmin && (
                <button 
                  onClick={() => openModal()}
                  className="hidden md:flex items-center gap-2 bg-[#FF7F50] text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg shadow-[#FF7F50]/20 hover:bg-[#e66a3e] transition-all"
                >
                  <Plus size={18} weight="bold" />
                  <span>ADD EVENT</span>
                </button>
              )}
            </div>
          </div>

            {/* Grid Headers - Compact */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-white shrink-0">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                <div key={d} className="py-2 text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <span className="hidden md:inline">{d}</span>
                  <span className="md:hidden">{d.substring(0, 3)}</span>
                </div>
              ))}
            </div>

            {/* Calendar Grid - Auto-filling height */}
            <div className="grid grid-cols-7 border-l border-slate-100 flex-1 overflow-hidden">
              {days.map((day, idx) => {
                const dayEvents = day ? getEventsForDay(day) : [];
                const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                
                return (
                  <div 
                    key={idx} 
                    className={`min-h-[100px] flex-1 p-1 border-r border-b border-slate-100 relative transition-colors flex flex-col ${day ? 'bg-white hover:bg-slate-50/30' : 'bg-slate-50/20'}`}
                  >
                    {day && (
                      <>
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-[11px] font-black w-5 h-5 flex items-center justify-center rounded-lg transition-all ${isToday ? 'bg-[#FF7F50] text-white shadow-lg shadow-[#FF7F50]/40 rotate-6' : 'text-slate-400'}`}>
                            {day}
                          </span>
                        </div>
                        
                        <div className="space-y-1.5 px-1">
                          {dayEvents.map(event => (
                            <div 
                              key={event.id}
                              onClick={() => openModal(event)}
                              className={`group cursor-pointer px-1.5 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider truncate transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${getTypeColor(event.type)}`}
                              title={event.title}
                            >
                              <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  event.type === 'academic' ? 'bg-blue-400' : 
                                  event.type === 'holiday' ? 'bg-rose-400' : 
                                  event.type === 'exam' ? 'bg-amber-400' : 
                                  event.type === 'attendance-present' ? 'bg-emerald-500' :
                                  event.type === 'attendance-absent' ? 'bg-rose-500' : 'bg-emerald-400'
                                }`}></div>
                                {event.title}
                              </div>
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

          {/* Bottom Section - Condensed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0">
            {/* Upcoming Schedule - Slimmed */}
            <div className="bg-[#FF7F50] rounded-[1.5rem] p-6 text-white shadow-lg shadow-[#FF7F50]/30 relative overflow-hidden group">
              <div className="relative z-10 flex flex-col md:flex-row gap-6">
                <div className="shrink-0">
                  <h3 className="text-lg font-black tracking-tight mb-2 text-white">Next Events</h3>
                  <div className="bg-white/20 px-3 py-1 rounded-lg border border-white/20 text-[8px] font-black uppercase tracking-widest inline-block text-white">
                    Academic Focus
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 flex-1">
                  {events.filter(e => new Date(e.date) >= new Date(2026, 4, 1)).sort((a,b) => a.date.localeCompare(b.date)).slice(0, 4).map(event => (
                    <div key={event.id} className="flex gap-3 group/item cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex flex-col items-center justify-center shrink-0 border border-white/20 group-hover/item:bg-white group-hover/item:text-[#FF7F50] transition-all">
                        <span className="text-[8px] font-black uppercase opacity-90">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-sm font-black leading-none">{new Date(event.date).getDate()}</span>
                      </div>
                      <div className="min-w-0 flex flex-col justify-center">
                        <p className="font-black text-xs truncate text-white group-hover/item:text-white/90">{event.title}</p>
                        <p className="text-[9px] text-white/80 font-bold mt-0.5">{event.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Design Element */}
              <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl transition-all group-hover:bg-white/20 pointer-events-none"></div>
            </div>

            {/* Legend - Inline layout */}
            <div className="bg-white rounded-[1.5rem] border border-slate-200 p-6 shadow-sm flex items-center justify-between">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 flex-1">
                {[
                  { type: 'Academic', color: 'bg-blue-400' },
                  { type: 'Holiday', color: 'bg-rose-400' },
                  { type: 'Exam', color: 'bg-amber-400' },
                  { type: 'Event', color: 'bg-emerald-400' },
                  ...(session?.user.role === 'teacher' ? [
                    { type: 'Present (Faculty)', color: 'bg-emerald-500' },
                    { type: 'Absent (Faculty)', color: 'bg-rose-500' }
                  ] : [])
                ].map(item => (
                  <div key={item.type} className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.color}`}></span>
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{item.type}</span>
                  </div>
                ))}
              </div>
              <div className="hidden sm:flex shrink-0 ml-4 items-center gap-2 text-slate-300 font-black italic text-xs">
                <CalendarIcon size={20} weight="duotone" className="text-[#FF7F50]/40" />
                SNS ACADEMY
              </div>
            </div>
          </div>
        </div>
      </PageSection>

      {/* Admin Modal */}
      <AnimatePresence>
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900">
                {editingEvent ? "Edit Event" : "Create New Event"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all hover:rotate-90">
                <X size={24} weight="bold" />
              </button>
            </div>
            
            <div className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Event Title</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#FF7F50]/10 transition-all"
                  placeholder="E.g. Sports Day"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Date</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#FF7F50]/10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Time</label>
                  <input 
                    type="text" 
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#FF7F50]/10"
                    placeholder="10:00 AM"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Event Category</label>
                <div className="grid grid-cols-2 gap-3">
                  {['academic', 'holiday', 'exam', 'event'].map(type => (
                    <button
                      key={type}
                      onClick={() => setFormData({...formData, type: type as any})}
                      className={`py-3 px-4 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all ${formData.type === type ? 'bg-[#FF7F50] text-white border-[#FF7F50]' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Location</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#FF7F50]/10"
                    placeholder="E.g. Auditorium"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              {editingEvent && (
                <button 
                  onClick={() => handleDelete(editingEvent.id)}
                  className="flex-1 bg-white border border-rose-100 text-rose-500 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-rose-50 transition-colors"
                >
                  Delete
                </button>
              )}
              <button 
                onClick={handleSave}
                className="flex-[2] bg-[#FF7F50] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#FF7F50]/20 hover:bg-[#e66a3e] transition-all transform active:scale-95"
              >
                {editingEvent ? "Update Event" : "Create Event"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </>
  );
}
