import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";

interface JobListing {
  title: string;
  company: string;
  description: string;
  redirect_url: string;
}

export const JobFinderSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("Software Developer");
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 4;

  const fetchJobs = async (query?: string) => {
    setError(null);
    setLoading(true);

    try {
      const url = query
        ? `http://127.0.0.1:5000/search?what=${encodeURIComponent(query)}`
        : `http://127.0.0.1:5000/search`;

      const response = await fetch(url, { method: "GET", mode: "cors" });
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();

      const validJobs: JobListing[] = Array.isArray(data.jobs)
        ? data.jobs.filter(
          (job) =>
            job &&
            typeof job.title === "string" &&
            typeof job.company === "string" &&
            typeof job.description === "string" &&
            typeof job.redirect_url === "string"
        )
        : [];

      setJobs(validJobs);
      setCurrentPage(1);
      if (validJobs.length === 0) setError("No jobs found.");
    } catch (err) {
      setJobs([]);
      setError("Failed to fetch jobs. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs("Software Developer");
  }, []);

  const handleSearch = () => {
    fetchJobs(searchQuery.trim() || undefined);
  };

  const totalPages = Math.ceil(jobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const currentJobs = jobs.slice(startIndex, startIndex + jobsPerPage);

  return (
    <section className="flex-1 mt-12 md:mt-0 bg-[#111827] p-6 rounded-2xl">
      <h2 className="font-bold text-3xl md:text-4xl text-white mb-8 drop-shadow-[0_0_15px_#2DD4BF]">
        Job Finder
      </h2>

      {/* Search */}
      <div className="mb-10 w-full">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full">

          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2DD4BF] w-5 h-5" />

            <input
              type="text"
              placeholder="Type a job title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="
          w-full pl-12 pr-4 py-3 rounded-xl
          bg-[#1F2937]
          text-white
          border border-white/10
          shadow-[0_0_15px_rgba(45,212,191,0.15)]
          focus:outline-none
          focus:ring-2 focus:ring-[#2DD4BF]
          transition-all
        "
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="
        w-full md:w-auto px-6 py-3
        bg-[#6366F1]
        text-white rounded-xl font-semibold
        shadow-[0_0_20px_#6366F1]
        hover:bg-[#4F46E5]
        transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
      "
          >
            {loading ? "Searching..." : "Search"}
          </button>

        </div>

      </div>
      {error && <p className="text-red-400 mb-6">{error}</p>}

      {loading && !error ? (
        <p className="text-gray-400">Loading jobs...</p>
      ) : currentJobs.length === 0 && !error ? (
        <p className="text-gray-400">No jobs found. Try searching!</p>
      ) : (
        <div className="space-y-6">
          {currentJobs.map((job, idx) => (
            <div
              key={job.redirect_url + idx}
              className="
                bg-[#1F2937]
                rounded-2xl
                border border-[#2DD4BF]
                shadow-[0_0_20px_rgba(45,212,191,0.25)]
                hover:shadow-[0_0_40px_rgba(99,102,241,0.6)]
                transition-all
              "
            >
              <div className="p-6">
                <h3 className="font-bold text-xl text-white mb-1">
                  {job.title}
                </h3>
                <p className="text-sm text-gray-400 font-medium mb-3">
                  {job.company}
                </p>
                <p className="text-sm text-gray-300 line-clamp-3 mb-5">
                  {job.description
                    ? job.description.slice(0, 180) + "..."
                    : "No description available"}
                </p>

                <a
                  href={job.redirect_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-block px-6 py-2
                    bg-[#2DD4BF]
                    text-[#111827]
                    rounded-lg font-semibold
                    shadow-[0_0_15px_#2DD4BF]
                    hover:bg-[#14B8A6]
                    transition-all text-sm
                  "
                >
                  View Job
                </a>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-6 mt-10">
              <button
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                className="
                  px-5 py-2 rounded-lg
                  bg-[#1F2937]
                  text-gray-300
                  border border-white/10
                  hover:text-white
                  disabled:opacity-40
                "
              >
                ← Prev
              </button>

              <span className="text-gray-400 font-semibold">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
                className="
                  px-5 py-2 rounded-lg
                  bg-[#1F2937]
                  text-gray-300
                  border border-white/10
                  hover:text-white
                  disabled:opacity-40
                "
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
