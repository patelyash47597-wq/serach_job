"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import yaml from "js-yaml";
import QuizAndCertificate from "@/components/QuizAndCertificate";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Resource {
  title: string;
  type: "Video" | "Article" | "Course";
  url: string;
}

interface RawNode {
  id: string;
  label: string;
  position?: { x: number; y: number };
  resources?: Resource[];
}

interface RawEdge {
  from: string;
  to: string;
  style?: "dashed" | "solid";
}

interface RoadmapData {
  title: string;
  nodes: RawNode[];
  edges: RawEdge[];
}

interface RoadmapProps {
  yamlContent?: string;
  yamlFile?: string;
}

interface VideoProgress {
  watchedSeconds: number;
  totalSeconds: number;
  completed: boolean;
}

interface NodeVideoState {
  [videoUrl: string]: VideoProgress;
}

interface NodeNotes {
  [nodeId: string]: string;
}

// ── YouTube URL Helper ─────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("?")[0];
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/embed/")[1].split("?")[0];
    }
  } catch { }
  return null;
}

function getYouTubeThumbnail(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function badgeColor(type: string) {
  if (type === "Video") return { bg: "#1a2332", text: "#4dc9a8", border: "#4dc9a8", icon: "▶" };
  if (type === "Course") return { bg: "#1a1a2e", text: "#a78bfa", border: "#7c3aed", icon: "🎓" };
  return { bg: "#1f2937", text: "#f59e0b", border: "#d97706", icon: "◈" };
}

// ── Video Modal ───────────────────────────────────────────────────────────────

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    _ytAPILoading?: boolean;
    _ytAPIReady?: boolean;
    _ytAPICallbacks?: (() => void)[];
  }
}

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (window._ytAPIReady) { resolve(); return; }
    if (!window._ytAPICallbacks) window._ytAPICallbacks = [];
    window._ytAPICallbacks.push(resolve);
    if (!window._ytAPILoading) {
      window._ytAPILoading = true;
      window.onYouTubeIframeAPIReady = () => {
        window._ytAPIReady = true;
        window._ytAPICallbacks?.forEach(cb => cb());
        window._ytAPICallbacks = [];
      };
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });
}

