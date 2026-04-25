// components/QuizExplainer.tsx
"use client";
import { useState } from "react";
import { askAI } from "@/hooks/useAI";

interface QuizExplainerProps {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    onClose: () => void;
}

export default function QuizExplainer({ question, userAnswer, correctAnswer, onClose }: QuizExplainerProps) {
    const [explanation, setExplanation] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    const fetchExplanation = async () => {
        if (fetched) return;
        setLoading(true);
        setFetched(true);
        try {
            const reply = await askAI({ mode: "quiz-explain", question, userAnswer, correctAnswer });
            setExplanation(reply);
        } catch {
            setExplanation("⚠️ Could not load explanation. Please try again.");
        }
        setLoading(false);
    };

    // Auto-fetch on mount
    useState(() => { fetchExplanation(); });

    const renderMarkdown = (text: string) =>
        text
            .replace(/\*\*(.+?)\*\*/g, "<strong style='color:#e6edf3'>$1</strong>")
            .replace(/`([^`]+)`/g, `<code style="background:#0d1117;padding:2px 6px;border-radius:4px;font-size:12px;color:#4dc9a8;font-family:monospace">$1</code>`)
            .replace(/^- (.+)/gm, `<div style="display:flex;gap:8px;margin:4px 0"><span style="color:#f85149">•</span><span>$1</span></div>`)
            .replace(/\n/g, "<br/>");

    return (
        <div style={{
            marginTop: 12, background: "#161b22",
            border: "1px solid #f85149", borderRadius: 12,
            overflow: "hidden", animation: "fadeIn .3s ease",
        }}>
            <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }`}</style>

            {/* Header */}
            <div style={{
                background: "#200d0d", padding: "12px 16px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: "1px solid #f8514922",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🤖</span>
                    <span style={{ color: "#f85149", fontWeight: 600, fontSize: 13 }}>AI Explanation</span>
                </div>
                <button onClick={onClose} style={{ background: "none", border: "none", color: "#8b949e", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>

            {/* Answer summary */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #21262d", display: "flex", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 10, color: "#8b949e", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>Your Answer</div>
                    <div style={{ fontSize: 13, color: "#f85149", fontWeight: 500 }}>✗ {userAnswer}</div>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 10, color: "#8b949e", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>Correct Answer</div>
                    <div style={{ fontSize: 13, color: "#3fb950", fontWeight: 500 }}>✓ {correctAnswer}</div>
                </div>
            </div>

            {/* Explanation */}
            <div style={{ padding: "14px 16px" }}>
                {loading ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#8b949e", fontSize: 13 }}>
                        <div style={{ display: "flex", gap: 3 }}>
                            {[0, 1, 2].map(i => (
                                <div key={i} style={{
                                    width: 6, height: 6, borderRadius: "50%", background: "#4dc9a8",
                                    animation: "pulse 1.2s ease-in-out infinite",
                                    animationDelay: `${i * 0.2}s`,
                                }} />
                            ))}
                        </div>
                        AI is analyzing your answer…
                    </div>
                ) : (
                    <div
                        style={{ fontSize: 13, color: "#c9d1d9", lineHeight: 1.7 }}
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(explanation) }}
                    />
                )}
            </div>
        </div>
    );
}