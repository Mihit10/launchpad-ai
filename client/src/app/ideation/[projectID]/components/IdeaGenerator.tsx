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
  const [savedIdeas, setSavedIdeas] = useState<any[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchSavedIdeas() {
      try {
        const data = await apiFetch(`/project/${projectID}`);
        if (data?.savedOutputs && Array.isArray(data.savedOutputs)) {
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
        json: { projectID, topic: JSON.stringify(structuredContent), save: true },
      });

      if (data.error) throw new Error(data.error);

      const newIdea = data.generated || data;
      setSavedIdeas((prev) => [
        {
          type: "ideation",
          content: newIdea.description || JSON.stringify(newIdea),
          name: newIdea.name || "Untitled Idea",
          savedAt: { seconds: Date.now() / 1000 },
        },
        ...prev,
      ]);
      setSelectedIdea(newIdea);
    } catch (error) {
      console.error("Error generating idea:", error);
    } finally {
      setLoading(false);
    }
  };

  // Categorize by type
  const generatedIdeas = savedIdeas.filter((i) => i.type === "ideation" || i.type === "generated");
  const validations = savedIdeas.filter((i) => i.type === "ideation_validation");
  const roadmaps = savedIdeas.filter((i) => i.type === "ideation_roadmap");

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

      {/* Organized Saved Sections */}
      <div className="space-y-10">
        {/* Generated Ideas */}
        {generatedIdeas.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-lime-400 mb-3">Saved Ideas</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedIdeas.map((idea, idx) => {
                const content =
                  typeof idea.content === "string"
                    ? idea.content
                    : idea.content?.description || JSON.stringify(idea.content, null, 2);

                const plainSnippet = content
                  .replace(/^#+\s*/gm, "")
                  .replace(/\*\*/g, "")
                  .replace(/[_#>-]/g, "")
                  .slice(0, 120)
                  .trim();

                const title = idea.name || `Idea #${idx + 1}`;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedIdea({ ...idea, type: "ideation" });
                      setIsModalOpen(true);
                    }}
                    className="cursor-pointer bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-lime-400 transition"
                  >
                    <h3 className="text-md font-semibold text-gray-100 truncate">{title}</h3>
                    <p className="text-gray-400 text-sm mt-1 line-clamp-3">{plainSnippet}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Validations */}
        {validations.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-lime-400 mb-3">Saved Validations</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {validations.map((val, idx) => {
                const title = val.content?.ideaName?.replace(/^#+\s*/, "") || `Validation #${idx + 1}`;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedIdea({ ...val, type: "validation" });
                      setIsModalOpen(true);
                    }}
                    className="cursor-pointer bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-lime-400 transition"
                  >
                    <h3 className="text-md font-semibold text-gray-100 truncate">{title}</h3>
                    <p className="text-gray-400 text-sm mt-1">View validation analysis</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Roadmaps */}
        {roadmaps.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-lime-400 mb-3">Saved Roadmaps</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roadmaps.map((r, idx) => {
                const title = r.content?.ideas?.[0] || `Roadmap #${idx + 1}`;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedIdea({ ...r, type: "roadmap" });
                      setIsModalOpen(true);
                    }}
                    className="cursor-pointer bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-lime-400 transition"
                  >
                    <h3 className="text-md font-semibold text-gray-100 truncate">{title}</h3>
                    <p className="text-gray-400 text-sm mt-1">View project timeline</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Shared Modal */}
      {selectedIdea && (
        <ModalCard
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedIdea.name || selectedIdea.content?.ideaName || "Details"}
          content={selectedIdea.content}
          type={selectedIdea.type}
        />
      )}
    </div>
  );
}
