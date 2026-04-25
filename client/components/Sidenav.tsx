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
          <p className="text-xs mt-1 text-gray-500 ">
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
        <div className="mt-8 space-y-4  ">
          <Section  title="Skills">
            <BadgeList list={profile?.skills}  />
          </Section>

          <Section title="Completed Jobs">
            <BadgeList list={profile?.jobs} emoji="💼" />
          </Section>

          <Section title="Achievements">
            <BadgeList list={profile?.achievements} emoji="🏆" />
          </Section>

          <Section title="Projects">
            <BadgeList list={profile?.projects} emoji="🚀" />
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
  <div className="flex flex-wrap  gap-3">
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
        className="w-[460px] p-8 rounded-3xl 
  bg-gradient-to-br from-[#111827]/90 to-[#1F2937]/90 
  backdrop-blur-xl border border-white/10 
  shadow-[0_0_40px_rgba(99,102,241,0.25)]"
      >
        <h2 className="text-2xl font-bold mb-6 text-center 
  bg-gradient-to-r from-indigo-400 to-cyan-400 
  text-transparent bg-clip-text">
          Edit Profile
        </h2>

        {/* PROFILE IMAGE */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-28 h-28 rounded-full overflow-hidden 
    border-2 border-indigo-500 shadow-lg">
            {preview ? (
              <img src={preview} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center w-full h-full 
        bg-gray-700 text-gray-300 text-3xl">
                👤
              </div>
            )}
          </div>

          <label className="mt-3 cursor-pointer text-sm text-indigo-400 hover:text-indigo-300">
            Change Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>

        {/* INPUTS */}
        <div className="space-y-4">
          {[
            { value: name, set: setName, placeholder: "Your Name" },
            { value: country, set: setCountry, placeholder: "Country" },
          ].map((field, i) => (
            <input
              key={i}
              value={field.value}
              onChange={(e) => field.set(e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-4 py-2 rounded-xl 
        bg-[#111827] border border-white/10 
        text-white placeholder-gray-400
        focus:outline-none focus:ring-2 focus:ring-indigo-500
        transition"
            />
          ))}

          {[
            { value: skills, set: setSkills, placeholder: "Skills (comma separated)" },
            { value: jobs, set: setJobs, placeholder: "Completed Jobs" },
            { value: achievements, set: setAchievements, placeholder: "Achievements" },
            { value: projects, set: setProjects, placeholder: "Projects" },
          ].map((field, i) => (
            <textarea
              key={i}
              value={field.value}
              onChange={(e) => field.set(e.target.value)}
              placeholder={field.placeholder}
              rows={2}
              className="w-full px-4 py-2 rounded-xl 
        bg-[#111827] border border-white/10 
        text-white placeholder-gray-400
        focus:outline-none focus:ring-2 focus:ring-indigo-500
        transition resize-none"
            />
          ))}
        </div>

        {/* BUTTONS */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={close}
            className="px-5 py-2 rounded-xl 
      bg-gray-700 hover:bg-gray-600 
      text-white transition"
          >
            Cancel
          </button>

          <button
            onClick={saveProfile}
            className="px-5 py-2 rounded-xl 
      bg-gradient-to-r from-indigo-500 to-cyan-500 
      hover:opacity-90 text-white font-semibold 
      shadow-lg transition"
          >
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}
