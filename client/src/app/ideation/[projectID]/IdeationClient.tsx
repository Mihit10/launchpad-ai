"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import Sidebar from "./components/Sidebar";
import IdeaGenerator from "./components/IdeaGenerator";
import IdeaValidator from "./components/IdeaValidator";
import RoadmapMaker from "./components/RoadmapMaker";
import { Project, FeatureComponentProps } from "../../../lib/types";
import { motion } from "framer-motion";

type Feature = {
  label: string;
  value: string;
  description: string;
  component: React.ComponentType<FeatureComponentProps>;
};

const features: Feature[] = [
  {
    label: "Idea Generator",
    value: "generator",
    description: "Generate startup ideas instantly using AI-powered insights.",
    component: IdeaGenerator,
  },
  {
    label: "Idea Validator",
    value: "validator",
    description: "Validate your business idea with market analysis and feedback.",
    component: IdeaValidator,
  },
  {
    label: "Road Map Maker",
    value: "roadmap",
    description: "Convert your ideas into structured, interactive roadmaps.",
    component: RoadmapMaker,
  },
];

export default function IdeationClient({ projectID }: { projectID: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams?.get("tab") || "generator");

  useEffect(() => {
    async function fetchProject() {
      if (!projectID) return;
      try {
        const data = await apiFetch(`/project/${projectID}`);
        if (!data || data.error) return;
        setProject(data);
      } catch (err) {
        console.error("fetch project error", err);
      }
    }
    fetchProject();
  }, [projectID]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.pushState({}, "", url);
  };

  const ActiveFeature =
    features.find((f) => f.value === activeTab)?.component || IdeaGenerator;

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#0b0f13] via-[#0e1319] to-[#111827] text-gray-100">
      {/* Sidebar */}
      <Sidebar active={activeTab} onSelect={handleTabChange} />

      {/* Main Content */}
      <main className="flex-1 px-6 sm:px-10 py-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-semibold text-lime-400">
              {project?.projectName || "Ideation Suite"}
            </h1>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm text-gray-400 hover:text-lime-400"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Feature Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {features.map((feature) => (
              <button
                key={feature.value}
                onClick={() => handleTabChange(feature.value)}
                className={`p-5 rounded-xl transition-all border ${
                  activeTab === feature.value
                    ? "bg-slate-900 border-lime-400 text-lime-300"
                    : "bg-slate-900/40 border-slate-800 hover:border-lime-300/50"
                }`}
              >
                <h3 className="font-semibold text-lg mb-1">{feature.label}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </button>
            ))}
          </div>

          {/* Active Feature Section */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 backdrop-blur-xl shadow-md">
            <ActiveFeature projectID={projectID} project={project} />
          </div>
        </motion.div>
      </main>
    </div>
  );
}
    