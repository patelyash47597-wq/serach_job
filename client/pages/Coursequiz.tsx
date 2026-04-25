"use client";
import { useState } from "react";
import { auth, db } from "@/components/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import QuizExplainer from "@/components/QuizExplainer";

// 🔹 Quiz Data by Course & Level
const quizBank: Record<
    string,
    Record<
        string,
        { question: string; options: string[]; answer: number }[]
    >
> = {
    frontend: {
        easy: [
            {
                question: "Which HTML tag is used for the largest heading?",
                options: ["<h1>", "<heading>", "<h6>", "<head>"],
                answer: 0,
            },
            {
                question: "Which CSS property changes text color?",
                options: ["font-color", "color", "text-style", "background-color"],
                answer: 1,
            },
            {
                question: "Which tag is used to insert an image in HTML?",
                options: ["<image>", "<img>", "<picture>", "<src>"],
                answer: 1,
            },
            {
                question: "Which CSS property controls the size of text?",
                options: ["font-weight", "text-size", "font-size", "text-style"],
                answer: 2,
            },
            {
                question: "Which HTML tag is used to create a hyperlink?",
                options: ["<a>", "<link>", "<href>", "<nav>"],
                answer: 0,
            },
            {
                question: "What does CSS stand for?",
                options: [
                    "Colorful Style Sheets",
                    "Cascading Style Sheets",
                    "Computer Style Sheets",
                    "Creative Style System",
                ],
                answer: 1,
            },
            {
                question: "Which HTML tag is used for a line break?",
                options: ["<break>", "<br>", "<lb>", "<line>"],
                answer: 1,
            },
            {
                question: "Which CSS property sets the background color?",
                options: ["color", "background-color", "bgcolor", "fill"],
                answer: 1,
            },
        ],
        medium: [
            {
                question: "Which hook is used to manage state in React?",
                options: ["useData", "useEffect", "useState", "useRef"],
                answer: 2,
            },
            {
                question: "What does JSX stand for?",
                options: [
                    "JavaScript XML",
                    "Java Syntax Extension",
                    "JSON XML",
                    "JavaScript Syntax Extra",
                ],
                answer: 0,
            },
            {
                question: "Which hook runs after every render in React?",
                options: ["useMemo", "useEffect", "useRef", "useCallback"],
                answer: 1,
            },
            {
                question: "Which CSS property is used to make text bold?",
                options: ["font-style", "font-weight", "text-decoration", "font-size"],
                answer: 1,
            },
            {
                question: "Which HTML tag is used to display tabular data?",
                options: ["<data>", "<div>", "<table>", "<section>"],
                answer: 2,
            },
            {
                question: "In React, props are used to?",
                options: [
                    "Store component data",
                    "Pass data to child components",
                    "Handle side effects",
                    "Manage state",
                ],
                answer: 1,
            },
            {
                question: "Which CSS property controls the spacing inside an element?",
                options: ["margin", "border", "padding", "spacing"],
                answer: 2,
            },
        ],
        hard: [
            {
                question: "What is virtual DOM in React?",
                options: [
                    "Actual browser DOM",
                    "Lightweight copy of real DOM for diffing",
                    "Database layer",
                    "Server DOM API",
                ],
                answer: 1,
            },
            {
                question: "Which lifecycle method runs after render in class components?",
                options: [
                    "componentDidMount",
                    "shouldComponentUpdate",
                    "componentWillMount",
                    "getSnapshotBeforeUpdate",
                ],
                answer: 0,
            },
            {
                question: "What is React Fiber?",
                options: [
                    "A state management library",
                    "A new reconciliation algorithm in React",
                    "A CSS framework",
                    "A React hook",
                ],
                answer: 1,
            },
            {
                question: "Which React hook is used for performance optimization?",
                options: ["useEffect", "useCallback", "useContext", "useReducer"],
                answer: 1,
            },
            {
                question: "What does 'key' prop help with in React lists?",
                options: [
                    "Performance and correct re-rendering",
                    "Styling elements",
                    "Managing hooks",
                    "Handling events",
                ],
                answer: 0,
            },
            {
                question: "What is the default port for a React app?",
                options: ["3000", "5000", "8080", "4000"],
                answer: 0,
            },
            {
                question: "Which method is used to create context in React?",
                options: ["createHook", "createState", "createContext", "createEffect"],
                answer: 2,
            },
        ],
    },
    backend: {
        easy: [
            {
                question: "Which is a backend language?",
                options: ["React", "Node.js", "HTML", "CSS"],
                answer: 1,
            },
            {
                question: "Which database uses SQL?",
                options: ["MongoDB", "MySQL", "Firebase", "Redis"],
                answer: 1,
            },
            {
                question: "Which command starts a Node.js server?",
                options: ["npm run dev", "npm start", "node server.js", "run node"],
                answer: 2,
            },
            {
                question: "Which database is NoSQL?",
                options: ["PostgreSQL", "MongoDB", "MySQL", "SQLite"],
                answer: 1,
            },
            {
                question: "Which of these is not a backend framework?",
                options: ["Express", "Django", "Flask", "React"],
                answer: 3,
            },
            {
                question: "What does API stand for?",
                options: [
                    "Application Programming Interface",
                    "Applied Program Interaction",
                    "Advanced Protocol Interface",
                    "Application Process Integration",
                ],
                answer: 0,
            },
            {
                question: "Which protocol is used for web communication?",
                options: ["FTP", "HTTP", "SMTP", "SSH"],
                answer: 1,
            },
        ],
        medium: [
            {
                question: "Express.js is a framework for?",
                options: ["React", "Node.js", "Python", "PHP"],
                answer: 1,
            },
            {
                question: "What is REST used for?",
                options: [
                    "Designing APIs",
                    "Rendering UI",
                    "Database Querying",
                    "Debugging JS",
                ],
                answer: 0,
            },
            {
                question: "Which database is document-oriented?",
                options: ["MySQL", "MongoDB", "PostgreSQL", "SQLite"],
                answer: 1,
            },
            {
                question: "What does 'npm' stand for?",
                options: [
                    "Node Package Manager",
                    "Network Process Manager",
                    "Node Project Manager",
                    "Network Protocol Manager",
                ],
                answer: 0,
            },
            {
                question: "Which HTTP status code means 'Not Found'?",
                options: ["400", "401", "404", "500"],
                answer: 2,
            },
            {
                question: "Which module handles file operations in Node.js?",
                options: ["path", "fs", "http", "os"],
                answer: 1,
            },
            {
                question: "Which command initializes a Node.js project?",
                options: ["node init", "npm create", "npm init", "node start"],
                answer: 2,
            },
        ],
        hard: [
            {
                question: "Which HTTP method is idempotent?",
                options: ["POST", "PUT", "DELETE", "GET"],
                answer: 3,
            },
            {
                question: "ORM stands for?",
                options: [
                    "Object Relational Mapping",
                    "Open Resource Management",
                    "Object Resource Model",
                    "Operational Relational Method",
                ],
                answer: 0,
            },
            {
                question: "Which Node.js module handles HTTPS requests?",
                options: ["fs", "path", "https", "dns"],
                answer: 2,
            },
            {
                question: "What does middleware do in Express?",
                options: [
                    "Handles requests and responses before final route",
                    "Connects frontend and backend",
                    "Compiles JavaScript",
                    "Stores session data",
                ],
                answer: 0,
            },
            {
                question: "Which database supports ACID properties?",
                options: ["MongoDB", "MySQL", "Firebase", "Cassandra"],
                answer: 1,
            },
            {
                question: "What is JWT mainly used for?",
                options: [
                    "Storing user data",
                    "Authenticating users",
                    "Creating APIs",
                    "Encrypting databases",
                ],
                answer: 1,
            },
            {
                question: "What is the default port for MongoDB?",
                options: ["8080", "27017", "3000", "5000"],
                answer: 1,
            },
        ],
    },
};


