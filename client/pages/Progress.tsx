"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/components/firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import {
    LineChart, Line, BarChart, Bar, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

interface QuizData {
    course: string;
    level: string;
    score: number;
    total: number;
    percent: number;
    date: string;
    timestamp: number;
}

const COURSE_COLORS = [
    "#8b5cf6", "#2dd4bf", "#f59e0b", "#f43f5e", "#3b82f6", "#10b981", "#f97316"
];

// Level ke liye alag colors
const LEVEL_COLORS: Record<string, string> = {
    easy: "#10b981",  // green
    beginner: "#10b981",
    medium: "#f59e0b",  // amber
    intermediate: "#f59e0b",
    hard: "#f43f5e",  // red
    advanced: "#f43f5e",
};

function getLevelColor(level: string) {
    return LEVEL_COLORS[level?.toLowerCase()] ?? "#8b5cf6";
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function AllModeTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, padding: "10px 14px" }}>
            <p style={{ color: "#D1D5DB", marginBottom: 6, fontWeight: 600 }}>{label}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} style={{ marginBottom: 2 }}>
                    <span style={{ color: p.stroke ?? p.fill, fontSize: 13 }}>
                        {p.dataKey}: <strong>{p.value}%</strong>
                    </span>
                    {p.payload[`${p.dataKey}_level`] && (
                        <span style={{
                            marginLeft: 8, fontSize: 11, padding: "1px 7px", borderRadius: 999,
                            background: getLevelColor(p.payload[`${p.dataKey}_level`]) + "33",
                            color: getLevelColor(p.payload[`${p.dataKey}_level`]),
                            fontWeight: 600, textTransform: "capitalize"
                        }}>
                            {p.payload[`${p.dataKey}_level`]}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

function SingleCourseTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload as QuizData;
    return (
        <div style={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, padding: "10px 14px" }}>
            <p style={{ color: "#D1D5DB", marginBottom: 4, fontWeight: 600 }}>{label}</p>
            <p style={{ color: "#fff", fontSize: 13 }}>Score: <strong>{d?.percent}%</strong>
                <span style={{ marginLeft: 6, color: "#9CA3AF", fontSize: 11 }}>({d?.score}/{d?.total})</span>
            </p>
            <p style={{ marginTop: 4 }}>
                <span style={{
                    fontSize: 11, padding: "2px 9px", borderRadius: 999,
                    background: getLevelColor(d?.level) + "33",
                    color: getLevelColor(d?.level), fontWeight: 600, textTransform: "capitalize"
                }}>
                    {d?.level}
                </span>
                <span style={{ color: "#6B7280", fontSize: 11, marginLeft: 6 }}>{d?.date}</span>
            </p>
        </div>
    );
}

// ── Custom Bar Label (level badge on top of bar) ──────────────────────────────
function LevelLabel(props: any) {
    const { x, y, width, value } = props;
    if (!value) return null;
    const short: Record<string, string> = {
        easy: "E", beginner: "E", medium: "M", intermediate: "M", hard: "H", advanced: "H"
    };
    const label = short[value?.toLowerCase()] ?? value?.[0]?.toUpperCase() ?? "?";
    return (
        <text
            x={x + width / 2} y={y - 6}
            textAnchor="middle" fontSize={10} fontWeight={700}
            fill={getLevelColor(value)}
        >
            {label}
        </text>
    );
}

