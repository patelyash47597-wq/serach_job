import React, { useEffect, useState } from "react";
import { signOut, User } from "firebase/auth";
import { auth, db } from "@/components/firebaseConfig";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Award, FolderOpen, LogOut, Edit3 } from "lucide-react";
import { storage } from "@/components/firebaseConfig";

interface SidenavProps {
  user: User | null;
}
export const Sidenav: React.FC<SidenavProps> = ({ user }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const userDoc = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(userDoc, (snap) => {
      if (snap.exists()) {
        setProfile(snap.data());
      } else {
        setDoc(userDoc, {
          name: user.displayName || "",
          email: user.email || "",
          country: "",
          photoURL: user.photoURL || "",
          skills: [],
          jobs: [],
          achievements: [],
          projects: [],
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <>
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed left-0 top-16 h-[calc(100vh-64px)] w-80
bg-[#1F2937]
backdrop-blur-xl
p-6
shadow-[0_0_40px_rgba(45,212,191,0.15)]
border-r border-white/10
transition-all duration-500 overflow-y-auto"

      >
        {/* LEFT SIDE */}
        <div className="flex flex-col items-center text-center">
          <motion.div
            whileHover={{ scale: 1.08 }}
            className="w-36 h-36 mx-auto mb-4 rounded-full
flex items-center justify-center
border-2 border-[#2DD4BF]
shadow-[0_0_25px_#2DD4BF]
overflow-hidden
bg-[#111827]"

          >
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-6xl text-white">👤</span>
            )}
          </motion.div>

          <h2 className="text-2xl font-bold text-white">
            {profile?.name || "User"}
          </h2>
          <p className="text-sm text-gray-400"></p>
          <p className="text-xs mt-1 text-gray-500 italic">
            {profile?.country || "Not added"}
          </p>

          <div className="flex flex-col gap-3 mt-6 w-full">
            <button
              onClick={() => setShowEdit(true)}
              className="py-2 w-full bg-[#6366F1] hover:bg-[#4F46E5]
text-white text-sm font-medium rounded-xl
shadow-[0_0_15px_#6366F1]
transition flex items-center justify-center gap-2"

            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>

            <button
              onClick={handleLogout}
              className="py-2 w-full bg-[#2DD4BF] hover:bg-[#14B8A6]
text-[#111827] text-sm font-medium rounded-xl
shadow-[0_0_15px_#2DD4BF]
transition flex items-center justify-center gap-2"

            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="mt-8 space-y-4">
          <Section title="Skills">
            <BadgeList list={profile?.skills} color="indigo" />
          </Section>

          <Section title="Completed Jobs">
            <EmojiList list={profile?.jobs} emoji="💼" />
          </Section>

          <Section title="Achievements">
            <EmojiList list={profile?.achievements} emoji="🏆" />
          </Section>

          <Section title="Projects">
            <EmojiList list={profile?.projects} emoji="🚀" />
          </Section>
        </div>
      </motion.aside>


      {showEdit && (
        <EditProfileModal
          user={user}
          profile={profile}
          close={() => setShowEdit(false)}
        />
      )}
    </>
  );
};

// ---------- Sub Components ----------

const Section = ({ title, children }: any) => (
  <div className="mt-8 bg-[#111827]
border border-white/10
shadow-[0_0_20px_rgba(45,212,191,0.1)]
 backdrop-blur-md rounded-3xl p-4 shadow-sm hover:shadow-lg transition border border-white/40 relative overflow-hidden">
    <div className="absolute inset-0 rounded-3xl shadow-inner shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.05)] pointer-events-none"></div>
    <div className="relative z-10">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-700 mb-2 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-500" /> {title}
      </h3>
      {children}
    </div>
  </div>
);

const BadgeList = ({ list, color }: any) => (
  <div className="flex flex-wrap   gap-3">
    {(list || []).length > 0 ? (
      list.map((item: string, i: number) => (
        <span
          key={i}
          className={`px-4 py-1.5 bg-${color}-100 text-${color}-800 rounded-full border border-${color}-300 
          text-xs font-semibold shadow-md hover:shadow-lg hover:-translate-y-1 transition-transform duration-300`}
        >
          {item}
        </span>
      ))
    ) : (
      <p className="text-gray-400 italic">No data added yet</p>
    )}
  </div>
);

const EmojiList = ({ list, emoji }: any) => (
  <ul className="list-none space-y-1 text-sm text-gray-800">
    {(list || []).length > 0 ? (
      list.map((item: string, i: number) => (
        <li key={i} className="flex items-center gap-2">
          <span>{emoji}</span> {item}
        </li>
      ))
    ) : (
      <p className="text-gray-400 italic">No entries yet</p>
    )}
  </ul>
);

// ---------- Edit Profile Modal ----------

function EditProfileModal({ user, profile, close }: any) {
  const [name, setName] = useState(profile?.name || "");
  const [country, setCountry] = useState(profile?.country || "");
  const [skills, setSkills] = useState((profile?.skills || []).join(", "));
  const [jobs, setJobs] = useState((profile?.jobs || []).join(", "));
  const [achievements, setAchievements] = useState(
    (profile?.achievements || []).join(", ")
  );
  const [projects, setProjects] = useState((profile?.projects || []).join(", "));
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState(profile?.photoURL || "");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const saveProfile = async () => {
    if (!user) {
      alert("User not logged in");
      return;
    }

    const userDoc = doc(db, "users", user.uid);
    let imageUrl = profile?.photoURL || "";

    try {
      if (image) {
        console.log("🖼️ Starting image upload...");
        const imageRef = ref(storage, `profileImages/${user.uid}.jpg`);
        console.log("📤 Uploading file:", image.name, "Size:", image.size, "bytes");

        await uploadBytes(imageRef, image);
        console.log("✅ Upload completed, getting download URL...");

        imageUrl = await getDownloadURL(imageRef);
        console.log("🔗 Download URL obtained:", imageUrl);
      }

      console.log("💾 Saving profile to Firestore...");
      await setDoc(
        userDoc,
        {
          name,
          country,
          photoURL: imageUrl,
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          jobs: jobs.split(",").map((j) => j.trim()).filter(Boolean),
          achievements: achievements.split(",").map((a) => a.trim()).filter(Boolean),
          projects: projects.split(",").map((p) => p.trim()).filter(Boolean),
        },
        { merge: true }
      );

      alert("✅ Profile Saved Successfully");
      close();
    } catch (error: any) {
      console.error("❌ ERROR:", error);
      console.error("Error Code:", error?.code);
      console.error("Error Message:", error?.message);

      if (error?.code === "storage/unauthorized") {
        alert("❌ Upload failed: Permission denied. Check Firebase Storage rules.");
      } else if (error?.code === "storage/invalid-root-url") {
        alert("❌ Upload failed: Firebase Storage not properly configured.");
      } else if (error?.message?.includes("storage")) {
        alert("❌ Image upload failed. Check browser console for details.");
      } else {
        alert("❌ Profile save failed. Check console for details.");
      }
    }
  };


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl p-8 w-[440px]"
      >
        <h2 className="text-xl font-bold mb-5 text-white text-center">
          Edit Profile
        </h2>

        <div className="flex flex-col items-center mb-5">
          <div className="w-24 h-24 rounded-full overflow-hidden shadow-md border-2 border-indigo-500 mb-3">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-500">
                👤
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="text-sm"
          />
        </div>

        <div className="space-y-3">
          <input
            className="input text-color-black"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
          />
          <input
            className="input"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Country"
          />
          <textarea
            className="input"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="Skills"
          />
          <textarea
            className="input"
            value={jobs}
            onChange={(e) => setJobs(e.target.value)}
            placeholder="Completed Jobs"
          />
          <textarea
            className="input"
            value={achievements}
            onChange={(e) => setAchievements(e.target.value)}
            placeholder="Achievements"
          />
          <textarea
            className="input"
            value={projects}
            onChange={(e) => setProjects(e.target.value)}
            placeholder="Projects"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={close}
            className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={saveProfile}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}
