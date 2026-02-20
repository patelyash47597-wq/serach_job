import React, { useState, useEffect } from "react";
import {
    Smile,
    Frown,
    Meh,
    Globe,
    Save,
    Trash2,
    Zap,
    BookOpen,
    Mic,
    Lock,
} from "lucide-react";

interface AnalysisResult {
    moodScore: number;
    language: string;
}

interface DiaryEntry {
    id: number;
    title: string;
    text: string;
    timestamp: string;
    analysis: AnalysisResult;
}

// --- Simple analyzer ---
const analyzeEntry = (text: string, selectedLang: string): AnalysisResult => {
    let moodScore = 5;
    const lowerText = text.toLowerCase();

    const positiveWords = [
        "happy",
        "joy",
        "feliz",
        "joie",
        "glücklich",
        "gut",
        "good",
        "amore",
        "love",
        "खुश",
        "अच्छा",
        "आनंद",
        "मस्त",
        "मजा",
    ];
    const negativeWords = [
        "sad",
        "angry",
        "triste",
        "fâché",
        "traurig",
        "bad",
        "terrible",
        "odio",
        "hate",
        "दुखी",
        "गुस्सा",
        "बुरा",
        "खराब",
        "तनाव",
    ];

    const positiveCount = positiveWords.filter((word) =>
        lowerText.includes(word)
    ).length;
    const negativeCount = negativeWords.filter((word) =>
        lowerText.includes(word)
    ).length;

    if (positiveCount > negativeCount)
        moodScore = 7 + Math.min(3, positiveCount);
    else if (negativeCount > positiveCount)
        moodScore = 4 - Math.min(3, negativeCount);

    moodScore = Math.max(1, Math.min(10, moodScore));

    return { moodScore, language: selectedLang || "en" };
};

const languageOptions = [
    { code: "en", name: "English" },
    { code: "hi", name: "हिंदी" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "ja", name: "日本語" },
    { code: "mr", name: "मराठी" },
    { code: "ta", name: "தமிழ்" },
];

const PASSWORD_KEY = "diary_password";
const AUTH_KEY = "diary_authenticated";

type Props = {
    accountPassword?: string;
};

