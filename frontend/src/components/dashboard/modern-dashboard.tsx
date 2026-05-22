"use client";

import { useState } from "react";

/* ── Color tokens ─────────────────────────────────────────────── */
const ACCENT = "#FF7F50";
const GOOD   = "#1D7A3C";
const WARN   = "#D97706";
const BAD    = "#B83E2C";
const INK    = "#1A1917";
const MUTED  = "#6B6963";
const MUTED2 = "#94938D";
const LINE   = "#ECEAE4";
const SURF   = "#FAFAF8";
const SURF2  = "#F0EFEB";

/* ── Sparkline ───────────────────────────────────────────────── */
function Sparkline({ values, color = ACCENT, w = 80, h = 26 }: {
  values: number[]; color?: string; w?: number; h?: number;
}) {
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => [i * step, h - ((v - min) / span) * (h - 5) - 2] as [number, number]);
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} preserveAspectRatio="none" style={{ display: "block" }}>
      <path d={area} fill={color} opacity="0.12" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />
    </svg>
  );
}

/* ── Area chart ──────────────────────────────────────────────── */
function AreaChart({ months, students, staff }: { months: string[]; students: number[]; staff: number[] }) {
  const W = 640, H = 180, pL = 36, pR = 10, pT = 12, pB = 24;
  const iW = W - pL - pR, iH = H - pT - pB;
  const allMax = Math.max(...students) * 1.18;
  const xOf = (i: number) => pL + (i / (months.length - 1)) * iW;
  const yOf = (v: number) => pT + iH - (v / allMax) * iH;
  const linePath = (arr: number[]) =>
    arr.map((v, i) => (i === 0 ? `M${xOf(i)},${yOf(v)}` : `L${xOf(i)},${yOf(v)}`)).join(" ");
  const areaPath = (arr: number[]) =>
    `${linePath(arr)} L${xOf(arr.length - 1)},${pT + iH} L${xOf(0)},${pT + iH} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(allMax * t));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="md-ga" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.22" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={pL} x2={W - pR} y1={yOf(v)} y2={yOf(v)} stroke={LINE} strokeWidth="1" />
          <text x={pL - 6} y={yOf(v) + 3} fontSize="9" fill={MUTED2} textAnchor="end" fontFamily="monospace">{v}</text>
        </g>
      ))}
      {months.map((m, i) => (
        <text key={i} x={xOf(i)} y={H - 6} fontSize="9" fill={MUTED2} textAnchor="middle" fontFamily="monospace">{m}</text>
      ))}
      <path d={linePath(staff.map(s => s * 8))} stroke={INK} strokeWidth="1.2" fill="none" strokeDasharray="3 3" strokeLinecap="round" />
      <path d={areaPath(students)} fill="url(#md-ga)" />
      <path d={linePath(students)} stroke={ACCENT} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {students.map((v, i) => (
        <circle key={i} cx={xOf(i)} cy={yOf(v)} r={i === students.length - 1 ? 3.5 : 2}
          fill="#fff" stroke={ACCENT} strokeWidth="1.6" />
      ))}
    </svg>
  );
}

/* ── Static data ─────────────────────────────────────────────── */
const KPI_DATA = [
  { label: "Total Students", tag: "Enrolled", value: "1,284", delta: 4.2,  trend: "up",  spark: [980,1020,1050,1030,1080,1100,1150,1180,1200,1220,1260,1284] },
  { label: "Total Staff",    tag: "Faculty",  value: "86",    delta: 1.1,  trend: "up",  spark: [78,79,80,80,81,82,83,83,84,85,85,86] },
  { label: "Fee Collected",  tag: "Q2",       value: "₹38.4L",delta: 12.4, trend: "up",  spark: [28,30,31,29,33,34,35,34,36,37,38,38.4] },
  { label: "New This Week",  tag: "Live",     value: "12",    delta: 33.0, trend: "up",  spark: [4,6,5,8,7,9,10,8,11,9,10,12] },
];

const CHART = {
  months:   ["Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May"],
  students: [980,1010,1040,1030,1080,1100,1150,1170,1200,1230,1260,1284],
  staff:    [78,79,80,80,81,82,83,83,84,85,85,86],
};

const QUICK_ACTIONS = [
  { label: "Add Student",     desc: "New enrollment",      icon: "👤", color: ACCENT    },
  { label: "Manage Users",    desc: "Roles & access",      icon: "👥", color: "#2B5FB2" },
  { label: "Post Notice",     desc: "School-wide alert",   icon: "📢", color: GOOD      },
  { label: "Publish Results", desc: "Term scorecards",     icon: "🎓", color: "#7A4DD2" },
  { label: "Generate Report", desc: "Attendance, fees…",   icon: "📄", color: WARN      },
  { label: "Open Inbox",      desc: "3 unread threads",    icon: "💬", color: "#0E8FB8" },
];

const REGISTRATIONS = [
  { init:"YK", name:"Yukesh Kanna",      type:"Student", klass:"Grade 11 — A", status:"new",      when:"02:49 PM",   bg:"#7C3AED" },
  { init:"SR", name:"Sangeeth R",        type:"Student", klass:"Grade 9 — C",  status:"verify",   when:"Yesterday",  bg:"#1D4ED8" },
  { init:"DD", name:"Dharshaneshwarn D", type:"Student", klass:"Grade 8 — B",  status:"new",      when:"3 days ago", bg:"#065F46" },
  { init:"PM", name:"Priyadharshini M",  type:"Staff",   klass:"Mathematics",  status:"verify",   when:"3 days ago", bg:"#9D174D" },
  { init:"AM", name:"Arjun Master",      type:"Student", klass:"Grade 12 — A", status:"approved", when:"4 days ago", bg:"#92400E" },
  { init:"KV", name:"Karthick V",        type:"Student", klass:"Grade 6 — D",  status:"approved", when:"5 days ago", bg:"#1E3A5F" },
];

const STATUS: Record<string, { bg: string; color: string; label: string }> = {
  new:      { bg: "#FFF4EE", color: ACCENT, label: "New"      },
  verify:   { bg: "#FFFBEB", color: WARN,   label: "Verify"   },
  approved: { bg: "#F0FDF4", color: GOOD,   label: "Approved" },
};

const TIMETABLE = [
  { time:"09:00", title:"Grade 11 — Physics",  sub:"Mr. Ramesh · Lab 2",    color: ACCENT    },
  { time:"10:30", title:"Grade 9 — English",   sub:"Ms. Anitha · Room 14",  color: "#2B5FB2" },
  { time:"12:15", title:"Staff Standup",        sub:"Conf Room A · 30 min",  color: GOOD      },
  { time:"14:00", title:"Grade 12 — Calculus", sub:"Mr. Iyer · Room 22",    color: "#7A4DD2" },
];

const NOTIFICATIONS = [
  { title:"Fee deadline approaching",    sub:"32 students with pending dues", time:"2m",  dot: WARN   },
  { title:"Term marks uploaded",         sub:"Grade 10 — Sciences batch",     time:"18m", dot:"#2B5FB2"},
  { title:"Leave request — Ms. Kavya",  sub:"Apr 14 — Apr 16 · Casual",      time:"1h",  dot: ACCENT },
  { title:"3 profile change requests",  sub:"Awaiting admin review",          time:"3h",  dot: BAD    },
  { title:"Library — 12 overdue books", sub:"Auto-reminders sent",            time:"6h",  dot: MUTED  },
];

const BIRTHDAYS = [
  { init:"LP", name:"Lakshmi P.",  role:"Grade 7 — Student", date:"Today",    bg:"#7C3AED" },
  { init:"MS", name:"Mr. Suresh", role:"History faculty",   date:"Tomorrow", bg:"#1D4ED8" },
  { init:"RK", name:"Ravi Kumar", role:"Grade 9 — Student", date:"May 12",   bg:"#065F46" },
];

const APPROVALS = [
  { kind:"Leave",     who:"Ms. Kavya R.",     meta:"3 days · Casual",      p:"high" },
  { kind:"Profile",   who:"Arjun Master",     meta:"Phone & address",      p:"med"  },
  { kind:"Admission", who:"Pranav S.",         meta:"Grade 10 — Transfer",  p:"high" },
  { kind:"Refund",    who:"Mrs. Iyer (parent)",meta:"₹4,200 · Bus fee",    p:"low"  },
];
const PRIO: Record<string, string> = { high: BAD, med: WARN, low: MUTED2 };

/* ── Card shell ──────────────────────────────────────────────── */
const card: React.CSSProperties = {
  background: "#fff", borderRadius: 14, border: `1px solid ${LINE}`, overflow: "hidden",
};
const cardPad: React.CSSProperties = { padding: "18px 20px" };
const cardHead: React.CSSProperties = {
  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
  padding: "16px 20px 12px",
};
const cardTitle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: INK };
const cardSub: React.CSSProperties   = { fontSize: 11, color: MUTED, marginTop: 2 };
const linkBtn: React.CSSProperties   = {
  fontSize: 11, fontWeight: 600, color: ACCENT, background: "none", border: "none",
  cursor: "pointer", display: "flex", alignItems: "center", gap: 3, padding: 0,
};
const mutedBtn: React.CSSProperties  = { ...linkBtn, color: MUTED };

/* ── Triangle arrows (avoid phosphor import churn) ───────────── */
function ArrowUp() {
  return <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 1.5L9 8H1Z" fill="currentColor"/></svg>;
}
function ArrowDn() {
  return <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 8.5L1 2H9Z" fill="currentColor"/></svg>;
}

/* ══════════════════════════════════════════════════════════════ */
export function ModernDashboard() {
  const [period, setPeriod] = useState<"7D"|"30D"|"12M">("12M");

  return (
    <div className="bg-[#FAF9F6] min-h-full font-['Inter',system-ui,sans-serif] color-[#1A1917] text-[13px]">
      <div className="max-w-[1360px] mx-auto px-4 py-6 sm:px-7 sm:py-8 lg:pb-16">

        {/* ── Page header ───────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1A1917] leading-tight">
              Control Center
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1D7A3C]" />
              <span className="text-[11px] text-[#6B6963] font-medium">
                Real-time snapshot · last sync <span className="font-mono">14:52</span> IST
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {/* period selector */}
            <div className="flex border border-[#ECEAE4] rounded-lg overflow-hidden bg-white">
              {(["7D","30D","12M"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)} className={`
                  px-3 py-1.5 text-[11px] font-bold transition-all
                  ${period === p ? 'bg-[#1A1917] text-white' : 'bg-transparent text-[#6B6963]'}
                `}>{p}</button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold border border-[#ECEAE4] rounded-lg bg-white text-[#6B6963]">
              📅 May 2026
            </button>
          </div>
        </div>

        {/* ── KPI strip ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {KPI_DATA.map((k, i) => (
            <div key={i} style={card} className="p-4 sm:p-4.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#94938D] uppercase tracking-widest">{k.label}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-[#F0EFEB] text-[#6B6963]">{k.tag}</span>
              </div>
              <div className="text-2xl font-semibold tracking-tight tabular-nums text-[#1A1917]">{k.value}</div>
              <div className="flex items-center justify-between mt-auto">
                <span className={`flex items-center gap-1 text-[11px] font-bold ${k.trend==="up" ? 'text-[#1D7A3C]' : 'text-[#B83E2C]'}`}>
                  {k.trend==="up" ? <ArrowUp/> : <ArrowDn/>} {k.delta.toFixed(1)}%
                </span>
                <Sparkline values={k.spark} color={k.trend==="up" ? GOOD : BAD}/>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main 2-col grid ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 sm:gap-6 items-start">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-4 sm:gap-6 min-w-0">

            {/* Enrollment chart */}
            <div style={card}>
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div style={cardTitle}>Enrollment Activity</div>
                  <div style={cardSub}>Students vs. staff over the last 12 months</div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-[11px] text-[#6B6963]">
                      <span className="w-3 h-1 bg-[#FF7F50] rounded-sm" /> Students
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-[#6B6963]">
                      <span className="w-3 border-t-2 border-dashed border-[#1A1917]" /> Staff
                    </span>
                  </div>
                  <button className="text-[#94938D] text-lg leading-none p-0">⋯</button>
                </div>
              </div>
              <div className="px-3 pb-4 sm:px-6 sm:pb-6 overflow-hidden">
                <AreaChart months={CHART.months} students={CHART.students} staff={CHART.staff}/>
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ ...card, ...cardPad }}>
              <div className="mb-4">
                <div style={cardTitle}>Quick Actions</div>
                <div style={cardSub}>
                  Common admin tasks · shortcuts in{" "}
                  <code className="bg-[#F0EFEB] px-1.5 py-0.5 rounded-md text-[10px] font-bold border border-[#ECEAE4]">⌘K</code>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                {QUICK_ACTIONS.map((qa, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-[#ECEAE4] cursor-pointer hover:shadow-lg hover:shadow-black/5 transition-all bg-white"
                  >
                    <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-base" style={{ background: `${qa.color}14`, border: `1px solid ${qa.color}28` }}>{qa.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-bold text-[#1A1917] truncate">{qa.label}</div>
                      <div className="text-[10px] text-[#6B6963] mt-0.5 truncate">{qa.desc}</div>
                    </div>
                    <span className="text-[#ECEAE4] text-lg shrink-0">›</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Registrations table */}
            <div style={card} className="overflow-hidden">
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div style={cardTitle}>Recent Registrations</div>
                  <div style={cardSub}>12 added this week · 4 awaiting verification</div>
                </div>
                <div className="flex items-center gap-4">
                  <button style={mutedBtn}>⛛ Filter</button>
                  <button style={linkBtn}>View all ›</button>
                </div>
              </div>
              <div className="overflow-x-auto hide-scrollbar">
                <table className="w-full border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-y border-[#ECEAE4] bg-[#FAFAF8]">
                      {["Person","Type","Class / Dept.","Status","Submitted"].map((h, i) => (
                        <th key={h} className={`px-5 py-2.5 text-left text-[9px] font-bold text-[#94938D] uppercase tracking-widest ${i===4 ? 'text-right' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECEAE4]">
                    {REGISTRATIONS.map((r, i) => {
                      const s = STATUS[r.status];
                      return (
                        <tr key={i} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white" style={{ background: r.bg }}>{r.init}</div>
                              <div className="min-w-0">
                                <div className="text-[12px] font-bold text-[#1A1917] truncate">{r.name}</div>
                                <div className="text-[10px] text-[#94938D] font-mono">SNS-{2026000 + i * 7}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-[12px] text-[#6B6963]">{r.type}</td>
                          <td className="px-5 py-3 text-[12px] text-[#6B6963]">{r.klass}</td>
                          <td className="px-5 py-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                          </td>
                          <td className="px-5 py-3 text-right text-[11px] text-[#94938D] font-mono">{r.when}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="flex flex-col gap-4 sm:gap-6 min-w-0">

            {/* Today's schedule */}
            <div style={{ ...card, ...cardPad }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div style={cardTitle}>Today · May 9</div>
                  <div style={cardSub}>4 sessions scheduled</div>
                </div>
                <button style={linkBtn}>Full timetable ›</button>
              </div>
              <div className="divide-y divide-[#ECEAE4]">
                {TIMETABLE.map((tt, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <div className="text-[10px] font-bold text-[#94938D] font-mono w-10 shrink-0">{tt.time}</div>
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="w-0.5 h-8 rounded-full shrink-0" style={{ background: tt.color }}/>
                      <div className="min-w-0">
                        <div className="text-[12px] font-bold text-[#1A1917] truncate">{tt.title}</div>
                        <div className="text-[10px] text-[#6B6963] mt-1 truncate">{tt.sub}</div>
                      </div>
                    </div>
                    <button className="text-[#94938D] text-lg p-0">⋯</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div style={{ ...card, ...cardPad }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div style={cardTitle}>Notifications</div>
                  <div style={cardSub}>17 unread · auto-marked after 24h</div>
                </div>
                <button style={mutedBtn}>Mark all read</button>
              </div>
              <div className="divide-y divide-[#ECEAE4]">
                {NOTIFICATIONS.map((n, i) => (
                  <div key={i} className="flex items-start gap-3 py-3">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: n.dot }}/>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-bold text-[#1A1917] leading-snug">{n.title}</div>
                      <div className="text-[10px] text-[#6B6963] mt-1 line-clamp-2">{n.sub}</div>
                    </div>
                    <span className="text-[10px] text-[#94938D] font-mono shrink-0">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Birthdays */}
            <div style={{ ...card, ...cardPad }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div style={cardTitle}>Upcoming Birthdays</div>
                  <div style={cardSub}>Send a school-wide note</div>
                </div>
                <button className="text-lg">🎂</button>
              </div>
              <div className="divide-y divide-[#ECEAE4]">
                {BIRTHDAYS.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white" style={{ background: b.bg }}>{b.init}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-bold text-[#1A1917] truncate">{b.name}</div>
                      <div className="text-[10px] text-[#6B6963] mt-0.5 truncate">{b.role}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF4EE] text-[#FF7F50] shrink-0">{b.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer 3-col row ──────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">

          {/* Pending Approvals */}
          <div style={{ ...card, ...cardPad }}>
            <div className="flex items-center justify-between mb-4">
              <div style={cardTitle}>Pending Approvals</div>
              <button style={linkBtn}>View queue ›</button>
            </div>
            <div className="divide-y divide-[#ECEAE4]">
              {APPROVALS.map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRIO[a.p] }}/>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold text-[#1A1917] truncate">{a.kind} — <span className="font-normal">{a.who}</span></div>
                    <div className="text-[10px] text-[#6B6963] mt-0.5 truncate">{a.meta}</div>
                  </div>
                  <button className="px-3 py-1 text-[11px] font-bold border border-[#ECEAE4] rounded-md bg-white text-[#6B6963]">Review</button>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance */}
          <div style={{ ...card, ...cardPad }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div style={cardTitle}>Attendance — Today</div>
                <div style={cardSub}>All grades, taken at 09:15</div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F0FDF4] text-[#1D7A3C]">94% present</span>
            </div>
            <div className="flex items-end gap-1 height-16">
              {[88,92,96,90,94,97,91,89,93,95,92,94].map((v, i) => (
                <div key={i} className="flex-1 rounded-t-sm opacity-85 transition-all hover:opacity-100" style={{ height: `${v}%`, background: v>=94 ? GOOD : v>=90 ? ACCENT : WARN }}/>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[9px] text-[#94938D] font-mono">
              {["1","3","5","7","9","11"].map(n => <span key={n}>{n}</span>)}
            </div>
            <div className="flex justify-between mt-4">
              {[["Present","1,207"],["Absent","52"],["Late","25"]].map(([l, v]) => (
                <div key={l}>
                  <div className="text-[10px] text-[#6B6963]">{l}</div>
                  <div className="text-[16px] font-bold tabular-nums text-[#1A1917] mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Fee collection */}
          <div style={{ ...card, ...cardPad }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div style={cardTitle}>Fee Collection — Q2</div>
                <div style={cardSub}>Apr 1 → Jun 30</div>
              </div>
              <button style={linkBtn}>Details</button>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl font-bold tracking-tight tabular-nums">₹38.4L</span>
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-[#1D7A3C]">
                <ArrowUp/> 12.4%
              </span>
              <span className="text-[10px] text-[#94938D] font-mono">of ₹52L target</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#F0EFEB] border border-[#ECEAE4] overflow-hidden flex">
              <div className="h-full bg-[#1D7A3C]" style={{ width: "58%" }}/>
              <div className="h-full bg-[#FF7F50] opacity-85" style={{ width: "16%" }}/>
              <div className="h-full bg-[#D97706]" style={{ width: "7%" }}/>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-[11px]">
              {[{l:"Paid",pct:"58%",c:GOOD},{l:"Partial",pct:"16%",c:ACCENT},{l:"Overdue",pct:"7%",c:WARN}].map(f => (
                <span key={f.l} className="flex items-center gap-1.5 text-[#6B6963]">
                  <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ background: f.c }}/> {f.l} <b className="text-[#1A1917] tabular-nums">{f.pct}</b>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