interface VideoModalProps {
  resource: Resource;
  nodeId: string;
  videoProgress: NodeVideoState;
  onProgressUpdate: (url: string, progress: VideoProgress) => void;
  onClose: () => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

function VideoModal({ resource, nodeId, videoProgress, onProgressUpdate, onClose, notes, onNotesChange }: VideoModalProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [apiReady, setApiReady] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<VideoProgress>(
    videoProgress[resource.url] || { watchedSeconds: 0, totalSeconds: 0, completed: false }
  );
  const videoId = extractYouTubeId(resource.url);

  useEffect(() => {
    loadYouTubeAPI().then(() => setApiReady(true));
  }, []);

  useEffect(() => {
    if (!apiReady || !videoId || !containerRef.current) return;

    const startSeconds = videoProgress[resource.url]?.watchedSeconds || 0;

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      playerVars: {
        start: Math.floor(startSeconds),
        rel: 0,
        modestbranding: 1,
        enablejsapi: 1,
      },
      events: {
        onReady: (e: any) => {
          const dur = e.target.getDuration();
          setCurrentProgress(prev => ({ ...prev, totalSeconds: dur }));
        },
        onStateChange: (e: any) => {
          const YT = window.YT;
          if (e.data === YT.PlayerState.PLAYING) {
            intervalRef.current = setInterval(() => {
              const player = playerRef.current;
              if (!player) return;
              const cur = player.getCurrentTime?.() || 0;
              const dur = player.getDuration?.() || 0;
              const completed = dur > 0 && cur >= dur * 0.9;
              const prog: VideoProgress = { watchedSeconds: cur, totalSeconds: dur, completed };
              setCurrentProgress(prog);
              onProgressUpdate(resource.url, prog);
            }, 2000);
          } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (e.data === YT.PlayerState.ENDED) {
              const dur = playerRef.current?.getDuration?.() || 0;
              const prog: VideoProgress = { watchedSeconds: dur, totalSeconds: dur, completed: true };
              setCurrentProgress(prog);
              onProgressUpdate(resource.url, prog);
            }
          }
        },
      },
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      try { playerRef.current?.destroy?.(); } catch { }
    };
  }, [apiReady, videoId]);

  const pct = currentProgress.totalSeconds > 0
    ? Math.min(100, Math.round((currentProgress.watchedSeconds / currentProgress.totalSeconds) * 100))
    : 0;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!videoId) {
    return (
      <div style={overlayStyle} onClick={onClose}>
        <div style={modalStyle} onClick={e => e.stopPropagation()}>
          <p style={{ color: "#f85149" }}>Invalid YouTube URL</p>
          <button onClick={onClose} style={closeBtn}>✕ Close</button>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={{
          ...modalStyle,
          width: "min(860px, 96vw)",
          maxHeight: "95vh",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #21262d" }}>
          <div>
            <div style={{ color: "#e6edf3", fontWeight: 700, fontSize: 15 }}>{resource.title}</div>
            <div style={{ color: "#4dc9a8", fontSize: 12, marginTop: 2 }}>▶ YouTube Video</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8b949e", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden", flexDirection: window.innerWidth < 600 ? "column" : "row" }}>
          {/* Left: Video + Progress */}
          <div style={{ flex: "1 1 55%", display: "flex", flexDirection: "column" }}>
            {/* YouTube Player */}
            <div style={{ position: "relative", paddingBottom: "56.25%", background: "#000" }}>
              <div ref={containerRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
            </div>

            {/* Progress Bar */}
            <div style={{ padding: "12px 16px", background: "#0d1117" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8b949e", marginBottom: 6 }}>
                <span>Video Progress</span>
                <span style={{ color: currentProgress.completed ? "#3fb950" : "#4dc9a8", fontWeight: 700 }}>
                  {currentProgress.completed ? "✓ Completed" : `${formatTime(currentProgress.watchedSeconds)} / ${formatTime(currentProgress.totalSeconds)}`}
                  &nbsp;({pct}%)
                </span>
              </div>
              <div style={{ height: 6, background: "#21262d", borderRadius: 999, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: currentProgress.completed ? "#3fb950" : "#4dc9a8",
                  borderRadius: 999,
                  transition: "width .5s ease",
                  boxShadow: `0 0 6px ${currentProgress.completed ? "#3fb95088" : "#4dc9a888"}`,
                }} />
              </div>
              {!currentProgress.completed && (
                <div style={{ fontSize: 11, color: "#484f58", marginTop: 4 }}>
                  Node will be auto-completed when you watch 90%+ of the video
                </div>
              )}
            </div>
          </div>

          {/* Right: Notes */}
          <div style={{
            flex: "1 1 45%",
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid #21262d",
            background: "#0d1117",
          }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #21262d", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>📝</span>
              <span style={{ color: "#c9d1d9", fontWeight: 600, fontSize: 13 }}>My Notes</span>
              <span style={{ fontSize: 10, color: "#484f58", marginLeft: "auto" }}>Auto-saved</span>
            </div>
            <textarea
              value={notes}
              onChange={e => onNotesChange(e.target.value)}
              placeholder={`Take notes for "${resource.title}"...\n\nJo bhi seekha, yahan likh lo 📖`}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#c9d1d9",
                fontSize: 13,
                lineHeight: 1.7,
                padding: "14px 16px",
                resize: "none",
                fontFamily: "'Fira Code', 'Courier New', monospace",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)",
  zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
  backdropFilter: "blur(4px)",
};

const modalStyle: React.CSSProperties = {
  background: "#161b22",
  border: "1px solid #30363d",
  borderRadius: 14,
  overflow: "hidden",
  boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
};

const closeBtn: React.CSSProperties = {
  background: "#21262d", border: "1px solid #30363d", color: "#c9d1d9",
  padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13,
};

// ── Resource Badge (enhanced for Video) ────────────────────────────────────────

function ResourceBadge({
  resource,
  nodeId,
  videoProgress,
  onVideoOpen,
}: {
  resource: Resource;
  nodeId: string;
  videoProgress: NodeVideoState;
  onVideoOpen: (resource: Resource) => void;
}) {
  const c = badgeColor(resource.type);
  const isYTVideo = resource.type === "Video" && !!extractYouTubeId(resource.url);
  const vp = videoProgress[resource.url];
  const pct = vp && vp.totalSeconds > 0 ? Math.min(100, Math.round((vp.watchedSeconds / vp.totalSeconds) * 100)) : 0;

  if (isYTVideo) {
    return (
      <button
        onClick={() => onVideoOpen(resource)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 11, padding: "3px 9px", borderRadius: 20,
          background: vp?.completed ? "#0d2818" : c.bg,
          color: vp?.completed ? "#3fb950" : c.text,
          border: `1px solid ${vp?.completed ? "#3fb950" : c.border}`,
          cursor: "pointer", whiteSpace: "nowrap",
          transition: "all .2s",
          position: "relative", overflow: "hidden",
        }}
        title={`Watch: ${resource.title} (${pct}% watched)`}
      >
        {/* Progress fill */}
        {pct > 0 && !vp?.completed && (
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0,
            width: `${pct}%`, background: "#4dc9a822", pointerEvents: "none",
          }} />
        )}
        <span style={{ position: "relative" }}>
          {vp?.completed ? "✓" : "▶"}
        </span>
        <span style={{ position: "relative" }}>
          {resource.title.length > 24 ? resource.title.slice(0, 23) + "…" : resource.title}
        </span>
        {pct > 0 && !vp?.completed && (
          <span style={{ position: "relative", opacity: 0.7 }}>{pct}%</span>
        )}
      </button>
    );
  }

  return (
    <a href={resource.url} target="_blank" rel="noopener noreferrer"
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 11, padding: "2px 8px", borderRadius: 20,
        background: c.bg, color: c.text, border: `1px solid ${c.border}`,
        textDecoration: "none", whiteSpace: "nowrap", transition: "opacity .2s",
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
    >
      {c.icon} {resource.title.length > 28 ? resource.title.slice(0, 27) + "…" : resource.title}
    </a>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function HLine() {
  return <div style={{ width: 32, height: 1.5, background: "#30363d", flexShrink: 0 }} />;
}

function SideNode({ node, completed, onToggle, videoProgress, onVideoOpen }: {
  node: RawNode;
  completed: boolean;
  onToggle: () => void;
  videoProgress: NodeVideoState;
  onVideoOpen: (resource: Resource) => void;
}) {
  // Check if node has video resources and if they're all complete
  const videoResources = node.resources?.filter(r => r.type === "Video" && extractYouTubeId(r.url)) || [];
  const hasVideos = videoResources.length > 0;
  const allVideosComplete = hasVideos && videoResources.every(r => videoProgress[r.url]?.completed);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div
        onClick={hasVideos ? undefined : onToggle}
        style={{
          background: completed ? "#0d2818" : "#161b22",
          border: `1.5px solid ${completed ? "#3fb950" : "#58a6ff"}`,
          borderRadius: 8,
          padding: "7px 14px",
          color: completed ? "#3fb950" : "#58a6ff",
          fontSize: 12,
          fontWeight: 500,
          textAlign: "center",
          minWidth: 130,
          cursor: hasVideos ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          transition: "all .2s",
          userSelect: "none",
        }}
      >
        <span style={{
          width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
          border: `2px solid ${completed ? "#3fb950" : "#58a6ff"}`,
          background: completed ? "#3fb950" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, color: "#fff",
        }}>
          {completed ? "✓" : ""}
        </span>
        {node.label}
        {hasVideos && !allVideosComplete && (
          <span style={{ fontSize: 9, color: "#8b949e" }}>🎬</span>
        )}
      </div>
      {node.resources && node.resources.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center" }}>
          {node.resources.map((r, i) => (
            <ResourceBadge
              key={i}
              resource={r}
              nodeId={node.id}
              videoProgress={videoProgress}
              onVideoOpen={onVideoOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MainNode({ node, completed, onToggle, videoProgress, onVideoOpen }: {
  node: RawNode;
  completed: boolean;
  onToggle: () => void;
  videoProgress: NodeVideoState;
  onVideoOpen: (resource: Resource) => void;
}) {
  const videoResources = node.resources?.filter(r => r.type === "Video" && extractYouTubeId(r.url)) || [];
  const hasVideos = videoResources.length > 0;

  return (
    <div style={{
      background: completed ? "#0a2a1a" : "#161b22",
      border: `2px solid ${completed ? "#3fb950" : "#4dc9a8"}`,
      borderRadius: 12,
      padding: "14px 24px",
      color: completed ? "#3fb950" : "#4dc9a8",
      fontSize: 15,
      fontWeight: 600,
      textAlign: "center",
      minWidth: 260,
      maxWidth: 340,
      transition: "all .25s",
      position: "relative",
    }}>
      <button
        onClick={hasVideos ? undefined : onToggle}
        title={hasVideos ? "Watch video to complete" : (completed ? "Mark incomplete" : "Mark complete")}
        style={{
          position: "absolute", top: 10, right: 10,
          width: 24, height: 24, borderRadius: "50%",
          border: `2px solid ${completed ? "#3fb950" : "#4dc9a8"}`,
          background: completed ? "#3fb950" : "transparent",
          color: "#fff", fontSize: 12, cursor: hasVideos ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .2s", padding: 0,
          opacity: hasVideos && !completed ? 0.5 : 1,
        }}
        title={hasVideos && !completed ? "Watch video to unlock" : ""}
      >
        {completed ? "✓" : hasVideos ? "🔒" : ""}
      </button>

      <div style={{ marginBottom: node.resources?.length ? 8 : 0, paddingRight: 28 }}>
        {node.label}
        {hasVideos && !completed && (
          <div style={{ fontSize: 10, color: "#8b949e", fontWeight: 400, marginTop: 2 }}>
            Watch video to complete
          </div>
        )}
      </div>

      {node.resources && node.resources.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
          {node.resources.map((r, i) => (
            <ResourceBadge
              key={i}
              resource={r}
              nodeId={node.id}
              videoProgress={videoProgress}
              onVideoOpen={onVideoOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Connector() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1 }}>
      <div style={{ width: 2, height: 32, background: "#30363d" }} />
      <div style={{
        width: 0, height: 0,
        borderLeft: "5px solid transparent",
        borderRight: "5px solid transparent",
        borderTop: "7px solid #30363d",
        marginTop: -1,
      }} />
    </div>
  );
}

function SideBranch({ leftNodes, rightNodes, completed, onToggle, videoProgress, onVideoOpen }: {
  leftNodes: RawNode[];
  rightNodes: RawNode[];
  completed: Set<string>;
  onToggle: (id: string) => void;
  videoProgress: NodeVideoState;
  onVideoOpen: (resource: Resource) => void;
}) {
  const rows = Math.max(leftNodes.length, rightNodes.length);
  if (rows === 0) return null;

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      width: "100%", position: "relative", marginTop: -12,
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", paddingTop: 32, marginRight: -1 }}>
        <div style={{ width: 80, height: 1.5, background: "#30363d" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          {leftNodes.map((n, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: i === 0 ? 8 : 0 }}>
              <SideNode
                node={n}
                completed={completed.has(n.id)}
                onToggle={() => onToggle(n.id)}
                videoProgress={videoProgress}
                onVideoOpen={onVideoOpen}
              />
              <HLine />
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: 2, background: "#30363d", minHeight: rows * 46 + 20, position: "relative" }}>
        <div style={{
          position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: "7px solid #30363d",
        }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", paddingTop: 32, marginLeft: -1 }}>
        <div style={{ width: 80, height: 1.5, background: "#30363d" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
          {rightNodes.map((n, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: i === 0 ? 8 : 0 }}>
              <HLine />
              <SideNode
                node={n}
                completed={completed.has(n.id)}
                onToggle={() => onToggle(n.id)}
                videoProgress={videoProgress}
                onVideoOpen={onVideoOpen}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressHeader({
  title, total, done, onDownload, downloading,
}: {
  title: string;
  total: number;
  done: number;
  onDownload: () => void;
  downloading: boolean;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const barColor =
    pct < 30 ? "#f85149" : pct < 60 ? "#f59e0b" : pct < 90 ? "#4dc9a8" : "#3fb950";

  return (
    <div style={{ textAlign: "center", marginBottom: 40 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "#e6edf3", lineHeight: 1.3, margin: "0 0 24px" }}>
        {title}
      </h1>
      <div style={{ maxWidth: 480, margin: "0 auto 10px", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
          <span style={{ color: "#8b949e" }}>Overall Progress</span>
          <span style={{ color: barColor, fontWeight: 700, fontSize: 14 }}>
            {done}/{total} &nbsp;·&nbsp; {pct}%
          </span>
        </div>
        <div style={{ height: 10, background: "#21262d", borderRadius: 999, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`, background: barColor,
            borderRadius: 999, transition: "width .4s ease, background .4s ease",
            boxShadow: `0 0 8px ${barColor}88`,
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "#484f58" }}>
          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {pct === 0 && <span style={{ fontSize: 12, color: "#8b949e" }}>Click any node or watch a video to mark complete ✨</span>}
        {pct > 0 && pct < 100 && <span style={{ fontSize: 12, color: "#4dc9a8" }}>Keep going! You're making progress 🚀</span>}
        {pct === 100 && <span style={{ fontSize: 13, color: "#3fb950", fontWeight: 600 }}>🎉 Roadmap complete! Congratulations!</span>}
      </div>

      <button
        onClick={onDownload}
        disabled={downloading}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "10px 22px", borderRadius: 8,
          background: downloading ? "#21262d" : "#238636",
          border: "1px solid " + (downloading ? "#30363d" : "#2ea043"),
          color: downloading ? "#8b949e" : "#fff",
          fontSize: 14, fontWeight: 600, cursor: downloading ? "not-allowed" : "pointer",
          transition: "all .2s",
        }}
        onMouseEnter={e => { if (!downloading) (e.currentTarget as HTMLElement).style.background = "#2ea043"; }}
        onMouseLeave={e => { if (!downloading) (e.currentTarget as HTMLElement).style.background = "#238636"; }}
      >
        {downloading ? "⏳ Generating PDF…" : "⬇ Download Roadmap PDF"}
      </button>
    </div>
  );
}

function StageSummary({ stages }: { stages: { label: string; done: number; total: number }[] }) {
  return (
    <div style={{
      maxWidth: 700, margin: "40px auto 0",
      background: "#161b22", border: "1px solid #30363d",
      borderRadius: 12, padding: "20px 24px",
    }}>
      <h3 style={{ color: "#8b949e", fontSize: 13, fontWeight: 600, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 1 }}>
        Stage-wise Progress
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {stages.map((s, i) => {
          const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
          const color = pct < 30 ? "#f85149" : pct < 70 ? "#f59e0b" : "#3fb950";
          return (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: "#c9d1d9" }}>{s.label}</span>
                <span style={{ color, fontWeight: 600 }}>{s.done}/{s.total} ({pct}%)</span>
              </div>
              <div style={{ height: 6, background: "#21262d", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999, transition: "width .4s" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Roadmap({ yamlContent, yamlFile }: RoadmapProps) {
  const [data, setData] = useState<RoadmapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [videoProgress, setVideoProgress] = useState<NodeVideoState>({});
  const [notes, setNotes] = useState<NodeNotes>({});
  const [activeModal, setActiveModal] = useState<{ resource: Resource; nodeId: string } | null>(null);
  const roadmapRef = useRef<HTMLDivElement>(null);

  // Load YAML
  useEffect(() => {
    if (yamlContent) {
      try { setData(yaml.load(yamlContent) as RoadmapData); }
      catch (e: any) { setError("Failed to parse YAML: " + e.message); }
      return;
    }
    if (yamlFile) {
      fetch(`/${yamlFile}`)
        .then(r => { if (!r.ok) throw new Error(`Could not load ${yamlFile}`); return r.text(); })
        .then(text => setData(yaml.load(text) as RoadmapData))
        .catch(e => setError(e.message));
    }
  }, [yamlContent, yamlFile]);

  // Load persisted state
  useEffect(() => {
    if (!data) return;
    const key = `roadmap-progress-${data.title}`;
    const saved = localStorage.getItem(key);
    if (saved) setCompleted(new Set(JSON.parse(saved)));

    const vpKey = `roadmap-video-${data.title}`;
    const savedVP = localStorage.getItem(vpKey);
    if (savedVP) setVideoProgress(JSON.parse(savedVP));

    const notesKey = `roadmap-notes-${data.title}`;
    const savedNotes = localStorage.getItem(notesKey);
    if (savedNotes) setNotes(JSON.parse(savedNotes));
  }, [data]);

  // Persist notes
  const handleNotesChange = useCallback((nodeId: string, value: string) => {
    setNotes(prev => {
      const next = { ...prev, [nodeId]: value };
      if (data) localStorage.setItem(`roadmap-notes-${data.title}`, JSON.stringify(next));
      return next;
    });
  }, [data]);

  const toggleNode = (id: string) => {
    // If node has video resources, check if all videos are complete
    if (data) {
      const node = data.nodes.find(n => n.id === id);
      if (node) {
        const videoResources = node.resources?.filter(r => r.type === "Video" && extractYouTubeId(r.url)) || [];
        if (videoResources.length > 0) {
          const allComplete = videoResources.every(r => videoProgress[r.url]?.completed);
          if (!allComplete && !completed.has(id)) {
            // Cannot manually complete — must watch video
            return;
          }
        }
      }
    }
    setCompleted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      if (data) localStorage.setItem(`roadmap-progress-${data.title}`, JSON.stringify([...next]));
      return next;
    });
  };

  // Handle video progress update
  const handleVideoProgress = useCallback((nodeId: string, url: string, progress: VideoProgress) => {
    setVideoProgress(prev => {
      const next = { ...prev, [url]: progress };
      if (data) localStorage.setItem(`roadmap-video-${data.title}`, JSON.stringify(next));

      // Auto-complete node when video is done
      if (progress.completed) {
        const node = data?.nodes.find(n => n.id === nodeId);
        if (node) {
          const videoResources = node.resources?.filter(r => r.type === "Video" && extractYouTubeId(r.url)) || [];
          const allComplete = videoResources.every(r => {
            if (r.url === url) return true;
            return next[r.url]?.completed;
          });
          if (allComplete) {
            setCompleted(prevC => {
              if (prevC.has(nodeId)) return prevC;
              const nextC = new Set(prevC);
              nextC.add(nodeId);
              if (data) localStorage.setItem(`roadmap-progress-${data.title}`, JSON.stringify([...nextC]));
              return nextC;
            });
          }
        }
      }
      return next;
    });
  }, [data]);

  const handleVideoOpen = (nodeId: string, resource: Resource) => {
    setActiveModal({ resource, nodeId });
  };

  // PDF Download
  const handleDownload = async () => {
    if (!roadmapRef.current) return;
    setDownloading(true);
    try {
      await new Promise<void>((resolve, reject) => {
        if ((window as any).html2canvas) { resolve(); return; }
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("html2canvas CDN load failed"));
        document.head.appendChild(s);
      });
      await new Promise<void>((resolve, reject) => {
        if ((window as any).jspdf) { resolve(); return; }
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("jsPDF CDN load failed"));
        document.head.appendChild(s);
      });
      const html2canvas = (window as any).html2canvas;
      const { jsPDF } = (window as any).jspdf;
      const canvas = await html2canvas(roadmapRef.current, {
        backgroundColor: "#0d1117", scale: 2, useCORS: true, logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdfW = canvas.width / 2;
      const pdfH = canvas.height / 2;
      const pdf = new jsPDF({
        orientation: pdfH > pdfW ? "portrait" : "landscape",
        unit: "px", format: [pdfW, pdfH],
      });
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`${data?.title ?? "roadmap"}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      window.print();
    }
    setDownloading(false);
  };

  if (error) return (
    <div style={{ padding: 32, color: "#f85149", fontFamily: "monospace", background: "#0d1117", borderRadius: 12 }}>
      ⚠ {error}
    </div>
  );
  if (!data) return (
    <div style={{ padding: 32, color: "#6e7681", background: "#0d1117", borderRadius: 12, textAlign: "center" }}>
      Loading roadmap…
    </div>
  );
  if (!data.nodes || !data.edges) return (
    <div style={{ padding: 32, color: "#f85149", fontFamily: "monospace", background: "#0d1117", borderRadius: 12 }}>
      ⚠ YAML mein 'nodes' ya 'edges' missing hai. Structure check karo.
    </div>
  );

  // ── Build graph ──────────────────────────────────────────────────────────────
  const nodeMap = new Map<string, RawNode>(data.nodes.map(n => [n.id, n]));
  const solidEdges = data.edges.filter(e => !e.style || e.style === "solid");
  const dashedEdges = data.edges.filter(e => e.style === "dashed");
  const solidTargets = new Set(solidEdges.map(e => e.to));
  const solidSources = new Set(solidEdges.map(e => e.from));
  const roots = [...solidSources].filter(id => !solidTargets.has(id));

  const mainChain: string[] = [];
  const visited = new Set<string>();
  function walk(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    mainChain.push(id);
    solidEdges.filter(e => e.from === id).forEach(e => walk(e.to));
  }
  (roots.length > 0 ? roots : [data.nodes[0]?.id]).forEach(walk);
  data.nodes.forEach(n => {
    if (!visited.has(n.id) && !dashedEdges.some(e => e.to === n.id)) walk(n.id);
  });

  const sideBranchMap = new Map<string, { left: RawNode[]; right: RawNode[] }>();
  dashedEdges.forEach((e) => {
    if (!sideBranchMap.has(e.from)) sideBranchMap.set(e.from, { left: [], right: [] });
    const branch = sideBranchMap.get(e.from)!;
    const node = nodeMap.get(e.to);
    if (!node) return;
    const allSideEdges = dashedEdges.filter(x => x.from === e.from);
    const idx = allSideEdges.indexOf(e);
    if (idx % 2 === 0) branch.left.push(node); else branch.right.push(node);
  });

  const mainChainNodes = mainChain.map(id => nodeMap.get(id)).filter(Boolean) as RawNode[];
  const allNodeIds = data.nodes.map(n => n.id);
  const totalNodes = allNodeIds.length;
  const doneNodes = allNodeIds.filter(id => completed.has(id)).length;

  // ── DEV MODE: Complete all instantly for testing ──
  const devCompleteAll = () => {
    const allIds = new Set(data.nodes.map(n => n.id));
    setCompleted(allIds);
    localStorage.setItem(`roadmap-progress-${data.title}`, JSON.stringify([...allIds]));
    const allVP: NodeVideoState = {};
    data.nodes.forEach(n => {
      n.resources?.filter(r => r.type === "Video" && extractYouTubeId(r.url)).forEach(r => {
        allVP[r.url] = { watchedSeconds: 100, totalSeconds: 100, completed: true };
      });
    });
    setVideoProgress(allVP);
    localStorage.setItem(`roadmap-video-${data.title}`, JSON.stringify(allVP));
  };
  const devReset = () => {
    setCompleted(new Set());
    setVideoProgress({});
    localStorage.removeItem(`roadmap-progress-${data.title}`);
    localStorage.removeItem(`roadmap-video-${data.title}`);
  };

  const stageStats = mainChainNodes.map(node => {
    const branches = sideBranchMap.get(node.id);
    const sideNodes = [...(branches?.left ?? []), ...(branches?.right ?? [])];
    const stageIds = [node.id, ...sideNodes.map(n => n.id)];
    const stageDone = stageIds.filter(id => completed.has(id)).length;
    return { label: node.label.replace(/^[^\w\s]*\s*/, ""), done: stageDone, total: stageIds.length };
  });

  const activeNotes = activeModal ? (notes[activeModal.nodeId] || "") : "";

  return (
    <div style={{
      background: "#0d1117", borderRadius: 12, padding: "40px 32px 56px",
      fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: 400,
    }}>
      {/* ── DEV MODE TOOLBAR ── remove before production */}
      {process.env.NODE_ENV === "development" && (
        <div style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 9998,
          display: "flex", flexDirection: "column", gap: 8,
          background: "#1a1a2e", border: "1px solid #f59e0b",
          borderRadius: 10, padding: "12px 14px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
        }}>
          <div style={{ color: "#f59e0b", fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 2 }}>
            🛠 DEV MODE
          </div>
          <button onClick={devCompleteAll} style={{
            background: "#238636", border: "1px solid #2ea043", color: "#fff",
            padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700,
          }}>
            ⚡ Complete All (Test Quiz)
          </button>
          <button onClick={devReset} style={{
            background: "#21262d", border: "1px solid #f85149", color: "#f85149",
            padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700,
          }}>
            🔄 Reset Progress
          </button>
          <div style={{ color: "#484f58", fontSize: 10, textAlign: "center" }}>
            {doneNodes}/{totalNodes} done
          </div>
        </div>
      )}

      {/* Video Modal */}
      {activeModal && (
        <VideoModal
          resource={activeModal.resource}
          nodeId={activeModal.nodeId}
          videoProgress={videoProgress}
          onProgressUpdate={(url, progress) => handleVideoProgress(activeModal.nodeId, url, progress)}
          onClose={() => setActiveModal(null)}
          notes={activeNotes}
          onNotesChange={(val) => handleNotesChange(activeModal.nodeId, val)}
        />
      )}

      <ProgressHeader
        title={data.title}
        total={totalNodes}
        done={doneNodes}
        onDownload={handleDownload}
        downloading={downloading}
      />

      <div ref={roadmapRef} style={{ background: "#0d1117", padding: "20px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ color: "#e6edf3", fontSize: 20, fontWeight: 700, margin: 0 }}>{data.title}</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, position: "relative" }}>
          {mainChainNodes.map((node, idx) => {
            const branches = sideBranchMap.get(node.id);
            const isLast = idx === mainChainNodes.length - 1;
            return (
              <React.Fragment key={node.id}>
                <div style={{ display: "flex", justifyContent: "center", width: "100%", zIndex: 2 }}>
                  <MainNode
                    node={node}
                    completed={completed.has(node.id)}
                    onToggle={() => toggleNode(node.id)}
                    videoProgress={videoProgress}
                    onVideoOpen={(r) => handleVideoOpen(node.id, r)}
                  />
                </div>

                {branches && (branches.left.length > 0 || branches.right.length > 0) && (
                  <SideBranch
                    leftNodes={branches.left}
                    rightNodes={branches.right}
                    completed={completed}
                    onToggle={toggleNode}
                    videoProgress={videoProgress}
                    onVideoOpen={(r) => {
                      const allSide = [...(branches.left || []), ...(branches.right || [])];
                      const sideNode = allSide.find(n => n.resources?.some(res => res.url === r.url));
                      if (sideNode) handleVideoOpen(sideNode.id, r);
                    }}
                  />
                )}

                {!isLast && !branches && <Connector />}
                {!isLast && branches && <div style={{ height: 8 }} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <StageSummary stages={stageStats} />

      {/* Notes Summary Panel */}
      {Object.entries(notes).some(([, v]) => v.trim()) && (
        <div style={{
          maxWidth: 700, margin: "24px auto 0",
          background: "#161b22", border: "1px solid #30363d",
          borderRadius: 12, padding: "20px 24px",
        }}>
          <h3 style={{ color: "#8b949e", fontSize: 13, fontWeight: 600, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 1 }}>
            📝 My Notes
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(notes).map(([nodeId, note]) => {
              if (!note.trim()) return null;
              const node = data.nodes.find(n => n.id === nodeId);
              return (
                <div key={nodeId} style={{ borderLeft: "3px solid #4dc9a8", paddingLeft: 12 }}>
                  <div style={{ color: "#4dc9a8", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                    {node?.label || nodeId}
                  </div>
                  <div style={{ color: "#c9d1d9", fontSize: 12, lineHeight: 1.6, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                    {note}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Quiz & Certificate Section ── */}
      {doneNodes === totalNodes && totalNodes > 0 ? (
        <div style={{ marginTop: 40 }}>
          {/* Unlock banner */}
          <div style={{
            maxWidth: 700, margin: "0 auto 8px",
            background: "linear-gradient(135deg, #0a2a1a 0%, #0d1f2d 100%)",
            border: "1px solid #3fb950",
            borderRadius: 12, padding: "16px 24px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 28 }}>🏆</span>
            <div>
              <div style={{ color: "#3fb950", fontWeight: 800, fontSize: 15 }}>
                Roadmap 100% Complete! Final Quiz Unlock Ho Gaya
              </div>
              <div style={{ color: "#6e9970", fontSize: 12, marginTop: 2 }}>
                20 questions • 75% minimum • Certificate milega pass karne pe
              </div>
            </div>
          </div>
          <QuizAndCertificate
            roadmapTitle={data.title}
            topicContext={data.nodes.map(n => n.label).join(", ")}
          />
        </div>
      ) : (
        /* Locked quiz teaser */
        <div style={{
          maxWidth: 700, margin: "32px auto 0",
          background: "#0d1117",
          border: "1px dashed #30363d",
          borderRadius: 12, padding: "20px 24px",
          display: "flex", alignItems: "center", gap: 14, opacity: 0.6,
        }}>
          <span style={{ fontSize: 32 }}>🔒</span>
          <div>
            <div style={{ color: "#8b949e", fontWeight: 600, fontSize: 14 }}>
              Final Quiz — Locked
            </div>
            <div style={{ color: "#484f58", fontSize: 12, marginTop: 2 }}>
              Sabhi {totalNodes} nodes complete karo quiz unlock karne ke liye
              ({doneNodes}/{totalNodes} done)
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ color: "#4dc9a8", fontSize: 20, fontWeight: 800 }}>
              {totalNodes > 0 ? Math.round((doneNodes / totalNodes) * 100) : 0}%
            </div>
            <div style={{ color: "#484f58", fontSize: 11 }}>complete</div>
          </div>
        </div>
      )}
    </div>
  );
}