const Diary: React.FC<Props> = ({ accountPassword }) => {
    const [entries, setEntries] = useState<DiaryEntry[]>(() => {
        try {
            const saved = localStorage.getItem("multilingualMoodDiaryEntries");
            return saved ? (JSON.parse(saved) as DiaryEntry[]) : [];
        } catch (error) {
            console.error("Error loading diary entries:", error);
            return [];
        }
    });

    const [title, setTitle] = useState("");
    const [text, setText] = useState("");
    const [selectedLanguage, setSelectedLanguage] = useState(
        languageOptions[0].code
    );
    const [isListening, setIsListening] = useState(false);

    useEffect(() => {
        localStorage.setItem(
            "multilingualMoodDiaryEntries",
            JSON.stringify(entries)
        );
    }, [entries]);

    // Lock states
    const [passwordInput, setPasswordInput] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
        localStorage.getItem(AUTH_KEY) === "true"
    );

    const savedPasswordFromStorage =
        typeof window !== "undefined"
            ? localStorage.getItem(PASSWORD_KEY)
            : null;
    const savedPassword = accountPassword ?? savedPasswordFromStorage;

    const handleSetPassword = () => {
        if (!newPassword.trim()) return;
        localStorage.setItem(PASSWORD_KEY, newPassword);
        localStorage.setItem(AUTH_KEY, "true");
        setIsAuthenticated(true);
    };

    const handleLogin = () => {
        if (passwordInput === savedPassword) {
            localStorage.setItem(AUTH_KEY, "true");
            setIsAuthenticated(true);
        } else {
            alert("Incorrect password. Please try again.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem(AUTH_KEY);
        setIsAuthenticated(false);
        setPasswordInput("");
    };

    // --- Voice input ---
    const handleVoiceInput = () => {
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.error(
                "Speech Recognition not supported. Try Chrome or Edge."
            );
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.interimResults = false;
        recognition.continuous = false;
        recognition.lang = selectedLanguage;

        recognition.onstart = () => {
            setIsListening(true);
            console.log(`Listening started in language: ${selectedLanguage}`);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setText((prevText) =>
                prevText.trim() === "" ? transcript : prevText + " " + transcript
            );
        };

        recognition.onend = () => {
            setIsListening(false);
            console.log("Listening ended.");
        };

        recognition.onerror = (event: any) => {
            setIsListening(false);
            console.error("Speech recognition error:", event.error);
        };

        if (isListening) recognition.stop();
        else {
            try {
                recognition.start();
            } catch (e) {
                console.warn("Recognition already started or denied.", e);
            }
        }
    };

    // --- Diary actions ---
    const handleSaveEntry = () => {
        if (!text.trim()) return;

        const analysis = analyzeEntry(text, selectedLanguage);
        const newEntry: DiaryEntry = {
            id: Date.now(),
            title: title || `Entry ${entries.length + 1}`,
            text: text,
            timestamp: new Date().toISOString(),
            analysis,
        };

        setEntries([newEntry, ...entries]);
        setTitle("");
        setText("");
    };

    const handleDeleteEntry = (id: number) => {
        setEntries(entries.filter((e) => e.id !== id));
    };

    const getMoodIcon = (score: number) => {
        if (score >= 7) return <Smile className="w-5 h-5 text-green-500" />;
        if (score <= 4) return <Frown className="w-5 h-5 text-red-500" />;
        return <Meh className="w-5 h-5 text-yellow-500" />;
    };

    const getMoodColor = (score: number) => {
        if (score >= 8) return "bg-green-100 text-green-700";
        if (score >= 5) return "bg-yellow-100 text-yellow-700";
        return "bg-red-100 text-red-700";
    };

    // --- LOCK SCREEN ---
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-[#111827] p-6">
                <div className="bg-[#1F2937] p-6 rounded-xl shadow-md w-full max-w-md text-center border border-white/10">
                    <Lock className="w-12 h-12 text-[#2DD4BF] mx-auto mb-4" />
                    {!savedPassword ? (
                        <>
                            <h2 className="text-xl font-bold mb-2 text-gray-100">Set Diary Password</h2>
                            <input
                                type="password"
                                className="w-full border border-gray-600 bg-[#111827] text-white p-2 rounded mb-3"
                                placeholder="Create password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <button
                                onClick={handleSetPassword}
                                className="w-full bg-[#6366F1] text-white py-2 rounded hover:bg-[#4F46E5]"
                            >
                                Save Password
                            </button>
                            <p className="text-sm text-gray-400 mt-3">
                                This password is stored locally in your browser.
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold mb-2 text-gray-100">Enter Password</h2>
                            <input
                                type="password"
                                className="w-full border border-gray-600 bg-[#111827] text-white p-2 rounded mb-3"
                                placeholder="Password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                            />
                            <button
                                onClick={handleLogin}
                                className="w-full bg-[#6366F1] text-white py-2 rounded hover:bg-[#4F46E5]"
                            >
                                Unlock Diary
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // --- MAIN UI ---
    return (
        <div className="min-h-screen bg-[#111827] font-sans p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-purple-700 flex items-center justify-center gap-3">
                        <BookOpen className="w-8 h-8 text-pink-500" />
                        Multilingual Mood Journal
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Write, analyze your mood, and save in any language.
                    </p>
                </header>

                <div className="flex justify-between items-center mb-6">
                    <div />
                    <button
                        onClick={handleLogout}
                        className="bg-[#2DD4BF] text-[#111827] px-4 py-2 rounded hover:bg-[#14B8A6] text-sm"
                    >
                        Lock Diary
                    </button>
                </div>

                {/* New Entry Form */}
                <div className="bg-[#1F2937] p-6 md:p-8 rounded-2xl shadow-lg border border-white/10 mb-10">
                    <h2 className="text-2xl font-semibold mb-5 text-gray-700 border-b pb-3 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-pink-500" /> New Reflection
                    </h2>

                    <input
                        type="text"
                        placeholder="Entry Title (Optional)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl mb-4 focus:ring-purple-500 focus:border-purple-500"
                    />

                    <div className="flex gap-4 mb-4">
                        <textarea
                            placeholder="Write your thoughts..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={7}
                            className="flex-grow p-3 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 resize-none"
                        />
                        <button
                            onClick={handleVoiceInput}
                            className={`flex-shrink-0 w-16 rounded-xl shadow-lg flex items-center justify-center ${isListening
                                    ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                                    : "bg-pink-500 hover:bg-pink-600 text-white"
                                }`}
                            title={`Click to ${isListening ? "STOP" : "START"
                                } Voice Typing in ${languageOptions.find((l) => l.code === selectedLanguage)?.name ||
                                "selected language"
                                }`}
                        >
                            <Mic className="w-8 h-8" />
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <label
                                htmlFor="language-select"
                                className="text-gray-600 font-medium whitespace-nowrap flex items-center gap-1"
                            >
                                <Globe className="w-5 h-5 text-blue-500" /> Language:
                            </label>
                            <select
                                id="language-select"
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                className="p-2 border border-purple-300 rounded-lg"
                            >
                                {languageOptions.map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleSaveEntry}
                            disabled={!text.trim()}
                            className="flex items-center gap-2 bg-[#6366F1] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#4F46E5] disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            Save Entry
                        </button>
                    </div>
                </div>

                {/* Entry History */}
                <div>
                    <h2 className="text-2xl font-semibold text-gray-700 border-b pb-3 mb-6">
                        Past Reflections ({entries.length})
                    </h2>

                    {entries.length === 0 ? (
                        <div className="text-center text-gray-400 p-10 border-2 border-dashed border-[#6366F1] rounded-xl bg-[#0F172A]">
                            <BookOpen className="w-8 h-8 mx-auto mb-3 text-purple-400" />
                            <p className="text-lg font-medium">
                                Your journal is empty. Start writing your thoughts!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {entries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="bg-[#1F2937] p-5 rounded-xl shadow border border-white/10 hover:shadow-lg transition-all"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-gray-800 line-clamp-1">
                                            {entry.title}
                                        </h3>
                                        <button
                                            onClick={() => handleDeleteEntry(entry.id)}
                                            className="text-red-400 hover:text-red-600"
                                            title="Delete Entry"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <p className="text-gray-600 mb-3 text-sm italic whitespace-pre-wrap">
                                        {entry.text}
                                    </p>

                                    <div className="flex flex-wrap justify-between items-center text-xs text-gray-500 border-t pt-3 mt-3">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold ${getMoodColor(
                                                    entry.analysis.moodScore
                                                )}`}
                                            >
                                                {getMoodIcon(entry.analysis.moodScore)}
                                                Mood: {entry.analysis.moodScore}/10
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
                                                <Globe className="w-3 h-3" />
                                                {entry.analysis.language.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 mt-2 sm:mt-0">
                                            {new Date(entry.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Diary;
