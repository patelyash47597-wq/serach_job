import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/components/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { motion } from "framer-motion";

const Header: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);

    // 🔄 Monitor auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // 🚪 Logout
    const handleLogout = async () => {
        await signOut(auth);
        navigate("/logout");
    };

    return (
        <header className="sticky top-0 z-50 bg-slate-950 text-white shadow-lg w-screen overflow-x-hidden">
            <div className="max-w-7xl mx-auto px-6 sm:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* 🌈 Logo */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        onClick={() => navigate("/")}
                        className="flex items-center gap-3 cursor-pointer flex-shrink-0"
                    >
                        <div className="text-cyan-400 size-8">
                            <svg
                                fill="currentColor"
                                viewBox="0 0 48 48"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-extrabold text-white tracking-tight">
                            CareerPath
                        </h2>
                    </motion.div>

                    {/* 🧭 Navigation Links - Centered with Teal Glow Hover */}
                    <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
                        {[
                            ["About Us", "/about"],
                            ["How it Works", "/career"],
                            ["AI-Setu", "/scan"],
                            ["Dairy", "/dashboard"],
                            ["Check-Performance", "/resources"],
                            ["Progress-Report", "/reports"],
                        ].map(([label, href]) => (
                            <motion.a
                                key={label}
                                href={href}
                                whileHover={{ scale: 1.05 }}
                                className="relative text-sm font-medium text-gray-200 
                           hover:text-cyan-300 transition-all duration-300
                           hover:shadow-[0_0_15px_rgba(34,211,238,0.5)]
                           px-3 py-2 rounded-lg"
                            >
                                {label}
                            </motion.a>
                        ))}
                    </nav>

                    {/* 👤 User / Auth Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <>
                                <div className="flex items-center gap-2 bg-cyan-100/20 px-4 py-2 rounded-full border border-cyan-300/30">
                                    <img
                                        src={user.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                        alt="User"
                                        className="w-8 h-8 rounded-full border-2 border-cyan-300"
                                    />
                                    <span className="text-sm font-semibold text-cyan-50 truncate max-w-[140px]">
                                        {user.displayName || user.email}
                                    </span>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleLogout}
                                    className="px-5 py-2 text-sm font-bold text-white bg-red-500 
                             rounded-full shadow-md hover:bg-red-600 hover:shadow-lg transition-all"
                                >
                                    Logout
                                </motion.button>
                            </>
                        ) : (
                            <>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate("/signup")}
                                    className="px-4 py-2 text-sm font-bold text-white bg-cyan-600 
                             rounded-lg shadow-md hover:bg-cyan-700 transition"
                                >
                                    Get Started
                                </motion.button>

                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate("/login")}
                                    className="px-4 py-2 text-sm font-bold text-white 
                             bg-slate-700 rounded-lg hover:bg-slate-600 transition"
                                >
                                    Log In
                                </motion.button>
                            </>
                        )}
                    </div>

                    {/* 📱 Mobile Menu Button */}
                    <div className="md:hidden">
                        <button className="p-2 rounded-md text-gray-300 hover:bg-slate-800 transition">
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16m-7 6h7"
                                ></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
