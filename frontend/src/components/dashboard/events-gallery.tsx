"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, DotsThree, Plus, ArrowClockwise } from "@phosphor-icons/react";
import { DashboardTheme } from "../../types/theme";
import { getAnnouncements, type Announcement } from "../../services/announcements-service";
import { useAuth } from "../../hooks/use-auth";
import { getDriveImageUrl } from "../../lib/drive-utils";

/* ─── helpers ─────────────────────────────────────────────────── */
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const TARGET_META: Record<string, { label: string; color: string }> = {
  all:     { label: "Everyone", color: "#10B981" },
  parents: { label: "Parents",  color: "#3B82F6" },
  staff:   { label: "Staff Only", color: "#8B5CF6" },
};

/* ─── Instagram double-tap heart overlay ──────────────────────── */
let _heartKey = 0;
function DoubleTapHeart({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 1000); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.2 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.2, 1.15, 1, 1] }}
      transition={{ duration: 0.75, times: [0, 0.25, 0.65, 1], ease: "easeOut" }}
      style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "none", zIndex: 20,
      }}
    >
      <Heart size={110} weight="fill" color="white"
        style={{ filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.35))" }} />
    </motion.div>
  );
}

/* ─── Story circle ─────────────────────────────────────────────── */
function StoryCircle({
  label, initials, active, onClick, gradientColors, theme,
}: {
  label: string; initials: string; active: boolean;
  onClick: () => void; gradientColors: string; theme: DashboardTheme;
}) {
  return (
    <button
      onClick={onClick}
      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}
    >
      {/* gradient ring */}
      <motion.div
        whileTap={{ scale: 0.93 }}
        style={{
          width: 68, height: 68, borderRadius: "50%", padding: 3,
          background: active ? gradientColors : theme.isDark ? "#333" : "#dbdbdb",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <div style={{
          width: "100%", height: "100%", borderRadius: "50%",
          border: `3px solid ${theme.cardBg}`,
          background: "linear-gradient(135deg, #FF7F50, #e66a3e)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 900, fontSize: 18, letterSpacing: "-1px",
        }}>
          {initials}
        </div>
      </motion.div>
      <span style={{
        fontSize: 10, fontWeight: 800,
        color: active ? "#fff" : theme.textMuted,
        background: active ? theme.primary : (theme.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"),
        padding: "4px 10px",
        borderRadius: 20,
        maxWidth: 80, textAlign: "center",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        textTransform: "uppercase",
        letterSpacing: "0.02em"
      }}>
        {label}
      </span>
    </button>
  );
}

/* ─── Skeleton ─────────────────────────────────────────────────── */
function SkeletonCard({ theme }: { theme: DashboardTheme }) {
  const bg = theme.isDark ? "#2a2a2a" : "#efefef";
  const border = theme.isDark ? "rgba(255,255,255,0.08)" : "#dbdbdb";
  return (
    <div style={{ background: theme.cardBg, border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden", maxWidth: 470, width: "100%", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 12px" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: bg }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 11, width: "38%", background: bg, borderRadius: 4, marginBottom: 7 }} />
          <div style={{ height: 9, width: "20%", background: bg, borderRadius: 4 }} />
        </div>
      </div>
      <div style={{ width: "100%", aspectRatio: "1/1", background: bg }} />
      <div style={{ padding: "14px 12px 16px" }}>
        <div style={{ height: 11, width: "28%", background: bg, borderRadius: 4, marginBottom: 10 }} />
        <div style={{ height: 10, width: "85%", background: bg, borderRadius: 4, marginBottom: 6 }} />
        <div style={{ height: 10, width: "60%", background: bg, borderRadius: 4 }} />
      </div>
    </div>
  );
}

const GRADIENTS = [
  "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
  "linear-gradient(45deg,#FF7F50,#FF4500)",
  "linear-gradient(45deg,#6C63FF,#3B82F6)",
  "linear-gradient(45deg,#10B981,#3B82F6)",
  "linear-gradient(45deg,#f59e0b,#ef4444)",
  "linear-gradient(45deg,#8B5CF6,#ec4899)",
];

export function EventsGallery({ theme: themeName = 'light' }: { theme?: 'light' | 'dark' }) {
  const router = useRouter();
  const { session } = useAuth();
  const isAdmin = session?.user.role === "admin" || session?.user.role === "leader";

  const isDarkMode = themeName === 'dark';
  const theme: DashboardTheme = {
    isDark: isDarkMode,
    bg: isDarkMode ? "#0A0A0A" : "#f8fafc",
    sidebarBg: isDarkMode ? "#121212" : "#ffffff",
    cardBg: isDarkMode ? "#1A1A1A" : "#ffffff",
    text: isDarkMode ? "#FFFFFF" : "#1e293b",
    textMuted: isDarkMode ? "#A0A0A0" : "#94a3b8",
    border: isDarkMode ? "rgba(255,255,255,0.08)" : "#e2e8f0",
    accent: "#FF7F50",
    primary: "#FF7F50",
    success: "#10B981",
    danger: "#EF4444",
  };

  const [posts,   setPosts]   = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [filter,  setFilter]  = useState<string>("__all__");
  const [liked,   setLiked]   = useState<Set<string>>(new Set());

  // Per-post heart burst keys (array of unique ids to mount <DoubleTapHeart>)
  const [heartBursts, setHeartBursts] = useState<Record<string, string[]>>({});

  const border  = theme.border;
  const mutedTx = theme.textMuted;

  const fetchPosts = async () => {
    setLoading(true); setError(null);
    try {
      const data = await getAnnouncements(0, 50);
      setPosts(data);
    } catch { setError("Failed to load. Tap retry."); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, []);

  /* unique authors for story bar */
  const authors = Array.from(
    posts.reduce((map, p) => { if (!map.has(p.author.id)) map.set(p.author.id, p.author); return map; }, new Map<string, Announcement["author"]>()).values()
  );

  const filtered = filter === "__all__"
    ? posts
    : posts.filter((p) => p.author.id === filter);

  /* fire like + add heart burst */
  const handleLike = useCallback((postId: string) => {
    setLiked((prev) => {
      const n = new Set(prev);
      if (n.has(postId)) { n.delete(postId); return n; }
      n.add(postId);
      // add a burst
      const burstId = `hb_${++_heartKey}`;
      setHeartBursts((b) => ({ ...b, [postId]: [...(b[postId] ?? []), burstId] }));
      return n;
    });
  }, []);

  const removeBurst = useCallback((postId: string, burstId: string) => {
    setHeartBursts((b) => ({ ...b, [postId]: (b[postId] ?? []).filter((x) => x !== burstId) }));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", width: "100%", maxWidth: 1200, margin: "0 auto" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "8px 12px 16px" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: theme.text, letterSpacing: "-0.02em", margin: 0 }}>Event Gallery</h2>
          <p style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, margin: "2px 0 0" }}>{posts.length} announcements</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={fetchPosts}
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Refresh"
          >
            <ArrowClockwise size={16} />
          </button>
          {isAdmin && (
            <button
              onClick={() => router.push("/admin/notice-post")}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: theme.primary, color: "white", border: "none", cursor: "pointer", fontWeight: 800, fontSize: 13, boxShadow: "0 4px 12px rgba(255,127,80,0.2)" }}
            >
              <Plus size={14} weight="bold" />
              New Post
            </button>
          )}
        </div>
      </div>

      {/* ── Stories bar (full width, horizontal scroll) ── */}
      {!loading && posts.length > 0 && (
        <div style={{
          width: "100%",
          borderBottom: `1px solid ${border}`,
          marginBottom: 16,
          background: theme.cardBg,
          borderRadius: 12,
        }}>
          <div
            style={{ display: "flex", gap: 18, overflowX: "auto", padding: "14px", width: "100%" }}
            className="hide-scrollbar"
          >
            {/* All */}
            <StoryCircle
              label="All"
              initials="★"
              active={filter === "__all__"}
              onClick={() => setFilter("__all__")}
              gradientColors={GRADIENTS[0]}
              theme={theme}
            />
            {/* One circle per unique author */}
            {authors.map((author, i) => (
              <StoryCircle
                key={author.id}
                label={author.name.split(" ")[0]}
                initials={author.name.slice(0, 2).toUpperCase()}
                active={filter === author.id}
                onClick={() => setFilter(filter === author.id ? "__all__" : author.id)}
                gradientColors={GRADIENTS[(i + 1) % GRADIENTS.length]}
                theme={theme}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 24,
          width: "100%", 
          alignItems: "start", 
          paddingTop: 16 
        }}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} theme={theme} />)}
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: mutedTx, marginBottom: 12, fontSize: 14 }}>{error}</p>
          <button onClick={fetchPosts} style={{ color: "#FF7F50", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Retry</button>
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ color: mutedTx, fontSize: 14, fontWeight: 600 }}>No posts here yet</p>
        </div>
      )}

      {/* ── Feed ── */}
      {!loading && !error && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 24,
          width: "100%", 
          alignItems: "start", 
          paddingBottom: 60 
        }}>
          <AnimatePresence mode="popLayout">
            {filtered.map((post, idx) => {
              const meta     = TARGET_META[post.target] ?? TARGET_META.all;
              const isLiked  = liked.has(post.id);
              const handle   = post.author.name.replace(/\s+/g, "").toLowerCase();
              const initials = post.author.name.slice(0, 2).toUpperCase();
              const bursts   = heartBursts[post.id] ?? [];

              return (
                <motion.article
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: idx * 0.04 }}
                  style={{
                    width: "100%",
                    background: theme.cardBg,
                    border: `1px solid ${border}`,
                    borderRadius: 12,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column"
                  }}
                >
                  {/* ── Post header ── */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                      {/* avatar with gradient ring */}
                      <div style={{
                        padding: 2, borderRadius: "50%",
                        background: isLiked ? GRADIENTS[0] : `2px solid ${border}`,
                        border: isLiked ? "none" : `2px solid ${border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: "50%",
                          background: "linear-gradient(135deg,#FF7F50,#e66a3e)",
                          color: "#fff", display: "flex", alignItems: "center",
                          justifyContent: "center", fontWeight: 900, fontSize: 13,
                          border: `2px solid ${theme.cardBg}`,
                        }}>
                          {initials}
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: 13.5, color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>{handle}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: meta.color,
                            background: meta.color + "18", borderRadius: 5, padding: "1px 6px",
                            flexShrink: 0
                          }}>
                            {meta.label}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: mutedTx, display: "block", marginTop: 2 }}>SNS Academy · {timeAgo(post.createdAt)}</span>
                      </div>
                    </div>
                    <button style={{ background: "none", border: "none", cursor: "pointer", color: theme.text, padding: 4 }}>
                      <DotsThree size={22} weight="bold" />
                    </button>
                  </div>

                  {/* ── Image (square, double-tap to like) ── */}
                  {post.imageUrl ? (
                    <div
                      style={{ width: "100%", aspectRatio: "1/1", overflow: "hidden", position: "relative", background: theme.isDark ? "#111" : "#fafafa", cursor: "pointer" }}
                      onDoubleClick={() => handleLike(post.id)}
                    >
                      <img
                        src={getDriveImageUrl(post.imageUrl) || post.imageUrl}
                        alt={post.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block", userSelect: "none" }}
                        draggable={false}
                      />
                      {/* Instagram-style heart burst on double tap */}
                      {bursts.map((burstId) => (
                        <DoubleTapHeart key={burstId} onDone={() => removeBurst(post.id, burstId)} />
                      ))}
                    </div>
                  ) : (
                    /* text-only tile */
                    <div
                      style={{
                        width: "100%", padding: "40px 20px",
                        background: theme.isDark ? "#1a1a1a" : "#fafafa",
                        borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`,
                        position: "relative", cursor: "pointer",
                      }}
                      onDoubleClick={() => handleLike(post.id)}
                    >
                      <p style={{ fontSize: 22, fontWeight: 900, color: theme.text, lineHeight: 1.3, margin: 0 }}>
                        {post.title}
                      </p>
                      {bursts.map((burstId) => (
                        <DoubleTapHeart key={burstId} onDone={() => removeBurst(post.id, burstId)} />
                      ))}
                    </div>
                  )}

                  {/* ── Action bar — heart only ── */}
                  <div style={{ padding: "10px 14px 0" }}>
                    <motion.button
                      onClick={() => handleLike(post.id)}
                      whileTap={{ scale: 0.82 }}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", marginBottom: 6, display: "block" }}
                    >
                      <motion.span
                        key={isLiked ? "liked" : "unliked"}
                        initial={{ scale: isLiked ? 0.5 : 1 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 18 }}
                        style={{ display: "block" }}
                      >
                        <Heart
                          size={28}
                          weight={isLiked ? "fill" : "regular"}
                          color={isLiked ? "#ed4956" : theme.text}
                        />
                      </motion.span>
                    </motion.button>

                    {/* caption */}
                    <p style={{ fontSize: 13.5, color: theme.text, margin: "0 0 4px", lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 700, marginRight: 6 }}>{handle}</span>
                      <span style={{ color: theme.isDark ? "#e2e8f0" : "#374151" }}>
                        {post.title}{post.content && post.content !== post.title ? `  ${post.content}` : ""}
                      </span>
                    </p>

                    {/* timestamp */}
                    <p style={{ fontSize: 10, color: mutedTx, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", margin: "6px 0 14px" }}>
                      {new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
