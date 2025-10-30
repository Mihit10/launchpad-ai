"use client";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ModalCardProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  content: any;
  type?: string;
}

export default function ModalCard({ isOpen, onClose, title, content, type }: ModalCardProps) {
  if (!isOpen) return null;

  const isRoadmap = type === "roadmap";
  let roadmapSteps: any[] = [];

  // ✅ Safely extract JSON from roadmap content (even if there's markdown text before/after)
  if (isRoadmap && typeof content?.roadmap === "string") {
    try {
      // find first valid JSON block using regex
      const match = content.roadmap.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        roadmapSteps = parsed.steps || [];
      }
    } catch (err) {
      console.error("Error parsing roadmap JSON", err);
    }
  }

  // 🧠 Helper to normalize markdown content (for idea + validation)
  const getMarkdownContent = () => {
    if (!content) return "No content available.";

    if (typeof content === "string") return content;

    if (content?.validationReport) return content.validationReport;
    if (content?.description) return content.description;
    if (content?.ideaName) return content.ideaName;
    return JSON.stringify(content, null, 2);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-slate-900 text-gray-100 rounded-xl max-w-3xl w-full shadow-xl border border-slate-700 overflow-y-auto max-h-[80vh]">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-slate-700">
            <Dialog.Title className="text-lg font-semibold text-lime-400">
              {title || "Details"}
            </Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-lime-400 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto">
            {isRoadmap ? (
              roadmapSteps.length > 0 ? (
                <div className="space-y-6">
                  {roadmapSteps.map((step, idx) => (
                    <div key={idx} className="relative border-l-2 border-lime-400 pl-6 pb-6">
                      <div className="absolute -left-2 top-1.5 w-3 h-3 rounded-full bg-lime-400"></div>
                      <h3 className="text-lime-300 font-semibold">{step.name}</h3>
                      <p className="text-gray-300 text-sm mt-2">{step.description}</p>
                      <p className="text-xs text-gray-400 mt-1 italic">{step.timeframe}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic">
                  Roadmap format not recognized — no structured steps found.
                </p>
              )
            ) : (
              <div className="prose prose-invert max-w-none leading-relaxed">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl text-lime-400 mt-6 mb-2 font-bold">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl text-lime-400 mt-4 mb-2 font-semibold">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg text-lime-300 mt-3 mb-1 font-medium">{children}</h3>
                    ),
                    li: ({ children }) => (
                      <li className="ml-5 list-disc text-gray-200 mb-1">{children}</li>
                    ),
                    p: ({ children }) => <p className="text-gray-100 mb-3">{children}</p>,
                    strong: ({ children }) => (
                      <strong className="text-lime-300 font-semibold">{children}</strong>
                    ),
                  }}
                >
                  {getMarkdownContent()}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