export default function CourseQuiz() {
    const [course, setCourse] = useState("");
    const [level, setLevel] = useState("");
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [score, setScore] = useState<number | null>(null);
    const [start, setStart] = useState(false);
    const [wrongAnswer, setWrongAnswer] = useState<{   
        question: string;
        userAnswer: string;
        correctAnswer: string;
    } | null>(null);

    const handleStart = () => {
        if (!course || !level) {
            alert("Please select both course and difficulty level!");
            return;
        }
        setStart(true);
        setCurrent(0);
        setAnswers([]);
        setScore(null);
    };

    const handleAnswer = (index: number) => {
        const newAns = [...answers];
        newAns[current] = index;
        setAnswers(newAns);
    };


        const next = async () => {
            if (answers[current] === undefined)
                return alert("Please select an answer!");

            const currentQuiz = quizBank[course][level];
            const isCorrect = answers[current] === currentQuiz[current].answer;
            if (!isCorrect) {
                setWrongAnswer({
                    question: currentQuiz[current].question,
                    userAnswer: currentQuiz[current].options[answers[current]],
                    correctAnswer: currentQuiz[current].options[currentQuiz[current].answer],
                });
            }

            const totalQ = currentQuiz.length;
            if (current === totalQ - 1) {
                const total = currentQuiz.reduce(
                    (acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0),
                    0
                );
                setScore(total);

                const user = auth.currentUser;
                if (user) {
                    const quizRef = collection(db, "users", user.uid, "quizzes");
                    await addDoc(quizRef, {
                        course,
                        level,
                        score: total,
                        total: totalQ,
                        timestamp: new Date(),
                    });
                }
            } else {
                setCurrent(current + 1);
            }
        };

    const prev = () => current > 0 && setCurrent(current - 1);

    // 🟢 Step 1: Course + Level Selection
    if (!start)
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-[#111827] p-4">
                <div className="backdrop-blur-lg bg-[#1F2937]/80 shadow-2xl rounded-3xl p-10 max-w-lg w-full text-center border border-white/10 animate-fadeIn">
                    <h1 className="text-4xl font-bold mb-8 text-[#2DD4BF]">
                        🎓 Start Your Quiz
                    </h1>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-lg font-semibold text-gray-300 mb-2">
                                Select Course
                            </label>
                            <select
                                value={course}
                                onChange={(e) => setCourse(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-600 bg-[#111827] text-white shadow-sm focus:ring-2 focus:ring-[#6366F1] focus:outline-none"
                            >
                                <option value="">-- Choose a Course --</option>
                                {Object.keys(quizBank).map((c) => (
                                    <option key={c} value={c} className="capitalize" >
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-lg font-semibold text-gray-300 mb-2">
                                Select Level
                            </label>
                            <select
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-600 bg-[#111827] text-white shadow-sm focus:ring-2 focus:ring-[#6366F1] focus:outline-none"
                            >
                                <option value="">-- Choose Difficulty --</option>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>

                        <button
                            onClick={handleStart}
                            className="w-full mt-6 bg-indigo-600 text-black text-lg font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-all duration-300 shadow-lg"
                        >
                            🚀 Start Quiz
                        </button>
                    </div>
                </div>

                <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-out forwards;
          }
        `}</style>
            </div>
        );

    // 🧠 Step 2: Quiz Questions
    const quiz = quizBank[course][level];
    const q = quiz[current];

    if (score !== null)
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#111827] p-4">
                <div className="bg-[#1F2937] shadow-2xl rounded-3xl p-10 text-center max-w-xl w-full animate-fadeIn border border-white/10">
                    <h2 className="text-3xl font-bold text-green-400 mb-4">
                        🎉 Quiz Completed!
                    </h2>
                    <p className="text-xl text-gray-300 mb-6">
                        You scored{" "}
                        <span className="font-bold">
                            {score} / {quiz.length}
                        </span>
                    </p>
                    <button
                        onClick={() => {
                            setStart(false);
                            setCourse("");
                            setLevel("");
                        }}
                        className="bg-[#6366F1] text-white px-8 py-3 rounded-xl hover:bg-[#4F46E5] transition-all duration-300 font-semibold shadow-md"
                    >
                        🔁 Try Another Quiz
                    </button>
                </div>
            </div>
        );

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#111827] p-4">
            <div className="bg-[#1F2937] shadow-2xl rounded-3xl p-10 max-w-4xl w-full animate-fadeIn border border-white/10">
                <h2 className="text-center text-4xl font-extrabold mb-8 text-[#2DD4BF] capitalize">
                    {course} ({level}) Quiz
                </h2>

                <div className="mb-6">
                    <h3 className="text-2xl font-semibold text-gray-100 mb-4">
                        {current + 1}. {q.question}
                    </h3>

                    <div className="grid gap-4 md:gap-6">
                        {q.options.map((opt, i) => (
                            <label
                                key={i}
                                className={`block px-5 py-4 rounded-xl cursor-pointer transition-all duration-300 ${answers[current] === i
                                    ? "bg-[#6366F1] border-2 border-[#2DD4BF]"
                                    : "bg-[#111827] border border-gray-600 hover:bg-[#0F172A]"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    checked={answers[current] === i}
                                    onChange={() => handleAnswer(i)}
                                    className="mr-3 accent-[#6366F1] scale-125"
                                />
                                <span className="text-gray-100 text-lg">{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>
                {wrongAnswer && (
                    <QuizExplainer
                        question={wrongAnswer.question}
                        userAnswer={wrongAnswer.userAnswer}
                        correctAnswer={wrongAnswer.correctAnswer}
                        onClose={() => setWrongAnswer(null)}
                    />
                )}
                <div className="flex justify-between mt-8">
                    <button
                        onClick={prev}
                        disabled={current === 0}
                        className={`px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 ${current === 0
                            ? "bg-gray-700 cursor-not-allowed"
                            : "bg-[#6366F1] hover:bg-[#4F46E5] shadow-md"
                            }`}
                    >
                        ← Prev
                    </button>

                    <button
                        onClick={next}
                        className="px-6 py-3 rounded-xl bg-[#6366F1] text-white hover:bg-[#4F46E5] shadow-md font-semibold transition-all duration-300"
                    >
                        {current === quiz.length - 1 ? "Submit" : "Next →"}
                    </button>
                </div>
            </div>
        </div>
    );
}
