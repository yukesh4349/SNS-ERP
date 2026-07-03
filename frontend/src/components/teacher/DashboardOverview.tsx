"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Users, 
  BookOpen, 
  TrendingUp,
  ChevronRight,
  Bell,
  MessageCircle
} from "lucide-react";
import { apiRequest } from "../../../src/services/api-client";

export default function DashboardOverview({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const [attendanceStats, setAttendanceStats] = useState<{ present: number; absent: number } | null>(null);
  const [userStats, setUserStats] = useState<{ totalStudents: number; totalTeachers: number; totalUsers: number; classStudents?: number; isClassTeacher?: boolean; className?: string } | null>(null);
  const [birthdays, setBirthdays] = useState<{ students: any[]; staff: any[] }>({ students: [], staff: [] });
  const [latestNote, setLatestNote] = useState<any>(null);
  const [nextClass, setNextClass] = useState<any>(null);
  const [classAttendance, setClassAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [attendanceRes, usersRes, statsRes, noteRes, nextClassRes, myClassAttendanceRes] = await Promise.all([
          apiRequest<any>('/attendance').catch(() => null),
          apiRequest<any[]>('/users/birthdays').catch(() => []),
          apiRequest<any>('/users/stats').catch(() => null),
          apiRequest<any[]>('/notifications').catch(() => null),
          apiRequest<any>('/timetable/next').catch(() => null),
          apiRequest<any>('/attendance/my-class').catch(() => null)
        ]);

        if (nextClassRes) setNextClass(nextClassRes);
        if (myClassAttendanceRes) setClassAttendance(myClassAttendanceRes);

        if (noteRes && Array.isArray(noteRes) && noteRes.length > 0) {
          setLatestNote(noteRes[0]);
        }

        if (statsRes) {
          setUserStats(statsRes);
        }

        if (attendanceRes?.summary) {
          setAttendanceStats({
            present: attendanceRes.summary.present || 0,
            absent: attendanceRes.summary.onLeave || 0
          });
        }

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentDate = today.getDate();

        const upcomingBirthdays = (usersRes || []).filter(user => {
          const dobString = user.role === 'teacher' ? user.teacherProfile?.dateOfBirth : user.studentProfile?.dob;
          if (!dobString) return false;
          const dob = new Date(dobString);
          if (isNaN(dob.getTime())) return false;
          
          // Check if birthday is within the next 7 days
          const bdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
          const diffTime = bdayThisYear.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          return diffDays >= 0 && diffDays <= 7;
        }).map(user => {
          const dobString = user.role === 'teacher' ? user.teacherProfile?.dateOfBirth : user.studentProfile?.dob;
          const dob = new Date(dobString);
          const bdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
          const diffTime = bdayThisYear.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          let dateStr = "Today";
          if (diffDays === 1) dateStr = "Tomorrow";
          else if (diffDays > 1) {
            const suffix = (d: number) => {
              if (d > 3 && d < 21) return 'th';
              switch (d % 10) {
                case 1:  return "st";
                case 2:  return "nd";
                case 3:  return "rd";
                default: return "th";
              }
            };
            dateStr = dob.toLocaleString('default', { month: 'short' }) + " " + dob.getDate() + suffix(dob.getDate());
          }

          return {
            name: user.name,
            role: user.role,
            desc: user.role === 'teacher' ? (user.teacherProfile?.designation || user.department || "Staff") : `Class ${user.studentProfile?.class || ''}`,
            dateStr,
            diffDays
          };
        }).sort((a, b) => a.diffDays - b.diffDays);

        setBirthdays({
          students: upcomingBirthdays.filter(b => b.role === 'parent' || b.role === 'student'),
          staff: upcomingBirthdays.filter(b => b.role === 'teacher' || b.role === 'admin')
        });
      } catch (err) {
        console.error('Failed to fetch dashboard overview data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);
  return (
    <div className="space-y-10">
      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Mark Attendance", icon: CheckCircle2, color: "#10B981", bg: "rgba(16, 185, 129, 0.1)", desc: "Record student daily presence" },
          { label: "Exam Reports", icon: BookOpen, color: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)", desc: "Update and view student marks" },
          { label: "Send Homework", icon: MessageCircle, color: "#3B82F6", bg: "rgba(59, 130, 246, 0.1)", desc: "Share assignments with students" },
          { label: "Notifications", icon: Bell, color: "#FF7F50", bg: "rgba(255, 127, 80, 0.1)", desc: "View administrative updates" },
        ].map((action, i) => (
          <motion.button
            key={i}
            onClick={() => {
              if (setActiveTab) {
                if (action.label === "Mark Attendance") setActiveTab("attendance");
                if (action.label === "Exam Reports") setActiveTab("results");
                if (action.label === "Send Homework") setActiveTab("communication");
                if (action.label === "Notifications") setActiveTab("notifications");
              }
            }}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-8 rounded-[32px] bg-[var(--bg-secondary)] border border-[var(--border)] shadow-[var(--card-shadow)] hover:border-[var(--accent)] transition-all text-left flex flex-col gap-4 group"
          >
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6"
              style={{ background: action.bg, color: action.color }}
            >
              <action.icon size={28} strokeWidth={3} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[var(--text-primary)] mb-1 tracking-tight">{action.label}</h3>
              <p className="text-sm text-[var(--text-secondary)] font-medium">{action.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Important Note from Admin */}
      {latestNote && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-[40px] bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--accent)] shadow-xl"
        >
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-3xl bg-[var(--accent-glow)] flex items-center justify-center text-[var(--accent)] shrink-0">
              <Bell size={32} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase italic tracking-tight truncate">{latestNote.title}</h3>
                <span className="px-3 py-1 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-widest shrink-0">Urgent</span>
              </div>
              <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                {latestNote.message || latestNote.content}
              </p>
              <div className="mt-6 flex items-center gap-4 text-sm font-bold text-[var(--text-primary)]">
                <div className="w-8 h-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] uppercase">
                  {latestNote.author?.name?.charAt(0) || 'A'}
                </div>
                <span>{latestNote.author?.name || 'Principal\'s Office'} · {new Date(latestNote.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* School-wide Statistics & Birthdays */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Class Attendance Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 rounded-[40px] bg-[var(--bg-secondary)] border border-[var(--border)] shadow-[var(--card-shadow)] flex flex-col justify-between"
        >
          <div>
            <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2 uppercase italic tracking-tight">Class Attendance</h3>
            <p className="text-[var(--text-secondary)] font-medium text-sm mb-8">
              {classAttendance ? `Real-time for Grade ${classAttendance.class}` : 'No class assigned yet'}
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--text-primary)]">
                  {classAttendance ? `Grade ${classAttendance.class}` : '---'}
                </span>
                <span className="text-[var(--accent)] font-black">
                  {classAttendance ? `${classAttendance.percentage}%` : '0%'}
                </span>
              </div>
              <div className="w-full h-3 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--accent)] rounded-full transition-all duration-500" 
                  style={{ width: `${classAttendance?.percentage || 0}%` }} 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="p-4 rounded-3xl bg-[var(--bg-primary)] border border-[var(--border)]">
                  <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase mb-1">Present</p>
                  <p className="text-xl font-black text-[#10B981]">{classAttendance?.present ?? 0}</p>
                </div>
                <div className="p-4 rounded-3xl bg-[var(--bg-primary)] border border-[var(--border)]">
                  <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase mb-1">Absent</p>
                  <p className="text-xl font-black text-[#EF4444]">{classAttendance?.absent ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Birthdays List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 rounded-[40px] bg-[var(--bg-secondary)] border border-[var(--border)] shadow-[var(--card-shadow)] xl:col-span-2"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase italic tracking-tight">Celebrations</h3>
              <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">Birthdays this week</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Student Birthdays */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                  <Users size={18} strokeWidth={3} />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Student Birthdays</h4>
              </div>
              <div className="space-y-4">
                {birthdays.students.length > 0 ? birthdays.students.map((student, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] hover:border-[var(--accent)] transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-white group-hover:scale-110 transition-transform">
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[var(--text-primary)]">{student.name}</p>
                      <p className="text-[10px] font-medium text-[var(--text-secondary)]">{student.desc}</p>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${student.dateStr === 'Today' ? 'bg-orange-500 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                      {student.dateStr}
                    </span>
                  </div>
                )) : (
                  <div className="p-4 text-sm text-[var(--text-secondary)]">No student birthdays this week.</div>
                )}
              </div>
            </div>

            {/* Staff Birthdays */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                  <BookOpen size={18} strokeWidth={3} />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Staff Birthdays</h4>
              </div>
              <div className="space-y-4">
                {birthdays.staff.length > 0 ? birthdays.staff.map((staff, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] hover:border-[var(--accent)] transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-white group-hover:scale-110 transition-transform">
                      {staff.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[var(--text-primary)]">{staff.name}</p>
                      <p className="text-[10px] font-medium text-[var(--text-secondary)]">{staff.desc}</p>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${staff.dateStr === 'Today' ? 'bg-purple-500 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                      {staff.dateStr}
                    </span>
                  </div>
                )) : (
                  <div className="p-4 text-sm text-[var(--text-secondary)]">No staff birthdays this week.</div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Reports Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Class */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-[40px] bg-gradient-to-br from-[#FF6A00] to-[#FF9E22] text-white shadow-2xl shadow-orange-500/20 col-span-1 lg:col-span-2 relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md">
                <Clock size={24} className="text-white" />
              </div>
              <span className="text-sm font-black uppercase tracking-widest">Upcoming Class</span>
            </div>
            
            {nextClass ? (
              <>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4">
                  {nextClass.subject} <span className="text-white/60">—</span> Grade {nextClass.class}{nextClass.section ? nextClass.section : ''}
                </h2>
                
                <div className="flex flex-wrap gap-6 mt-8">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/20">
                    <Calendar size={20} />
                    <span className="font-bold">Today, {nextClass.startTime}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/20">
                    <Users size={20} />
                    <span className="font-bold">Active Class</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-4">
                <h2 className="text-2xl font-bold uppercase italic opacity-80">No more classes scheduled for today</h2>
                <p className="mt-2 font-medium opacity-60">You can relax or prepare for tomorrow's sessions.</p>
              </div>
            )}
          </div>
          
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        </motion.div>

        {/* School Attendance Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-[40px] bg-[var(--bg-secondary)] border border-[var(--border)] shadow-[var(--card-shadow)] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase italic tracking-tight">School Presence</h3>
                <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">Daily Overview (All Grades)</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-[32px] bg-[var(--bg-primary)] border border-[var(--border)] relative overflow-hidden group">
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                  {userStats?.isClassTeacher ? `Class Students (${userStats.className})` : 'Total Students'}
                </p>
                <p className="text-4xl font-black text-[var(--accent)]">
                  {userStats?.isClassTeacher ? userStats.classStudents : (userStats?.totalStudents ?? "...")}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[var(--accent)]">
                  <Users size={14} />
                  <span>{userStats?.isClassTeacher ? 'Assigned' : 'Enrolled'}</span>
                </div>
              </div>
              <div className="p-6 rounded-[32px] bg-[var(--bg-primary)] border border-[var(--border)] relative overflow-hidden group">
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Total Present</p>
                <p className="text-4xl font-black text-[#10B981]">{attendanceStats?.present ?? "0"}</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#10B981]">
                  <TrendingUp size={14} />
                  <span>Live Data</span>
                </div>
              </div>
              <div className="p-6 rounded-[32px] bg-[var(--bg-primary)] border border-[var(--border)] relative overflow-hidden group">
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Total Absent</p>
                <p className="text-4xl font-black text-[#EF4444]">{attendanceStats?.absent ?? "0"}</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#EF4444]">
                  <TrendingUp size={14} className="rotate-180" />
                  <span>Live Data</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