export default function ProgressReport() {
    const [data, setData] = useState<QuizData[]>([]);
    const [activeCourse, setActiveCourse] = useState<string>("All");
    const [viewType, setViewType] = useState<"line" | "bar">("line");

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) return;
            const quizRef = query(
                collection(db, "users", user.uid, "quizzes"),
                orderBy("timestamp", "asc")
            );
            const snapshot = await getDocs(quizRef);
            const quizData: QuizData[] = snapshot.docs.map((doc) => {
                const d = doc.data();
                const ts = d.timestamp?.seconds ? d.timestamp.seconds * 1000 : Date.now();
                return {
                    course: d.course,
                    level: d.level,
                    score: d.score,
                    total: d.total,
                    percent: Math.round((d.score / d.total) * 100),
                    date: new Date(ts).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", year: "2-digit"
                    }),
                    timestamp: ts,
                };
            });
            setData(quizData);
        });
        return () => unsubscribe();
    }, []);

    const courses = [...new Set(data.map((q) => q.course))];
    const filteredData = activeCourse === "All"
        ? data
        : data.filter((q) => q.course === activeCourse);

    // ✅ Quiz 1, Quiz 2... X-axis — har mode mein same
    const singleCourseChartData = filteredData.map((q, i) => ({
        ...q,
        label: `Quiz ${i + 1}`,
    }));

    // ✅ All mode: Quiz 1, Quiz 2... with per-course columns
    const buildAllModeData = () => {
        const byCourse: Record<string, QuizData[]> = {};
        courses.forEach((c) => { byCourse[c] = data.filter((q) => q.course === c); });
        const maxLen = Math.max(0, ...courses.map((c) => byCourse[c].length));
        return Array.from({ length: maxLen }, (_, i) => {
            const row: Record<string, any> = { label: `Quiz ${i + 1}` };
            courses.forEach((c) => {
                if (byCourse[c][i]) {
                    row[c] = byCourse[c][i].percent;
                    row[`${c}_level`] = byCourse[c][i].level;
                    row[`${c}_date`] = byCourse[c][i].date;
                }
            });
            return row;
        });
    };

    const allModeData = buildAllModeData();

    // Stats
    const avg = filteredData.length ? Math.round(filteredData.reduce((s, d) => s + d.percent, 0) / filteredData.length) : 0;
    const best = filteredData.length ? Math.max(...filteredData.map(d => d.percent)) : 0;
    const latest = filteredData.length ? filteredData[filteredData.length - 1].percent : 0;
    const activeCourseColor = COURSE_COLORS[courses.indexOf(activeCourse) % COURSE_COLORS.length] || "#8b5cf6";

    const axisStyle = { fill: "#9CA3AF", fontSize: 11 };
    const gridColor = "#374151";

    return (
        <div className="min-h-screen bg-[#111827] p-8 flex flex-col items-center">
            <h1 className="text-4xl font-bold text-[#2DD4BF] mb-2">📊 Your Quiz Progress Report</h1>
            <p className="text-gray-400 mb-6 text-sm">Course-wise score breakdown</p>

            {/* Level legend */}
            <div className="flex gap-4 mb-5 text-xs">
                {[["Easy / Beginner", "#10b981"], ["Medium / Intermediate", "#f59e0b"], ["Hard / Advanced", "#f43f5e"]].map(([lbl, clr]) => (
                    <span key={lbl} className="flex items-center gap-1.5">
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: clr, display: "inline-block" }} />
                        <span style={{ color: "#9CA3AF" }}>{lbl}</span>
                    </span>
                ))}
            </div>

            {/* Course Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {["All", ...courses].map((course) => (
                    <button
                        key={course}
                        onClick={() => setActiveCourse(course)}
                        className={`px-4 py-1.5 rounded-full text-sm border transition-all ${activeCourse === course
                                ? "bg-[#6366F1] text-white border-[#6366F1]"
                                : "bg-[#1F2937] text-gray-300 border-white/10 hover:border-white/30"
                            }`}
                    >
                        {course}
                    </button>
                ))}
            </div>

            {/* Stats Cards */}
            {activeCourse !== "All" && filteredData.length > 0 && (
                <div className="grid grid-cols-4 gap-4 w-full max-w-4xl mb-6">
                    {[
                        { label: "Average Score", value: `${avg}%` },
                        { label: "Best Score", value: `${best}%` },
                        { label: "Latest Score", value: `${latest}%` },
                        { label: "Quizzes Taken", value: filteredData.length },
                    ].map((s) => (
                        <div key={s.label} className="bg-[#1F2937] rounded-xl p-4 border border-white/10">
                            <div className="text-2xl font-semibold text-white">{s.value}</div>
                            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Chart Toggle */}
            <div className="mb-4">
                <button
                    className={`px-4 py-2 rounded-l-lg transition-all ${viewType === "line" ? "bg-[#6366F1] text-white" : "bg-[#1F2937] text-gray-300"}`}
                    onClick={() => setViewType("line")}
                >Line Chart</button>
                <button
                    className={`px-4 py-2 rounded-r-lg transition-all ${viewType === "bar" ? "bg-[#6366F1] text-white" : "bg-[#1F2937] text-gray-300"}`}
                    onClick={() => setViewType("bar")}
                >Bar Chart</button>
            </div>

            {/* Chart */}
            <div className="bg-[#1F2937] shadow-2xl rounded-2xl p-6 w-full max-w-4xl border border-white/10">
                {filteredData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={420}>
                        {viewType === "line" ? (
                            // ── LINE CHART ────────────────────────────────────────────────
                            <LineChart data={activeCourse === "All" ? allModeData : singleCourseChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                <XAxis dataKey="label" stroke="#9CA3AF" tick={axisStyle} />
                                <YAxis domain={[0, 100]} stroke="#9CA3AF" tick={axisStyle} tickFormatter={v => `${v}%`} />
                                <Tooltip content={activeCourse === "All" ? <AllModeTooltip /> : <SingleCourseTooltip />} />
                                <Legend />
                                {activeCourse === "All"
                                    ? courses.map((course, i) => (
                                        <Line key={course} type="monotone" dataKey={course}
                                            stroke={COURSE_COLORS[i % COURSE_COLORS.length]}
                                            name={course} dot={{ r: 5 }} activeDot={{ r: 8 }}
                                            strokeWidth={2} connectNulls />
                                    ))
                                    : <Line type="monotone" dataKey="percent"
                                        stroke={activeCourseColor} name="Score %"
                                        dot={(props: any) => {
                                            const { cx, cy, payload } = props;
                                            return (
                                                <circle key={payload.label}
                                                    cx={cx} cy={cy} r={6}
                                                    fill={getLevelColor(payload.level)}
                                                    stroke={getLevelColor(payload.level)}
                                                    strokeWidth={2}
                                                />
                                            );
                                        }}
                                        activeDot={{ r: 9 }} strokeWidth={2}
                                    />
                                }
                            </LineChart>
                        ) : (
                            // ── BAR CHART ─────────────────────────────────────────────────
                            <BarChart
                                data={activeCourse === "All" ? allModeData : singleCourseChartData}
                                margin={{ top: 24, right: 16, left: 0, bottom: 4 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                <XAxis dataKey="label" stroke="#9CA3AF" tick={axisStyle} />
                                <YAxis domain={[0, 100]} stroke="#9CA3AF" tick={axisStyle} tickFormatter={v => `${v}%`} />
                                <Tooltip content={activeCourse === "All" ? <AllModeTooltip /> : <SingleCourseTooltip />} />
                                <Legend />
                                {activeCourse === "All"
                                    ? courses.map((course, i) => (
                                        <Bar key={course} dataKey={course}
                                            fill={COURSE_COLORS[i % COURSE_COLORS.length]}
                                            name={course} radius={[4, 4, 0, 0]} />
                                    ))
                                    : (
                                        // ✅ Single course: har bar ka color = level color
                                        <Bar dataKey="percent" name="Score %" radius={[4, 4, 0, 0]}
                                            label={<LevelLabel dataKey="level" />}
                                        >
                                            {singleCourseChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={getLevelColor(entry.level)} />
                                            ))}
                                        </Bar>
                                    )
                                }
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                ) : (
                    <p className="text-gray-400 text-center py-16">
                        No quiz data found. Take some quizzes to view your progress 📘
                    </p>
                )}
            </div>

            {/* Bottom note */}
            {activeCourse !== "All" && viewType === "bar" && (
                <p className="text-gray-500 text-xs mt-3">
                    Bar color = difficulty level &nbsp;·&nbsp; E = Easy &nbsp;·&nbsp; M = Medium &nbsp;·&nbsp; H = Hard
                </p>
            )}
        </div>
    );
}