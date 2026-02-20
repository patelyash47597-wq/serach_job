"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/components/firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import {
    LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, BarChart, Bar,
} from "recharts";

interface QuizData {
    course: string;
    level: string;
    score: number;
    total: number;
    percent: number;
    date: string;
}

export default function ProgressReport() {
    const [data, setData] = useState<QuizData[]>([]);
    const [viewType, setViewType] = useState<"line" | "bar">("line");

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                console.log("No user logged in");
                return;
            }

            console.log("User detected:", user.uid);

            const quizRef = query(
                collection(db, "users", user.uid, "quizzes"),
                orderBy("timestamp", "asc")
            );

            const snapshot = await getDocs(quizRef);

            console.log("Docs found:", snapshot.size);

            const quizData: QuizData[] = snapshot.docs.map((doc) => {
                const d = doc.data();
                console.log("Doc:", d);
                return {
                    course: d.course,
                    level: d.level,
                    score: d.score,
                    total: d.total,
                    percent: Math.round((d.score / d.total) * 100),
                    date: d.timestamp?.seconds
                        ? new Date(d.timestamp.seconds * 1000).toLocaleDateString()
                        : "N/A",
                };
            });

            setData(quizData);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="min-h-screen bg-[#111827] p-8 flex flex-col items-center">
            <h1 className="text-4xl font-bold text-[#2DD4BF] mb-6">
                📊 Your Quiz Progress Report
            </h1>

            <div className="mb-6">
                <button
                    className={`px-4 py-2 rounded-l-lg ${viewType === "line"
                        ? "bg-[#6366F1] text-white"
                        : "bg-[#1F2937] text-gray-300"
                        }`}
                    onClick={() => setViewType("line")}
                >
                    Line Chart
                </button>

                <button
                    className={`px-4 py-2 rounded-r-lg ${viewType === "bar"
                        ? "bg-[#6366F1] text-white"
                        : "bg-[#1F2937] text-gray-300"
                        }`}
                    onClick={() => setViewType("bar")}
                >
                    Bar Chart
                </button>
            </div>

            <div className="bg-[#1F2937] shadow-2xl rounded-2xl p-6 w-full max-w-4xl border border-white/10">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        {viewType === "line" ? (
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />   {/* ✅ Date on X-axis */}
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="percent"
                                    stroke="#8b5cf6"
                                    activeDot={{ r: 8 }}
                                    name="Score %"
                                />
                            </LineChart>
                        ) : (
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="percent" fill="#8b5cf6" name="Score %" />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                ) : (
                    <p className="text-gray-400 text-center">
                        No quiz data found. Take some quizzes to view your progress 📘
                    </p>
                )}
            </div>
        </div>
    );
}