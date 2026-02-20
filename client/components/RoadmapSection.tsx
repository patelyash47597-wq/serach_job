import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface RoadmapCard {
  title: string;
  description: string;
  icon: string;
  image: string;
  bgColor: string;
  path: string;
}

const roadmaps: RoadmapCard[] = [
  {
    title: "Android Development",
    description: "Build native apps for Android using Kotlin or Java.",
    icon: "📱",
    image: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=500&h=300&fit=crop",
    bgColor: "from-green-200 to-green-300",
    path: "/android",
  },
  {
    title: "Backend Development",
    description: "Design scalable APIs and databases.",
    icon: "🖥️",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500&h=300&fit=crop",
    bgColor: "from-gray-200 to-gray-300",
    path: "/backend",
  },
  {
    title: "BI Analyst",
    description: "Turn data into actionable insights.",
    icon: "📊",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop",
    bgColor: "from-blue-200 to-blue-300",
    path: "/bianalyst",
  },
  {
    title: "Blockchain Development",
    description: "Build decentralized applications and smart contracts.",
    icon: "⛓️",
    image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=500&h=300&fit=crop",
    bgColor: "from-purple-200 to-indigo-300",
    path: "/blockchain",
  },
  {
    title: "CyberSecurity",
    description: "Protect systems and data from digital threats.",
    icon: "🔒",
    image: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=500&h=300&fit=crop",
    bgColor: "from-red-200 to-red-300",
    path: "/cybersecurity",
  },
  {
    title: "DevOps",
    description: "Automate deployments and manage infrastructure.",
    icon: "⚙️",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop",
    bgColor: "from-orange-200 to-orange-300",
    path: "/devops",
  },
  {
    title: "Frontend Development",
    description: "Design interactive and responsive user interfaces.",
    icon: "🎨",
    image: "data:image/png;base64,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",
    bgColor: "from-pink-200 to-purple-300",
    path: "/frontend",
  },
  {
    title: "Full Stack Development",
    description: "Work on both frontend and backend of applications.",
    icon: "🌐",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=500&h=300&fit=crop",
    bgColor: "from-yellow-200 to-orange-300",
    path: "/fullstack",
  },
  {
    title: "Machine Learning",
    description: "Build predictive models and intelligent systems.",
    icon: "🤖",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=500&h=300&fit=crop",
    bgColor: "from-cyan-200 to-blue-300",
    path: "/machinelearning",
  },
  {
    title: "Data Analyst",
    description: "Collect, process, and visualize data for insights.",
    icon: "📈",
    image: "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=500&h=300&fit=crop",
    bgColor: "from-teal-200 to-teal-300",
    path: "/dataanalyst",
  },
];

export const RoadmapSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"roles" | "skills">("roles");
  const navigate = useNavigate();

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2500,
    pauseOnHover: true,
    responsive: [
      { breakpoint: 1280, settings: { slidesToShow: 3 } },
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <section className="w-full py-16 bg-[#111827]">

      <div className="max-w-[1400px] mx-auto px-4">
        <h2 className="font-sans font-bold text-3xl md:text-4xl text-white mb-10 drop-shadow-[0_0_15px_#2DD4BF]">

          Roadmaps
        </h2>

        {/* Tabs */}
        <div className="flex gap-10 border-b border-white/10 mb-10">

          {["roles", "skills"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "roles" | "skills")}
              className={`pb-3 text-lg transition-all ${activeTab === tab
                ? "font-bold text-[#2DD4BF] border-b-2 border-[#2DD4BF]"
                : "font-medium text-gray-400 hover:text-white"
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Carousel */}
        <div className="w-full flex-shrink-0 mt-10 px-4">
          <Slider {...sliderSettings}>
            {roadmaps.map((roadmap, idx) => (
              <div key={idx} className="px-6">
                <div
                  onClick={() => navigate(roadmap.path)}
                  className="
bg-[#1F2937]
rounded-3xl
border border-[#2DD4BF]
shadow-[0_0_20px_rgba(45,212,191,0.3)]
overflow-hidden
hover:shadow-[0_0_40px_rgba(99,102,241,0.6)]
transition-all duration-300
cursor-pointer
transform hover:-translate-y-2"

                >
                  <div
                    className={`h-52 bg-gradient-to-br ${roadmap.bgColor} relative`}
                  >
                    <img
                      src={roadmap.image}
                      alt={roadmap.title}
                      className="w-full h-full object-cover opacity-70 rounded-t-3xl"
                    />
                  </div>

                  <div className="p-5">
                    <h3 className="font-serif font-bold text-lg text-white mb-2">
                      {roadmap.icon} {roadmap.title}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {roadmap.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
};
