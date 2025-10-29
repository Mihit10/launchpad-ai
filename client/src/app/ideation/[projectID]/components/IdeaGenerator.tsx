"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/api";
import { Project } from "../../../../lib/types";
import ModalCard from "./ModalCard";

interface IdeaGeneratorProps {
  projectID: string;
  project: Project | null;
}

export default function IdeaGenerator({ projectID, project }: IdeaGeneratorProps) {
  const [whiteboardItems, setWhiteboardItems] = useState<Array<{ id: number; type: string; text: string }>>([]);
  const [newIdeaType, setNewIdeaType] = useState("Name");
  const [newIdeaText, setNewIdeaText] = useState("");
  const [loading, setLoading] = useState(false);

  // saved ideas from backend (Firestore)
  const [savedIdeas, setSavedIdeas] = useState<any[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // fetch saved outputs on mount
  useEffect(() => {
    async function fetchSavedIdeas() {
      try {
        const data = await apiFetch(`/project/${projectID}`);
        if (data && data.savedOutputs && Array.isArray(data.savedOutputs)) {
          // sort newest first
          const sorted = [...data.savedOutputs].sort(
            (a, b) => (b.savedAt?.seconds || 0) - (a.savedAt?.seconds || 0)
          );
          setSavedIdeas(sorted);
        }
      } catch (err) {
        console.error("Failed to load saved ideas", err);
      }
    }
    fetchSavedIdeas();
  }, [projectID]);

  const addToWhiteboard = () => {
    if (!newIdeaText.trim()) return;
    setWhiteboardItems((prev) => [
      ...prev,
      { id: Date.now(), type: newIdeaType, text: newIdeaText },
    ]);
    setNewIdeaText("");
  };

  const deleteFromWhiteboard = (id: number) => {
    setWhiteboardItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearWhiteboard = () => setWhiteboardItems([]);

  const generateFromWhiteboard = async () => {
    if (!whiteboardItems.length) return;
    setLoading(true);
    try {
      const structuredContent = whiteboardItems.reduce((acc: any, item) => {
        acc[item.type] = acc[item.type] ? [...acc[item.type], item.text] : [item.text];
        return acc;
      }, {});

      const data = await apiFetch("/assistant/ideation/generateIdea", {
        method: "POST",
        json: {
          projectID,
          topic: JSON.stringify(structuredContent),
          save: true,
        },
      });

      if (data.error) throw new Error(data.error);

      const newIdea = data.generated || data;
      setSavedIdeas((prev) => [
        {
          type: "generated",
          content: newIdea.description || JSON.stringify(newIdea),
          name: newIdea.name || "Untitled Idea",
          savedAt: { seconds: Date.now() / 1000 },
        },
        ...prev,
      ]);

      setSelectedIdea(newIdea);
    //   setIsModalOpen(true);
    } catch (error) {
      console.error("Error generating idea:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 bg-slate-900/50 rounded-lg border border-slate-800 p-6">
      {/* Whiteboard Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-lime-400">Whiteboard</h2>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <select
            value={newIdeaType}
            onChange={(e) => setNewIdeaType(e.target.value)}
            className="p-2 border border-slate-700 rounded bg-slate-800 text-gray-100"
          >
            <option>Name</option>
            <option>Feature</option>
            <option>Context</option>
            <option>Target Audience</option>
            <option>Other</option>
          </select>
          <input
            value={newIdeaText}
            onChange={(e) => setNewIdeaText(e.target.value)}
            className="flex-1 p-2 border border-slate-700 rounded bg-slate-800 text-gray-100"
            placeholder="Enter idea..."
          />
          <button
            onClick={addToWhiteboard}
            className="bg-lime-500 hover:bg-lime-400 text-slate-900 px-4 py-2 rounded font-medium"
          >
            Add
          </button>
        </div>

        <div className="space-y-2">
          {whiteboardItems.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center p-3 bg-slate-800 rounded border border-slate-700"
            >
              <div>
                <strong className="text-lime-300">{item.type}:</strong>{" "}
                <span className="text-gray-300">{item.text}</span>
              </div>
              <button
                onClick={() => deleteFromWhiteboard(item.id)}
                className="text-red-400 text-sm hover:underline"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        {whiteboardItems.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={generateFromWhiteboard}
              disabled={loading}
              className="bg-lime-500 hover:bg-lime-400 text-slate-900 px-6 py-2 rounded font-semibold disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Idea"}
            </button>
            <button
              onClick={clearWhiteboard}
              className="text-red-400 text-sm hover:underline"
            >
              Clear Whiteboard
            </button>
          </div>
        )}
      </div>

      {/* Saved Ideas Section */}
<div className="mt-10">
  <h2 className="text-lg font-semibold text-lime-400 mb-3">Saved Ideas</h2>

  {savedIdeas.length === 0 ? (
    <p className="text-gray-400 italic">
      No saved ideas yet. Generate one to get started!
    </p>
  ) : (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {savedIdeas.map((idea, idx) => {
        // Normalize content
        const content =
          typeof idea.content === "string"
            ? idea.content
            : idea.content?.description ||
              JSON.stringify(idea.content, null, 2);

        // Extract title from markdown or object
        const nameMatch = content.match(/^#+\s*(.+)/m);
        const ideaTitle =
          idea.name ||
          nameMatch?.[1]?.trim() ||
          `Idea #${idx + 1}`;

        // Prepare snippet (plain text)
        const plainSnippet = content
          .replace(/^#+\s*/gm, "")
          .replace(/\*\*/g, "")
          .replace(/[_#>-]/g, "")
          .slice(0, 120)
          .trim();

        return (
          <div
            key={idx}
            onClick={() => {
              setSelectedIdea(idea);
              setIsModalOpen(true);
            }}
            className="cursor-pointer bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-lime-400 transition"
          >
            <h3 className="text-md font-semibold text-gray-100 truncate">
              {ideaTitle}
            </h3>
            <p className="text-gray-400 text-sm mt-1 line-clamp-3">
              {plainSnippet || "Click to view details..."}
            </p>
          </div>
        );
      })}
    </div>
  )}
</div>

{/* Modal for selected idea */}
{selectedIdea && (
  <ModalCard
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    title={
      selectedIdea.name ||
      (typeof selectedIdea.content === "object" &&
        selectedIdea.content?.name) ||
      "Generated Idea"
    }
    content={
      typeof selectedIdea.content === "string"
        ? selectedIdea.content
        : selectedIdea.content?.description ||
          JSON.stringify(selectedIdea, null, 2)
    }
  />
)}

    </div>
  );
}
