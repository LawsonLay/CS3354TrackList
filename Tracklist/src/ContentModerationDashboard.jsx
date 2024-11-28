import React, { useState, useEffect } from "react";
import { FiTrash2, FiPlus, FiAlertCircle } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ContentModerationDashboard = () => {
  const [blockedTerm, setBlockedTerm] = useState("");
  const [blockedTerms, setBlockedTerms] = useState([]);
  const [error, setError] = useState("");

  const dummyContent = [
    { id: 1, text: "This is a sample content piece about technology" },
    { id: 2, text: "Another content piece about offensive content" },
    { id: 3, text: "Discussion about various programming languages" },
    { id: 4, text: "Content containing inappropriate language" },
    { id: 5, text: "Technical article about web development" },
  ];

  const [filteredContent, setFilteredContent] = useState(dummyContent);

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

  // Filter content based on blocked terms
  useEffect(() => {
    const filtered = dummyContent.filter((content) => {
      return !blockedTerms.some((term) =>
        content.text.toLowerCase().includes(term)
      );
    });
    setFilteredContent(filtered);
  }, [blockedTerms]);

  useEffect(() => {
    fetchBlockedTerms();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Content Moderation Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Blocked Terms Management
            </h2>

            <div className="space-y-4">
              <div className="relative">
                <label htmlFor="blockedTerm" className="sr-only">
                  Add blocked term
                </label>
                <input
                  type="text"
                  id="blockedTerm"
                  value={blockedTerm}
                  onChange={(e) => setBlockedTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter term to block"
                  aria-label="Enter term to block"
                />
                <button
                  onClick={addBlockedTerm}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:text-blue-800 transition-colors"
                  aria-label="Add blocked term"
                >
                  <FiPlus className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="flex items-center text-red-500 text-sm">
                  <FiAlertCircle className="mr-2" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                {blockedTerms.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No blocked terms added yet
                  </p>
                ) : (
                  blockedTerms.map((term) => (
                    <div
                      key={term}
                      className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg"
                    >
                      <span className="text-gray-700">{term}</span>
                      <button
                        onClick={() => removeBlockedTerm(term)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        aria-label={`Remove ${term} from blocked terms`}
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Content Display</h2>
            {filteredContent.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No content matches the current filter criteria
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredContent.map((content) => (
                  <div
                    key={content.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <p className="text-gray-700">{content.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default ContentModerationDashboard;
