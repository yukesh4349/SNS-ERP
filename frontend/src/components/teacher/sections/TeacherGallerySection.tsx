"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  ChatCircle, 
  PaperPlaneTilt, 
  BookmarkSimple, 
  Trophy,
  ShareNetwork,
  Image as ImageIcon,
  Plus
} from "@phosphor-icons/react";
import { DashboardTheme } from "../../../types/theme";

const events = [
  { 
    id: 1,
    title: "School Event Gallery", 
    date: "-- ---, 2026", 
    location: "Campus Hall",
    category: "Event", 
    color: "#FF7F50",
    icon: <Trophy size={16} weight="fill" />,
    image: "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&q=80&w=800",
    likes: 0,
    comments: 0,
    description: "Recent school activity and event highlights will be posted here.",
    hashtags: ["#SchoolEvent", "#SNSAcademy"],
    postedTime: "Just now"
  },
];

export default function TeacherGallerySection({ theme }: { theme: DashboardTheme }) {
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<number>>(new Set());
  const [selectedStory, setSelectedStory] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", description: "", category: "Event", driveUrl: "" });
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocalFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalPreview(reader.result as string);
        setNewPost(prev => ({ ...prev, driveUrl: "" })); // Clear drive URL if local file chosen
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleLike = (id: number) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSave = (id: number) => {
    setSavedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getDirectDriveLink = (url: string) => {
    if (!url) return "";
    // Handle standard drive links: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    const match = url.match(/\/file\/d\/(.+?)\//) || url.match(/id=(.+?)(&|$)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    return url;
  };

  const handleCreatePost = () => {
    console.log("Creating post:", { ...newPost, localFile, imageUrl: localPreview || getDirectDriveLink(newPost.driveUrl) });
    setIsCreating(false);
    setLocalFile(null);
    setLocalPreview("");
    alert("Post shared with school community!");
  };

  const filteredEvents = selectedStory 
    ? events.filter(e => e.id === selectedStory)
    : events;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: theme.text, fontStyle: "italic", margin: 0, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
            Faculty <span style={{ color: theme.primary }}>Feed</span>
          </h2>
          <p style={{ fontSize: 13, color: theme.textMuted, fontWeight: 600, marginTop: 4 }}>Share school moments with parents and students</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          style={{
            background: theme.primary,
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: 16,
            fontWeight: 800,
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            cursor: "pointer",
            boxShadow: `0 8px 20px ${theme.primary}40`,
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "all 0.3s ease"
          }}
          className="hover:scale-105 active:scale-95"
        >
          <Plus size={18} weight="bold" />
          Create Post
        </button>
      </div>
      
      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              background: theme.cardBg,
              border: `2px dashed ${theme.primary}40`,
              borderRadius: 32,
              padding: 40,
              display: "flex",
              flexDirection: "column",
              gap: 24,
              boxShadow: `0 20px 40px rgba(0,0,0,0.1)`
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ padding: 12, borderRadius: 12, background: `${theme.primary}10`, color: theme.primary }}>
                  <ImageIcon size={24} weight="duotone" />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: theme.text, margin: 0, textTransform: "uppercase" }}>New Faculty Post</h3>
              </div>
              {(newPost.driveUrl || localPreview) && (
                <div style={{ fontSize: 10, fontWeight: 900, color: "#10b981", background: "#10b98110", padding: "4px 10px", borderRadius: 8, textTransform: "uppercase" }}>
                  Image Ready
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <input 
                  type="text" 
                  placeholder="Post Title (e.g. Science Fair 2026)" 
                  style={{
                    width: "100%", background: theme.bgMuted, border: `1px solid ${theme.border}`,
                    borderRadius: 16, padding: 18, color: theme.text, outline: "none", fontWeight: "bold", fontSize: 14
                  }}
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                />
                
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 10, fontWeight: 800, color: theme.textMuted, textTransform: "uppercase", marginLeft: 4 }}>Image Source</label>
                  <div style={{ display: "flex", gap: 12 }}>
                    <input 
                      type="url" 
                      placeholder="Paste Drive Link..." 
                      style={{ flex: 1, background: theme.bgMuted, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 14, color: theme.text, outline: "none", fontWeight: "bold", fontSize: 13 }}
                      value={newPost.driveUrl}
                      onChange={(e) => {
                        setNewPost({...newPost, driveUrl: e.target.value});
                        setLocalPreview("");
                        setLocalFile(null);
                      }}
                    />
                    <div style={{ position: "relative" }}>
                      <input type="file" id="faculty-upload" hidden accept="image/*" onChange={handleFileChange} />
                      <label 
                        htmlFor="faculty-upload"
                        style={{ display: "flex", alignItems: "center", gap: 8, background: theme.primary, color: "white", padding: "0 20px", borderRadius: 16, cursor: "pointer", fontWeight: "bold", fontSize: 12, height: "100%", textTransform: "uppercase" }}
                      >
                        <Plus size={16} /> Upload
                      </label>
                    </div>
                  </div>
                </div>

                <textarea 
                  placeholder="Share the details of this moment..." 
                  style={{
                    width: "100%", background: theme.bgMuted, border: `1px solid ${theme.border}`,
                    borderRadius: 16, padding: 18, color: theme.text, outline: "none", minHeight: 100, fontWeight: "bold", fontSize: 14, resize: "none"
                  }}
                  value={newPost.description}
                  onChange={(e) => setNewPost({...newPost, description: e.target.value})}
                />
              </div>

              {/* Live Preview Area */}
              <div style={{ 
                background: theme.bgMuted, 
                borderRadius: 20, 
                border: `1px solid ${theme.border}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                minHeight: 250,
                position: "relative"
              }}>
                {(localPreview || newPost.driveUrl) ? (
                  <img 
                    src={localPreview || getDirectDriveLink(newPost.driveUrl)} 
                    alt="Preview" 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { (e.target as any).src = "https://placehold.co/600x600/1a1a1a/ffffff?text=Invalid+Image+Source"; }}
                  />
                ) : (
                  <div style={{ textAlign: "center", padding: 20 }}>
                    <ImageIcon size={48} weight="thin" color={theme.textMuted} />
                    <p style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, marginTop: 12, textTransform: "uppercase" }}>Image Preview</p>
                  </div>
                )}
                {(localPreview || newPost.driveUrl) && (
                  <button 
                    onClick={() => { setLocalPreview(""); setLocalFile(null); setNewPost({...newPost, driveUrl: ""}); }}
                    style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,0,0,0.8)", color: "white", border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontWeight: "bold" }}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <button 
                onClick={() => setIsCreating(false)}
                style={{ flex: 1, padding: 16, borderRadius: 16, background: theme.bgMuted, border: "none", color: theme.text, cursor: "pointer", fontWeight: "800", fontSize: 13, textTransform: "uppercase" }}
              >
                Discard
              </button>
              <button 
                onClick={handleCreatePost}
                disabled={!newPost.title || !newPost.description}
                style={{ 
                  flex: 2, padding: 16, borderRadius: 16, background: theme.primary, border: "none", color: "white", cursor: "pointer", fontWeight: "800", fontSize: 13, textTransform: "uppercase",
                  opacity: (!newPost.title || !newPost.description) ? 0.5 : 1,
                  boxShadow: `0 8px 20px ${theme.primary}40`
                }}
              >
                Post to Gallery
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stories & Feed logic stays same but customized for Teacher */}
      <div style={{ display: "flex", gap: 20, overflowX: "auto", paddingBottom: 10 }} className="hide-scrollbar">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedStory(null)}
            style={{
              width: 64, height: 64, borderRadius: "50%", padding: 2,
              background: !selectedStory ? "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" : (theme.isDark ? "#333" : "#eee"),
              cursor: "pointer"
            }}
          >
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: `2px solid ${theme.cardBg}`, overflow: "hidden", background: theme.isDark ? "rgba(255,255,255,0.05)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: theme.text }}>FEED</span>
            </div>
          </motion.div>
        </div>

        {events.map((event) => (
          <div key={event.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedStory(event.id)}
              style={{
                width: 64, height: 64, borderRadius: "50%", padding: 2,
                background: selectedStory === event.id ? "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" : (theme.isDark ? "#333" : "#eee"),
                cursor: "pointer"
              }}
            >
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: `2px solid ${theme.cardBg}`, overflow: "hidden", background: "#eee" }}>
                <img src={event.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </motion.div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24, paddingBottom: 60 }}>
        <AnimatePresence mode="popLayout">
          {filteredEvents.map((event) => {
            const isLiked = likedPosts.has(event.id);
            const isSaved = savedPosts.has(event.id);

            return (
              <motion.article
                key={event.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                style={{
                  background: theme.cardBg,
                  borderRadius: 20,
                  border: `1px solid ${theme.border}`,
                  overflow: "hidden",
                  boxShadow: theme.isDark ? "0 8px 30px rgba(0,0,0,0.2)" : "0 8px 30px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <div style={{ width: "100%", aspectRatio: "1/1", background: theme.isDark ? "#121212" : "#f0f0f0", position: "relative", overflow: "hidden", cursor: "pointer" }}>
                  <img src={event.image} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", bottom: 12, right: 12, padding: "4px 10px", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", borderRadius: 8, color: "white", fontSize: 10, fontWeight: 800, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
                    {event.icon} {event.category}
                  </div>
                </div>

                <div style={{ padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <Heart size={24} weight={isLiked ? "fill" : "bold"} color={isLiked ? "#ef4444" : theme.text} onClick={() => toggleLike(event.id)} style={{ cursor: "pointer" }} />
                      <ChatCircle size={24} weight="bold" color={theme.text} />
                      <ShareNetwork size={24} weight="bold" color={theme.text} />
                    </div>
                    <BookmarkSimple size={24} weight={isSaved ? "fill" : "bold"} color={isSaved ? "#FF7F50" : theme.text} onClick={() => toggleSave(event.id)} style={{ cursor: "pointer" }} />
                  </div>

                  <div style={{ fontWeight: 800, fontSize: 13, color: theme.text, marginBottom: 4 }}>{event.title}</div>
                  <div style={{ fontSize: 12, color: theme.textMuted, lineHeight: "1.4", marginBottom: 8 }}>{event.description}</div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {event.hashtags.map((h, hi) => (
                      <span key={hi} style={{ color: event.color, fontWeight: 700, fontSize: 11 }}>{h}</span>
                    ))}
                  </div>

                  <div style={{ paddingTop: 12, borderTop: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", color: theme.textMuted, fontSize: 11, fontWeight: 700 }}>
                    <span>{event.date}</span>
                    <span style={{ color: theme.primary }}>{event.location}</span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
