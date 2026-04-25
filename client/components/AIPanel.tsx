// components/AIPanel.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { askAI } from "@/hooks/useAI";

interface Message {
    role: "user" | "ai";
    content: string;
}

interface AIPanelProps {
    topic: string;
    onClose: () => void;
}

export default function AIPanel({ topic, onClose }: AIPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-explain topic on open
    useEffect(() => {
        if (initialized) return;
        setInitialized(true);
        handleAsk(`Explain: ${topic}`, true);
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const handleAsk = async (question: string, isAuto = false) => {
        if (!question.trim()) return;
        setMessages(prev => [...prev, { role: "user", content: question }]);
        if (!isAuto) setInput("");
        setLoading(true);

        try {
            const reply = await askAI({ mode: "topic", topic: question });
            setMessages(prev => [...prev, { role: "ai", content: reply }]);
        } catch {
            setMessages(prev => [...prev, { role: "ai", content: "⚠️ AI unavailable. Please try again." }]);
        }
        setLoading(false);
    };

    // Simple markdown renderer
    const renderMarkdown = (text: string) => {
        return text
            .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) =>
                `<pre style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:12px;overflow-x:auto;margin:8px 0;font-size:12px;color:#e6edf3;font-family:monospace">${code.trim()}</pre>`
            )
            .replace(/`([^`]+)`/g, `<code style="background:#161b22;padding:2px 6px;border-radius:4px;font-size:12px;color:#4dc9a8;font-family:monospace">$1</code>`)
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.+?)\*/g, "<em>$1</em>")
            .replace(/^- (.+)/gm, `<div style="display:flex;gap:8px;margin:3px 0"><span style="color:#4dc9a8;margin-top:2px">•</span><span>$1</span></div>`)
            .replace(/\n\n/g, '<div style="height:8px"></div>')
            .replace(/\n/g, "<br/>");
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
            padding: 20, pointerEvents: "none",
        }}>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", pointerEvents: "all" }}
            />

            {/* Panel */}
            <div style={{
                position: "relative", width: 420, height: "85vh",
                background: "#161b22", border: "1px solid #30363d",
                borderRadius: 16, display: "flex", flexDirection: "column",
                boxShadow: "0 25px 50px rgba(0,0,0,0.6)", pointerEvents: "all",
                animation: "slideUp .25s ease",
            }}>
                <style>{`
          @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
          @keyframes pulse { 0%,80%,100% { opacity:0.3 } 40% { opacity:1 } }
          .ai-dot { animation: pulse 1.2s ease-in-out infinite; }
          .ai-dot:nth-child(2) { animation-delay:.2s }
          .ai-dot:nth-child(3) { animation-delay:.4s }
          .send-btn:hover { background: #2ea043 !important; }
          .close-btn:hover { background: #21262d !important; }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
        `}</style>

                {/* Header */}
                <div style={{
                    padding: "16px 20px", borderBottom: "1px solid #21262d",
                    display: "flex", alignItems: "center", gap: 10,
                }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "linear-gradient(135deg, #4dc9a8, #6366f1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18, flexShrink: 0,
                    }}>🤖</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: "#e6edf3", fontWeight: 600, fontSize: 14 }}>AI Learning Assistant</div>
                        <div style={{ color: "#8b949e", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            Topic: {topic}
                        </div>
                    </div>
                    <button
                        className="close-btn"
                        onClick={onClose}
                        style={{ background: "transparent", border: "none", color: "#8b949e", cursor: "pointer", padding: "4px 8px", borderRadius: 6, fontSize: 18, lineHeight: 1 }}
                    >✕</button>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
                    {messages.map((msg, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                            {msg.role === "ai" && (
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#4dc9a8,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginRight: 8, flexShrink: 0, marginTop: 2 }}>
                                    🤖
                                </div>
                            )}
                            <div style={{
                                maxWidth: "80%", padding: "10px 14px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                background: msg.role === "user" ? "#1f6feb" : "#21262d",
                                color: "#e6edf3", fontSize: 13, lineHeight: 1.6,
                            }}
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                            />
                        </div>
                    ))}

                    {loading && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#4dc9a8,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🤖</div>
                            <div style={{ background: "#21262d", padding: "12px 16px", borderRadius: "16px 16px 16px 4px", display: "flex", gap: 4 }}>
                                {[0, 1, 2].map(i => (
                                    <div key={i} className="ai-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#4dc9a8" }} />
                                ))}
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Suggested questions */}
                {messages.length <= 1 && !loading && (
                    <div style={{ padding: "0 16px 8px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {[
                            "Give me a code example",
                            "What are common mistakes?",
                            "How is this used in real projects?",
                            "Quiz me on this topic",
                        ].map(q => (
                            <button
                                key={q}
                                onClick={() => handleAsk(q)}
                                style={{
                                    background: "#0d1117", border: "1px solid #30363d",
                                    color: "#8b949e", fontSize: 11, padding: "5px 10px",
                                    borderRadius: 20, cursor: "pointer", transition: "all .15s",
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#4dc9a8"; (e.currentTarget as HTMLElement).style.color = "#4dc9a8"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#30363d"; (e.currentTarget as HTMLElement).style.color = "#8b949e"; }}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div style={{ padding: "12px 16px", borderTop: "1px solid #21262d", display: "flex", gap: 8 }}>
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleAsk(input)}
                        placeholder="Ask anything about this topic..."
                        style={{
                            flex: 1, background: "#0d1117", border: "1px solid #30363d",
                            borderRadius: 8, padding: "9px 12px", color: "#e6edf3",
                            fontSize: 13, outline: "none", fontFamily: "inherit",
                        }}
                        onFocus={e => (e.target.style.borderColor = "#4dc9a8")}
                        onBlur={e => (e.target.style.borderColor = "#30363d")}
                    />
                    <button
                        className="send-btn"
                        onClick={() => handleAsk(input)}
                        disabled={loading || !input.trim()}
                        style={{
                            background: "#238636", border: "none", borderRadius: 8,
                            padding: "9px 14px", color: "#fff", cursor: "pointer",
                            fontSize: 16, transition: "background .2s",
                            opacity: loading || !input.trim() ? 0.5 : 1,
                        }}
                    >➤</button>
                </div>
            </div>
        </div>
    );
}