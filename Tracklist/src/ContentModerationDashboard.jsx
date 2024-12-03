import React, { useState, useEffect } from "react";
import { FiTrash2, FiPlus, FiAlertCircle } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ContentModerationDashboard = () => {
  const [blockedTerm, setBlockedTerm] = useState("");
  const [blockedTerms, setBlockedTerms] = useState([]);
  const [error, setError] = useState("");

  const isLocal = process.env.NODE_ENV === "development";
  const baseURL = isLocal
    ? "http://127.0.0.1:5001/tracklist-bf80d/us-central1"
    : "https://us-central1-tracklist-bf80d.cloudfunctions.net";

  // Fetch blocked terms from backend
  const fetchBlockedTerms = async () => {
    try {
      const response = await fetch(`${baseURL}/getBlockedTerms`);
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);
      const data = await response.json();
      if (data.success) {
        setBlockedTerms(data.terms.map((term) => term.term));
      } else {
        toast.error(data.error || "Failed to fetch terms");
      }
    } catch (error) {
      console.error("Error fetching blocked terms:", error);
      toast.error("Failed to fetch blocked terms");
    }
  };

  // Add a blocked term
  const addBlockedTerm = async () => {
    if (!blockedTerm.trim()) {
      setError("Please enter a term to block");
      toast.error("Please enter a term to block");
      return;
    }

    try {
      const response = await fetch(`${baseURL}/addBlockedTerm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: blockedTerm }),
      });
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);
      const data = await response.json();
      if (data.success) {
        setBlockedTerms((prev) => [...prev, blockedTerm.toLowerCase()]);
        setBlockedTerm("");
        toast.success(data.message);
      } else {
        toast.warning(data.error || "Failed to add term");
      }
    } catch (error) {
      console.error("Error adding blocked term:", error);
      toast.error("Failed to add term");
    }
  };

  // Remove a blocked term
  const removeBlockedTerm = async (term) => {
    try {
      const response = await fetch(`${baseURL}/deleteBlockedTerm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term }),
      });
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);
      const data = await response.json();
      if (data.success) {
        setBlockedTerms((prev) => prev.filter((t) => t !== term));
        toast.info(data.message);
      } else {
        toast.warning(data.error || "Failed to remove term");
      }
    } catch (error) {
      console.error("Error removing blocked term:", error);
      toast.error("Failed to remove term");
    }
  };

  useEffect(() => {
    fetchBlockedTerms();
  }, []);

  return (
    <div className="min-h-screen bg-light-primary dark:bg-gray-900 p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
          Content Moderation Dashboard
        </h1>

        <div className="bg-light-surface dark:bg-gray-800 rounded-lg shadow-card hover:shadow-soft transition-all duration-300 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Blocked Terms Management
          </h2>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={blockedTerm}
                onChange={(e) => setBlockedTerm(e.target.value)}
                className="w-full px-4 py-2 bg-light-surface dark:bg-gray-800 border-light-tertiary dark:border-gray-700 shadow-sm focus:shadow-md transition-all duration-300 rounded-lg"
                placeholder="Enter term to block"
              />
              <button
                onClick={addBlockedTerm}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:text-blue-700 dark:text-blue-400 transition-colors"
              >
                <FiPlus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {blockedTerms.map((term) => (
                <div
                  key={term}
                  className="flex items-center justify-between bg-light-secondary dark:bg-gray-700 px-4 py-2 rounded-lg animate-fadeIn"
                >
                  <span className="text-gray-700 dark:text-gray-200">{term}</span>
                  <button
                    onClick={() => removeBlockedTerm(term)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 transition-colors"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" theme="colored" />
    </div>
  );
};

export default ContentModerationDashboard;
