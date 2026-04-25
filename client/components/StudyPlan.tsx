// components/StudyPlan.tsx
"use client";
import { useEffect, useState } from "react";
import { askAI } from "@/hooks/useAI";
import { auth, db } from "@/components/firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

interface DayPlan {
    day: string;
    task: string;
    duration: string;
    priority: "high" | "medium" | "low";
}

interface PlanData {
    summary: string;
    strongTopics: string[];
    weakTopics: string[];
    weeklyPlan: DayPlan[];
    tip: string;
}

const PRIORITY_COLOR = {
    high: { bg: "#2d1010", text: "#f85149", border: "#f8514933" },
    medium: { bg: "#2d1f00", text: "#f59e0b", border: "#f59e0b33" },
    low: { bg: "#0d2818", text: "#3fb950", border: "#3fb95033" },
};

export default function StudyPlan() {
    const [plan, setPlan] = useState<PlanData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeDay, setActiveDay] = useState(0);

    const generatePlan = async () => {
        setLoading(true);
        setError("");

        try {
            // Fetch quiz history from Firestore
            const user = auth.currentUser;
            if (!user) throw new Error("Please login first");

            const quizRef = query(
                collection(db, "users", user.uid, "quizzes"),
                orderBy("timestamp", "asc")
            );
            const snapshot = await getDocs(quizRef);
            const quizHistory = snapshot.docs.map(doc => {
                const d = doc.data();
                return {
                    course: d.course,
                    level: d.level,
                    percent: Math.round((d.score / d.total) * 100),
                    date: d.timestamp?.seconds
                        ? new Date(d.timestamp.seconds * 1000).toLocaleDateString()
                        : "N/A",
                };
            });

            if (quizHistory.length === 0) {
                setError("No quiz data found! Take some quizzes first.");
                setLoading(false);
                return;
            }

            const raw = await askAI({ mode: "study-plan", quizHistory });

            // Parse JSON from response
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Invalid AI response");
            const parsed: PlanData = JSON.parse(jsonMatch[0]);
            setPlan(parsed);

        } catch (e: any) {
            setError(e.message ?? "Failed to generate plan");
        }
        setLoading(false);
    };

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
        <div style={{
            background: "#0d1117", borderRadius: 16,
            border: "1px solid #30363d", overflow: "hidden",
            fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}>
            <style>{`
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .day-btn:hover { border-color: #4dc9a8 !important; color: #4dc9a8 !important; }
        .regen-btn:hover { background: #2ea043 !important; }
      `}</style>

            {/* Header */}
            <div style={{
                background: "linear-gradient(135deg, #161b22 0%, #1a2332 100%)",
                padding: "24px 28px", borderBottom: "1px solid #21262d",
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <h2 style={{ color: "#e6edf3", fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>
                            🧠 Your Personalized Study Plan
                        </h2>
                        <p style={{ color: "#8b949e", fontSize: 13, margin: 0 }}>
                            AI-generated based on your quiz performance
                        </p>
                    </div>
                    <button
                        className="regen-btn"
                        onClick={generatePlan}
                        disabled={loading}
                        style={{
                            background: loading ? "#21262d" : "#238636",
                            border: "1px solid " + (loading ? "#30363d" : "#2ea043"),
                            color: loading ? "#8b949e" : "#fff",
                            padding: "10px 20px", borderRadius: 8,
                            fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                            transition: "all .2s", display: "flex", alignItems: "center", gap: 8,
                        }}
                    >
                        {loading ? (
                            <>
                                <div style={{ width: 14, height: 14, border: "2px solid #8b949e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                Generating…
                            </>
                        ) : plan ? "🔄 Regenerate Plan" : "✨ Generate My Study Plan"}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: "24px 28px" }}>
                {!plan && !loading && !error && (
                    <div style={{ textAlign: "center", padding: "48px 0" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                        <p style={{ color: "#8b949e", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                            Click the button above to generate your personalized<br />7-day study plan based on your quiz history.
                        </p>
                        <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
                            {["Identifies weak topics", "Creates daily schedule", "Prioritizes tasks"].map(f => (
                                <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, color: "#4dc9a8", fontSize: 12 }}>
                                    <span>✓</span><span>{f}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {loading && (
                    <div style={{ padding: "48px 0", textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
                            {[0, 1, 2].map(i => (
                                <div key={i} style={{
                                    width: 10, height: 10, borderRadius: "50%", background: "#4dc9a8",
                                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                                }} />
                            ))}
                        </div>
                        <p style={{ color: "#8b949e", fontSize: 14 }}>AI is analyzing your performance…</p>
                    </div>
                )}

                {error && (
                    <div style={{ background: "#200d0d", border: "1px solid #f8514933", borderRadius: 10, padding: "14px 18px", color: "#f85149", fontSize: 13 }}>
                        ⚠️ {error}
                    </div>
                )}

                {plan && !loading && (
                    <div style={{ animation: "fadeIn .4s ease" }}>
                        {/* Summary */}
                        <div style={{
                            background: "#161b22", border: "1px solid #30363d",
                            borderRadius: 12, padding: "16px 20px", marginBottom: 20,
                        }}>
                            <p style={{ color: "#c9d1d9", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                                📋 {plan.summary}
                            </p>
                        </div>

                        {/* Strong / Weak topics */}
                        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                            <div style={{ flex: 1, minWidth: 180, background: "#0d2818", border: "1px solid #3fb95033", borderRadius: 10, padding: "14px 16px" }}>
                                <div style={{ color: "#3fb950", fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>💪 Strong Topics</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {plan.strongTopics.map(t => (
                                        <span key={t} style={{ background: "#3fb95022", color: "#3fb950", fontSize: 11, padding: "3px 10px", borderRadius: 20, border: "1px solid #3fb95044" }}>{t}</span>
                                    ))}
                                </div>
                            </div>
                            <div style={{ flex: 1, minWidth: 180, background: "#2d1010", border: "1px solid #f8514933", borderRadius: 10, padding: "14px 16px" }}>
                                <div style={{ color: "#f85149", fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>⚡ Needs Practice</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {plan.weakTopics.map(t => (
                                        <span key={t} style={{ background: "#f8514922", color: "#f85149", fontSize: 11, padding: "3px 10px", borderRadius: 20, border: "1px solid #f8514944" }}>{t}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 7-Day Plan */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ color: "#8b949e", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>📅 7-Day Schedule</div>

                            {/* Day selector */}
                            <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
                                {plan.weeklyPlan.map((d, i) => (
                                    <button
                                        key={i}
                                        className="day-btn"
                                        onClick={() => setActiveDay(i)}
                                        style={{
                                            padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                                            background: activeDay === i ? "#1a2332" : "#161b22",
                                            border: `1px solid ${activeDay === i ? "#4dc9a8" : "#30363d"}`,
                                            color: activeDay === i ? "#4dc9a8" : "#8b949e",
                                            fontSize: 12, fontWeight: activeDay === i ? 600 : 400,
                                            flexShrink: 0, transition: "all .15s",
                                        }}
                                    >
                                        {days[i] ?? d.day.slice(0, 3)}
                                    </button>
                                ))}
                            </div>

                            {/* Active day detail */}
                            {plan.weeklyPlan[activeDay] && (() => {
                                const d = plan.weeklyPlan[activeDay];
                                const pc = PRIORITY_COLOR[d.priority] ?? PRIORITY_COLOR.medium;
                                return (
                                    <div style={{
                                        background: "#161b22", border: "1px solid #30363d",
                                        borderRadius: 12, padding: "20px", animation: "fadeIn .2s ease",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                            <div style={{ color: "#e6edf3", fontWeight: 600, fontSize: 15 }}>
                                                {d.day}
                                            </div>
                                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                <span style={{ color: "#8b949e", fontSize: 12 }}>⏱ {d.duration}</span>
                                                <span style={{
                                                    fontSize: 11, padding: "2px 10px", borderRadius: 20,
                                                    background: pc.bg, color: pc.text, border: `1px solid ${pc.border}`,
                                                    fontWeight: 600, textTransform: "capitalize",
                                                }}>
                                                    {d.priority}
                                                </span>
                                            </div>
                                        </div>
                                        <p style={{ color: "#c9d1d9", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                                            {d.task}
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Tip */}
                        <div style={{
                            background: "linear-gradient(135deg, #1a2332, #161b22)",
                            border: "1px solid #4dc9a833", borderRadius: 12,
                            padding: "14px 18px", display: "flex", gap: 10, alignItems: "flex-start",
                        }}>
                            <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
                            <p style={{ color: "#4dc9a8", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                                {plan.tip}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}