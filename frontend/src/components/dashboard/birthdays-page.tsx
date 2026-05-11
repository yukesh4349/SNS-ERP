"use client";

import { useState, useEffect } from "react";
import { 
  Cake, 
  Heart, 
  Calendar, 
  Users, 
  MagnifyingGlass,
  Funnel,
  CaretRight,
  Gift,
  Champagne,
  Star,
  Sparkle
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { PageSection } from "./page-section";
import { getAllUsers } from "../../services/users-service";

export function BirthdaysPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'today' | 'upcoming' | 'all'>('today');
  const [category, setCategory] = useState<'student' | 'teacher'>('student');
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data as any[]);
      } catch (err) {
        console.error("Failed to fetch users", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  const getDayOfYear = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const todayDayOfYear = getDayOfYear(today);

  const processDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    // Handle YYYY-MM-DD or DD/MM/YYYY or other formats
    let date: Date;
    if (dateStr.includes('-')) {
      date = new Date(dateStr);
    } else if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      date = new Date(dateStr);
    }
    
    if (isNaN(date.getTime())) return null;
    
    return {
      month: date.getMonth() + 1,
      day: date.getDate(),
      fullDate: date,
      dayOfYear: getDayOfYear(new Date(today.getFullYear(), date.getMonth(), date.getDate()))
    };
  };

  const filteredItems = users.reduce((acc: any[], user: any) => {
    const isStudent = user.role === 'parent';
    const isTeacher = user.role === 'teacher';

    if (category === 'student' && !isStudent) return acc;
    if (category === 'teacher' && !isTeacher) return acc;

    // Check Birthdays
    const dobStr = isStudent ? user.studentProfile?.dob : user.teacherProfile?.dateOfBirth;
    const dob = processDate(dobStr);
    if (dob) {
      acc.push({
        id: user.id,
        name: user.name,
        type: 'birthday',
        date: dob,
        originalDate: dobStr,
        userType: category
      });
    }

    // Check Wedding Anniversaries (only for teachers)
    if (isTeacher && user.teacherProfile?.weddingDate) {
      const wedStr = user.teacherProfile.weddingDate;
      const wed = processDate(wedStr);
      if (wed) {
        acc.push({
          id: `${user.id}-wed`,
          name: user.name,
          type: 'anniversary',
          date: wed,
          originalDate: wedStr,
          userType: 'teacher'
        });
      }
    }

    return acc;
  }, []);

  const sortedItems = filteredItems.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (tab === 'today') {
      return item.date.month === todayMonth && item.date.day === todayDay;
    } else if (tab === 'upcoming') {
      let diff = item.date.dayOfYear - todayDayOfYear;
      // Handle year wrap around
      if (diff < 0) diff += 365;
      return diff > 0 && diff <= 30;
    }
    return true;
  }).sort((a: any, b: any) => {
    let diffA = a.date.dayOfYear - todayDayOfYear;
    if (diffA < 0) diffA += 365;
    let diffB = b.date.dayOfYear - todayDayOfYear;
    if (diffB < 0) diffB += 365;
    return diffA - diffB;
  });

  return (
    <PageSection
      eyebrow="School Celebrations"
      title="Birthdays & Anniversaries"
      description="Celebrate our community members. Track upcoming birthdays for students and staff, and wedding anniversaries for faculty."
    >
      <div className="flex flex-col gap-8">
        
        {/* Header Filters */}
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            {[
              { id: 'student', label: 'Students', icon: <Users size={16} /> },
              { id: 'teacher', label: 'Teachers', icon: <GraduationCap size={16} /> }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id as any)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  category === cat.id 
                    ? "bg-white text-slate-900 shadow-sm border border-slate-100" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            {[
              { id: 'today', label: 'Today' },
              { id: 'upcoming', label: 'Next 30 Days' },
              { id: 'all', label: 'All Year' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  tab === t.id 
                    ? "bg-[#FF7F50] text-white shadow-lg shadow-[#FF7F50]/20" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 w-full lg:max-w-xs">
            <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#FF7F50]/20 transition-all font-medium"
            />
          </div>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
             <div className="w-12 h-12 border-4 border-[#FF7F50] border-t-transparent rounded-full animate-spin" />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading celebrations...</p>
          </div>
        ) : sortedItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] border border-dashed border-slate-200 p-20 text-center flex flex-col items-center gap-4"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
               <Cake size={40} weight="thin" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">No celebrations found</h3>
              <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or search query.</p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {sortedItems.map((item, idx) => (
                <CelebrationCard key={item.id} item={item} today={today} index={idx} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageSection>
  );
}

function CelebrationCard({ item, today, index }: { item: any, today: Date, index: number }) {
  const isToday = item.date.month === (today.getMonth() + 1) && item.date.day === today.getDate();
  const isAnniversary = item.type === 'anniversary';
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.4 }}
      className={`group relative overflow-hidden rounded-[2.5rem] border p-6 transition-all hover:shadow-2xl hover:-translate-y-1 ${
        isToday 
          ? isAnniversary 
            ? "bg-rose-50 border-rose-200" 
            : "bg-orange-50 border-orange-200"
          : "bg-white border-slate-100 shadow-sm hover:border-[#FF7F50]/30"
      }`}
    >
      {/* Background Icon */}
      <div className={`absolute -right-6 -bottom-6 opacity-[0.03] transition-transform duration-700 group-hover:scale-150 group-hover:rotate-12 ${isAnniversary ? "text-rose-500" : "text-orange-500"}`}>
        {isAnniversary ? <Heart size={160} weight="fill" /> : <Cake size={160} weight="fill" />}
      </div>

      <div className="relative flex flex-col h-full">
        <div className="flex items-start justify-between mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
            isToday 
              ? isAnniversary ? "bg-rose-500 text-white shadow-rose-500/30" : "bg-[#FF7F50] text-white shadow-orange-500/30"
              : isAnniversary ? "bg-rose-50 text-rose-500" : "bg-orange-50 text-[#FF7F50]"
          }`}>
            {isAnniversary ? <Heart size={28} weight={isToday ? "fill" : "duotone"} /> : <Cake size={28} weight={isToday ? "fill" : "duotone"} />}
          </div>
          
          {isToday && (
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse ${
              isAnniversary ? "bg-rose-500 text-white" : "bg-[#FF7F50] text-white"
            }`}>
              <Sparkle size={12} weight="fill" />
              Happening Today
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-[#FF7F50] transition-colors">{item.name}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            {item.userType === 'student' ? 'Student' : 'Staff Member'}
            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
            {isAnniversary ? 'Wedding Anniversary' : 'Birthday Celebration'}
          </p>
        </div>

        <div className="mt-8 flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Month</span>
            <span className={`text-xl font-black ${isToday ? "text-slate-900" : "text-slate-700"}`}>{monthNames[item.date.month - 1]}</span>
          </div>
          <div className="w-px h-8 bg-slate-100"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</span>
            <span className={`text-xl font-black ${isToday ? "text-slate-900" : "text-slate-700"}`}>{item.date.day.toString().padStart(2, '0')}</span>
          </div>
          
          {!isToday && (
            <div className="ml-auto">
               <button className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:bg-[#FF7F50] hover:text-white transition-all">
                  <Gift size={20} weight="duotone" />
               </button>
            </div>
          )}
        </div>

        {isToday && (
          <div className="mt-8 pt-6 border-t border-black/5 flex gap-2">
            <button className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 ${
              isAnniversary 
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" 
                : "bg-[#FF7F50] text-white shadow-lg shadow-orange-500/20"
            }`}>
              {isAnniversary ? <Champagne size={16} /> : <Gift size={16} />}
              Send Wishes
            </button>
            <button className="p-3 rounded-xl bg-white/50 text-slate-600 hover:bg-white transition-colors">
              <Star size={16} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function GraduationCap(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={props.size || 24} 
      height={props.size || 24} 
      viewBox="0 0 256 256" 
      fill="currentColor"
    >
      <path d="M224,104v64a8,8,0,0,1-16,0V113.11l-15.52,7.76a8,8,0,0,1-7.15,0l-53.13-26.57a4,4,0,0,0-3.58,0l-53.13,26.57a8,8,0,0,1-7.15,0L16.27,91a8,8,0,0,1,0-14.31l104.58-52.29a16,16,0,0,1,14.3,0L239.73,76.69A8,8,0,0,1,224,104ZM128,152a8,8,0,0,0-3.58.85L71.29,179.42a4,4,0,0,1-3.58,0L32,161.57V176a32,32,0,0,0,32,32h128a32,32,0,0,0,32-32V161.57l-35.71,17.85a4,4,0,0,1-3.58,0l-53.13-26.57A8,8,0,0,0,128,152Z" />
    </svg>
  );
}
