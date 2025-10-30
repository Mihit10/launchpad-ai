"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { apiFetch } from "../../../../lib/api";
import { Project } from "../../../../lib/types";
import ReactMarkdown from "react-markdown";
import domtoimage from "dom-to-image-more";


interface RoadmapMakerProps {
  projectID: string;
  project: Project | null;
}

interface SavedIdea {
  id: string;
  name: string;
  description: string;
  type: string;
  content: any;
  savedAt: any;
}

export default function RoadmapMaker({ projectID, project }: RoadmapMakerProps) {
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [roadmapParams, setRoadmapParams] = useState({
    timeline: "6months",
    goals: "",
    weakness: "",
  });

  useEffect(() => {
    if (project?.savedOutputs) {
      const ideas = project.savedOutputs
        .filter((output: any) => output.type === "ideation")
        .map((output: any, idx: number) => ({
          id:
            output.id ||
            `${output.savedAt || Date.now()}-${idx}-${Math.random()
              .toString(36)
              .substring(2, 8)}`,
          name:
            output.name ||
            output.content?.name ||
            `Idea #${idx + 1}`,
          description:
            typeof output.content === "string"
              ? output.content
              : output.content?.description ||
                JSON.stringify(output.content, null, 2),
          type: output.type,
          content: output.content,
          savedAt: output.savedAt || new Date().toISOString(),
        }));
      setSavedIdeas(ideas);
    }
  }, [project]);

  const generateRoadmap = async () => {
    if (!selectedIdea) return;
    setLoading(true);
    try {
      const selectedIdeaDetails = savedIdeas.find((i) => i.id === selectedIdea);
      if (!selectedIdeaDetails) return;

      const data = await apiFetch("/assistant/ideation/generateRoadmap", {
        method: "POST",
        json: {
          projectID,
          ideas: [selectedIdeaDetails],
          params: roadmapParams,
          save: true,
        },
      });

      if (data.error) throw new Error(data.error);

      // Parse roadmap JSON safely
      let roadmapJSON = null;
      if (typeof data.roadmap?.roadmap === "string") {
        const jsonMatch = data.roadmap.roadmap.match(/\{[\s\S]*\}/);
        roadmapJSON = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } else {
        roadmapJSON = data.roadmap.roadmap;
      }

      setRoadmap(roadmapJSON);
      setSelectedIdea(null);
      setRoadmapParams({ timeline: "6months", goals: "", weakness: "" });
    } catch (error) {
      console.error("Error generating roadmap:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
  const input = document.getElementById("roadmap-container");
  if (!input) return;

  try {
    const dataUrl = await domtoimage.toPng(input);
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 190;
    const imgHeight = (input.offsetHeight * imgWidth) / input.offsetWidth;

    pdf.addImage(dataUrl, "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save("roadmap.pdf");
  } catch (err) {
    console.error("Error exporting PDF:", err);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white p-6">
      <h2 className="text-3xl font-bold text-lime-400 mb-6 text-center">
        🛤️ Startup Roadmap Maker
      </h2>

      {/* Idea Selection */}
      <div className="mb-8">
        <h3 className="font-semibold mb-3 text-slate-300">
          Select an Idea for Roadmap
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedIdeas.map((idea) => {
            const isSelected = selectedIdea === idea.id;
            return (
              <motion.div
                key={idea.id}
                onClick={() =>
                  setSelectedIdea(isSelected ? null : idea.id)
                }
                className={`relative cursor-pointer rounded-lg border p-4 transition-all ${
                  isSelected
                    ? "border-lime-400 bg-slate-800"
                    : "border-slate-700 bg-slate-900 hover:border-slate-500"
                }`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-white truncate">
                    {idea.name}
                  </h4>
                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-lime-400 text-lg"
                    >
                      ✅
                    </motion.span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mt-2 line-clamp-3">
                  <ReactMarkdown>
                  {idea.description.slice(0, 150)}
                  </ReactMarkdown>
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Params */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Timeline</label>
          <select
            value={roadmapParams.timeline}
            onChange={(e) =>
              setRoadmapParams((prev) => ({
                ...prev,
                timeline: e.target.value,
              }))
            }
            className="w-full bg-slate-800 border border-slate-700 rounded p-2"
          >
            <option value="3months">3 Months</option>
            <option value="6months">6 Months</option>
            <option value="12months">12 Months</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Key Goals</label>
          <input
            value={roadmapParams.goals}
            onChange={(e) =>
              setRoadmapParams((prev) => ({
                ...prev,
                goals: e.target.value,
              }))
            }
            className="w-full bg-slate-800 border border-slate-700 rounded p-2"
            placeholder="e.g. launch MVP, acquire users..."
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">
            Challenges
          </label>
          <input
            value={roadmapParams.weakness}
            onChange={(e) =>
              setRoadmapParams((prev) => ({
                ...prev,
                weakness: e.target.value,
              }))
            }
            className="w-full bg-slate-800 border border-slate-700 rounded p-2"
            placeholder="e.g. funding, team, marketing..."
          />
        </div>
      </div>

      {/* Button */}
      <motion.button
        onClick={generateRoadmap}
        disabled={loading || !selectedIdea}
        className="w-full py-3 bg-lime-500 text-slate-900 font-semibold rounded-lg hover:bg-lime-400 transition-all disabled:opacity-50"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? "Generating Roadmap..." : "Generate Roadmap"}
      </motion.button>

      {/* Visual Timeline */}
      {roadmap?.steps && (
        <motion.div
          id="roadmap-container"
          className="mt-12 bg-slate-800/60 border border-slate-700 rounded-2xl p-8 backdrop-blur-lg"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-3xl font-bold text-lime-400 mb-8 text-center">
            🚀 Your Startup Roadmap
          </h3>

          <div className="relative">
            {roadmap.steps.map((step: any, index: number) => (
              <motion.div
                key={index}
                className="relative flex items-start gap-6 mb-10"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                {/* Connector Line */}
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-lime-400 rounded-full shadow-md shadow-lime-500" />
                  {index !== roadmap.steps.length - 1 && (
                    <div className="w-1 bg-lime-400/50 flex-1 mt-1 mb-1" />
                  )}
                </div>

                {/* Step Card */}
                <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-5 w-full hover:border-lime-400/70 transition">
                  <h4 className="text-xl font-semibold text-lime-400 mb-2">
                    {step.name}
                  </h4>
                  <p className="text-gray-300 mb-2 leading-relaxed">
                    {step.description}
                  </p>
                  <p className="text-lime-300 text-sm font-medium">
                    ⏳ {step.timeframe}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.button
            onClick={exportToPDF}
            className="mt-8 w-full py-3 bg-lime-500 text-slate-900 rounded-lg hover:bg-lime-400 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            📄 Export as PDF
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
