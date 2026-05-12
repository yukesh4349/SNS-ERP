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
    <div style={{ background: SURF, minHeight: "100%", fontFamily: "Inter, system-ui, sans-serif", color: INK, fontSize: 13 }}>
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "26px 28px 60px" }}>

        {/* ── Page header ───────────────────────────────────── */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom: 22, gap: 16, flexWrap:"wrap" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: INK, margin: 0, lineHeight: 1.25 }}>
              Control Center
            </h1>
            <div style={{ display:"flex", alignItems:"center", gap: 7, marginTop: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius:"50%", background: GOOD, display:"inline-block" }}/>
              <span style={{ fontSize: 11, color: MUTED, fontWeight: 500 }}>
                Real-time snapshot · last sync <span style={{ fontFamily:"monospace" }}>14:52</span> IST
              </span>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
            {/* period selector */}
            <div style={{ display:"flex", border:`1px solid ${LINE}`, borderRadius: 8, overflow:"hidden", background:"#fff" }}>
              {(["7D","30D","12M"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{
                  padding:"5px 13px", fontSize: 11, fontWeight: 700,
                  background: period === p ? INK : "transparent",
                  color: period === p ? "#fff" : MUTED,
                  border:"none", cursor:"pointer", letterSpacing:"0.04em", transition:"all .15s",
                }}>{p}</button>
              ))}
            </div>
            <button style={{ display:"flex", alignItems:"center", gap: 6, padding:"5px 13px", fontSize: 11, fontWeight: 600, border:`1px solid ${LINE}`, borderRadius: 8, background:"#fff", color: MUTED, cursor:"pointer" }}>
              📅 May 2026
            </button>
          </div>
        </div>

        {/* ── KPI strip ─────────────────────────────────────── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
          {KPI_DATA.map((k, i) => (
            <div key={i} style={{ ...card, padding:"16px 18px", display:"flex", flexDirection:"column", gap: 10 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: MUTED2, textTransform:"uppercase", letterSpacing:"0.1em" }}>{k.label}</span>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform:"uppercase", letterSpacing:"0.08em", padding:"2px 7px", borderRadius: 5, background: SURF2, color: MUTED }}>{k.tag}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 600, letterSpacing:"-0.03em", fontVariantNumeric:"tabular-nums", color: INK }}>{k.value}</div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ display:"flex", alignItems:"center", gap: 3, fontSize: 11, fontWeight: 700, color: k.trend==="up" ? GOOD : BAD }}>
                  {k.trend==="up" ? <ArrowUp/> : <ArrowDn/>} {k.delta.toFixed(1)}%
                </span>
                <Sparkline values={k.spark} color={k.trend==="up" ? GOOD : BAD}/>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main 2-col grid ───────────────────────────────── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap: 14, alignItems:"start" }}>

          {/* ── Left column ── */}
          <div style={{ display:"flex", flexDirection:"column", gap: 14, minWidth: 0 }}>

            {/* Enrollment chart */}
            <div style={card}>
              <div style={cardHead}>
                <div>
                  <div style={cardTitle}>Enrollment Activity</div>
                  <div style={cardSub}>Students vs. staff over the last 12 months</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap: 14 }}>
                  <div style={{ display:"flex", alignItems:"center", gap: 12 }}>
                    <span style={{ display:"flex", alignItems:"center", gap: 5, fontSize: 11, color: MUTED }}>
                      <span style={{ width: 12, height: 3, background: ACCENT, borderRadius: 2, display:"inline-block" }}/> Students
                    </span>
                    <span style={{ display:"flex", alignItems:"center", gap: 5, fontSize: 11, color: MUTED }}>
                      <span style={{ width: 12, height: 0, borderTop:`2px dashed ${INK}`, display:"inline-block" }}/> Staff
                    </span>
                  </div>
                  <button style={{ background:"none", border:"none", color: MUTED2, cursor:"pointer", fontSize: 18, lineHeight: 1, padding: 0 }}>⋯</button>
                </div>
              </div>
              <div style={{ padding:"4px 12px 14px" }}>
                <AreaChart months={CHART.months} students={CHART.students} staff={CHART.staff}/>
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ ...card, ...cardPad }}>
              <div style={{ marginBottom: 12 }}>
                <div style={cardTitle}>Quick Actions</div>
                <div style={cardSub}>
                  Common admin tasks · shortcuts in{" "}
                  <code style={{ background: SURF2, padding:"1px 5px", borderRadius: 4, fontSize: 10, fontWeight: 700, border:`1px solid ${LINE}` }}>⌘K</code>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap: 8 }}>
                {QUICK_ACTIONS.map((qa, i) => (
                  <div key={i} style={{
                    display:"flex", alignItems:"center", gap: 10,
                    padding:"10px 12px", borderRadius: 10, border:`1px solid ${LINE}`,
                    cursor:"pointer", transition:"box-shadow .15s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 3px 12px rgba(0,0,0,0.07)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "")}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0, fontSize: 15,
                      background:`${qa.color}14`, border:`1px solid ${qa.color}28`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}>{qa.icon}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: INK, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{qa.label}</div>
                      <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>{qa.desc}</div>
                    </div>
                    <span style={{ marginLeft:"auto", color: LINE, fontSize: 16, flexShrink: 0 }}>›</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Registrations table */}
            <div style={card}>
              <div style={cardHead}>
                <div>
                  <div style={cardTitle}>Recent Registrations</div>
                  <div style={cardSub}>12 added this week · 4 awaiting verification</div>
                </div>
                <div style={{ display:"flex", gap: 12 }}>
                  <button style={mutedBtn}>⛛ Filter</button>
                  <button style={linkBtn}>View all ›</button>
                </div>
              </div>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderTop:`1px solid ${LINE}`, borderBottom:`1px solid ${LINE}`, background: SURF }}>
                    {["Person","Type","Class / Dept.","Status","Submitted"].map((h, i) => (
                      <th key={h} style={{ padding:"8px 20px", textAlign: i===4 ? "right" : "left", fontSize: 9, fontWeight: 700, color: MUTED2, textTransform:"uppercase", letterSpacing:"0.08em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REGISTRATIONS.map((r, i) => {
                    const s = STATUS[r.status];
                    return (
                      <tr key={i} style={{ borderBottom: i < REGISTRATIONS.length-1 ? `1px solid ${LINE}` : "none" }}
                        onMouseEnter={e => (e.currentTarget.style.background = SURF)}
                        onMouseLeave={e => (e.currentTarget.style.background = "")}
                      >
                        <td style={{ padding:"10px 20px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius:"50%", background: r.bg, color:"#fff", fontWeight: 700, fontSize: 10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink: 0 }}>{r.init}</div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: INK }}>{r.name}</div>
                              <div style={{ fontSize: 10, color: MUTED2, fontFamily:"monospace" }}>SNS-{2026000 + i * 7}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"10px 20px", fontSize: 12, color: MUTED }}>{r.type}</td>
                        <td style={{ padding:"10px 20px", fontSize: 12, color: MUTED }}>{r.klass}</td>
                        <td style={{ padding:"10px 20px" }}>
                          <span style={{ padding:"3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                        </td>
                        <td style={{ padding:"10px 20px", textAlign:"right", fontSize: 11, color: MUTED2, fontFamily:"monospace" }}>{r.when}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Right column ── */}
          <div style={{ display:"flex", flexDirection:"column", gap: 14, minWidth: 0 }}>

            {/* Today's schedule */}
            <div style={{ ...card, ...cardPad }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom: 14 }}>
                <div>
                  <div style={cardTitle}>Today · May 9</div>
                  <div style={cardSub}>4 sessions scheduled</div>
                </div>
                <button style={linkBtn}>Full timetable ›</button>
              </div>
              {TIMETABLE.map((tt, i) => (
                <div key={i} style={{
                  display:"flex", alignItems:"center", gap: 12,
                  padding:"10px 0", borderBottom: i < TIMETABLE.length-1 ? `1px solid ${LINE}` : "none",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: MUTED2, fontFamily:"monospace", width: 38, flexShrink: 0 }}>{tt.time}</div>
                  <div style={{ display:"flex", alignItems:"center", gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 3, height: 34, borderRadius: 2, background: tt.color, flexShrink: 0 }}/>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: INK, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{tt.title}</div>
                      <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{tt.sub}</div>
                    </div>
                  </div>
                  <button style={{ background:"none", border:"none", color: MUTED2, cursor:"pointer", fontSize: 16, padding: 0 }}>⋯</button>
                </div>
              ))}
            </div>

            {/* Notifications */}
            <div style={{ ...card, ...cardPad }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom: 12 }}>
                <div>
                  <div style={cardTitle}>Notifications</div>
                  <div style={cardSub}>17 unread · auto-marked after 24h</div>
                </div>
                <button style={mutedBtn}>Mark all read</button>
              </div>
              {NOTIFICATIONS.map((n, i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap: 10, padding:"9px 0", borderBottom: i < NOTIFICATIONS.length-1 ? `1px solid ${LINE}` : "none" }}>
                  <span style={{ width: 7, height: 7, borderRadius:"50%", background: n.dot, flexShrink: 0, marginTop: 4 }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: INK }}>{n.title}</div>
                    <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{n.sub}</div>
                  </div>
                  <span style={{ fontSize: 10, color: MUTED2, fontFamily:"monospace", flexShrink: 0 }}>{n.time}</span>
                </div>
              ))}
            </div>

            {/* Birthdays */}
            <div style={{ ...card, ...cardPad }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom: 12 }}>
                <div>
                  <div style={cardTitle}>Upcoming Birthdays</div>
                  <div style={cardSub}>Send a school-wide note</div>
                </div>
                <button style={{ background:"none", border:"none", cursor:"pointer", fontSize: 15 }}>🎂</button>
              </div>
              {BIRTHDAYS.map((b, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap: 10, padding:"9px 0", borderBottom: i < BIRTHDAYS.length-1 ? `1px solid ${LINE}` : "none" }}>
                  <div style={{ width: 30, height: 30, borderRadius:"50%", background: b.bg, color:"#fff", fontWeight: 700, fontSize: 10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink: 0 }}>{b.init}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: INK }}>{b.name}</div>
                    <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{b.role}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding:"2px 9px", borderRadius: 20, background:"#FFF4EE", color: ACCENT }}>{b.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer 3-col row ──────────────────────────────── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap: 14, marginTop: 14 }}>

          {/* Pending Approvals */}
          <div style={{ ...card, ...cardPad }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 12 }}>
              <div style={cardTitle}>Pending Approvals</div>
              <button style={linkBtn}>View queue ›</button>
            </div>
            {APPROVALS.map((a, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap: 10, padding:"9px 0", borderBottom: i < APPROVALS.length-1 ? `1px solid ${LINE}` : "none" }}>
                <span style={{ width: 7, height: 7, borderRadius:"50%", background: PRIO[a.p], flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: INK }}>{a.kind} — <span style={{ fontWeight: 400 }}>{a.who}</span></div>
                  <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{a.meta}</div>
                </div>
                <button style={{ padding:"4px 10px", fontSize: 11, fontWeight: 600, border:`1px solid ${LINE}`, borderRadius: 6, background:"#fff", color: MUTED, cursor:"pointer" }}>Review</button>
              </div>
            ))}
          </div>

          {/* Attendance */}
          <div style={{ ...card, ...cardPad }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 14 }}>
              <div>
                <div style={cardTitle}>Attendance — Today</div>
                <div style={cardSub}>All grades, taken at 09:15</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding:"3px 10px", borderRadius: 20, background:"#F0FDF4", color: GOOD }}>94% present</span>
            </div>
            <div style={{ display:"flex", alignItems:"flex-end", gap: 4, height: 72 }}>
              {[88,92,96,90,94,97,91,89,93,95,92,94].map((v, i) => (
                <div key={i} style={{ flex: 1, height:`${v}%`, background: v>=94 ? GOOD : v>=90 ? ACCENT : WARN, borderRadius:"3px 3px 0 0", opacity: 0.85 }}/>
              ))}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop: 5, fontSize: 9, color: MUTED2, fontFamily:"monospace" }}>
              {["1","3","5","7","9","11"].map(n => <span key={n}>{n}</span>)}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop: 12 }}>
              {[["Present","1,207"],["Absent","52"],["Late","25"]].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 10, color: MUTED }}>{l}</div>
                  <div style={{ fontSize: 18, fontWeight: 500, fontVariantNumeric:"tabular-nums", color: INK, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Fee collection */}
          <div style={{ ...card, ...cardPad }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 12 }}>
              <div>
                <div style={cardTitle}>Fee Collection — Q2</div>
                <div style={cardSub}>Apr 1 → Jun 30</div>
              </div>
              <button style={linkBtn}>Details</button>
            </div>
            <div style={{ display:"flex", alignItems:"baseline", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 26, fontWeight: 600, letterSpacing:"-0.02em", fontVariantNumeric:"tabular-nums" }}>₹38.4L</span>
              <span style={{ display:"flex", alignItems:"center", gap: 2, fontSize: 11, fontWeight: 700, color: GOOD }}>
                <ArrowUp/> 12.4%
              </span>
              <span style={{ fontSize: 10, color: MUTED2, fontFamily:"monospace" }}>of ₹52L target</span>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: SURF2, border:`1px solid ${LINE}`, overflow:"hidden", display:"flex" }}>
              <div style={{ width:"58%", background: GOOD }}/>
              <div style={{ width:"16%", background: ACCENT, opacity: 0.85 }}/>
              <div style={{ width:"7%",  background: WARN }}/>
            </div>
            <div style={{ display:"flex", gap: 14, marginTop: 12, fontSize: 11, flexWrap:"wrap" }}>
              {[{l:"Paid",pct:"58%",c:GOOD},{l:"Partial",pct:"16%",c:ACCENT},{l:"Overdue",pct:"7%",c:WARN}].map(f => (
                <span key={f.l} style={{ display:"flex", alignItems:"center", gap: 5, color: MUTED }}>
                  <span style={{ width: 7, height: 7, background: f.c, borderRadius: 2, display:"inline-block" }}/> {f.l} <b style={{ color: INK, fontVariantNumeric:"tabular-nums" }}>{f.pct}</b>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
