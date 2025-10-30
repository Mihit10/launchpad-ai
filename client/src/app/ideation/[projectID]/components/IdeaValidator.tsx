"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "../../../../lib/api";
import { Project } from "../../../../lib/types";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

interface IdeaValidatorProps {
  projectID: string;
  project: Project | null;
}

interface SavedIdea {
  id: string;
  name: string;
  description: string;
  analysis?: any;
  type: string;
  content: any;
  savedAt: any;
}

export default function IdeaValidator({ projectID, project }: IdeaValidatorProps) {
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const [selectedIdeas, setSelectedIdeas] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<any>(null);

  useEffect(() => {
    if (project?.savedOutputs) {
      const ideas = project.savedOutputs
        .filter((output) => output.type === "ideation")
        .map((output, idx) => ({
          id: `${output.savedAt}_${idx}`,
          name:
            typeof output.content === "object"
              ? output.content.name || `Idea #${idx + 1}`
              : `Idea #${idx + 1}`,
          description:
            typeof output.content === "object"
              ? output.content.description
              : output.content,
          ...output,
        }));
      setSavedIdeas(ideas);
    }
  }, [project]);

  const toggleIdeaSelection = (id: string) => {
    setSelectedIdeas((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) updated.delete(id);
      else updated.add(id);
      return updated;
    });
  };

    const validateIdea = async () => {
    if (selectedIdeas.size === 0) return;
    setLoading(true);

    try {
      const selectedList = savedIdeas.filter((idea) =>
        selectedIdeas.has(idea.id)
      );

      // Combine multiple selected ideas into a single string
      const combinedIdeas = selectedList
        .map(
          (i, idx) =>
            `### Idea ${idx + 1}: ${i.name || "Unnamed"}\n${
              typeof i.description === "string"
                ? i.description
                : JSON.stringify(i.description, null, 2)
            }`
        )
        .join("\n\n");
      console.log("Sending validation payload:", {
      projectID,
      idea: {
        name: combinedIdeas.length > 50
          ? combinedIdeas.slice(0, 50) + "..."
          : combinedIdeas || "Unnamed Idea",
        description: combinedIdeas,
      },
      save: true,
    });

    const data = await apiFetch("/assistant/ideation/validateIdea", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectID,
        idea: {
          name: combinedIdeas.length > 50
            ? combinedIdeas.slice(0, 50) + "..."
            : combinedIdeas || "Unnamed Idea",
          description: combinedIdeas,
        },
        save: true,
      }),
    });



      if (data.error) throw new Error(data.error);
      setValidation(data.validation);
    } catch (error) {
      console.error("Error validating idea:", error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-slate-900 rounded-lg shadow-lg p-6 border border-slate-800 text-gray-100">
      <h2 className="text-2xl font-semibold mb-6 text-lime-400 flex items-center gap-2">
        Idea Validator
      </h2>

      {savedIdeas.length === 0 ? (
        <p className="text-gray-400 italic">
          No saved ideas yet. Generate and save ideas first to validate them.
        </p>
      ) : (
        <>
          <p className="text-gray-400 text-sm mb-4">
            Select one or multiple ideas to validate together.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedIdeas.map((idea) => {
              const isSelected = selectedIdeas.has(idea.id);
              const title = idea.name || "Unnamed Idea";
              const snippet =
                typeof idea.description === "string"
                  ? idea.description.slice(0, 120)
                  : JSON.stringify(idea.description, null, 2).slice(0, 120);

              return (
                <motion.div
                  key={idea.id}
                  onClick={() => toggleIdeaSelection(idea.id)}
                  whileHover={{ scale: 1.02 }}
                  className={`relative cursor-pointer rounded-lg border p-4 transition-all ${
                    isSelected
                      ? "border-lime-400 bg-slate-800"
                      : "border-slate-700 bg-slate-900 hover:border-slate-600"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-md font-semibold text-white truncate">
                      {title}
                    </h3>
                    {isSelected && (
                      <CheckCircle
                        className="text-lime-400 w-5 h-5"
                        strokeWidth={2}
                      />
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mt-2 line-clamp-3">
                    <ReactMarkdown>
                    {snippet}
                    </ReactMarkdown>
                  </p>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-6">
            <button
              onClick={validateIdea}
              disabled={loading || selectedIdeas.size === 0}
              className="w-full bg-lime-500 text-slate-900 py-2 px-4 rounded font-medium hover:bg-lime-400 disabled:opacity-50 transition"
            >
              {loading ? "Analyzing..." : "Validate Selected Ideas"}
            </button>
          </div>
        </>
      )}

      {validation && (
        <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-lime-400 mb-4">
            Validation Results
          </h3>
          <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-4 whitespace-pre-line text-gray-100">
                    {children}
                  </p>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold text-lime-400 mt-6 mb-2">
                    {children}
                  </h2>
                ),
                li: ({ children }) => (
                  <li className="ml-5 list-disc mb-2 text-gray-200">
                    {children}
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="text-lime-300 font-semibold">
                    {children}
                  </strong>
                ),
              }}
            >
              {typeof validation === "string"
    ? validation
    : validation?.validationReport ||
      JSON.stringify(validation, null, 2)}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
