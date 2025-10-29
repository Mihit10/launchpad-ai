"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "../../../../lib/api";

import { Project } from '../../../../lib/types';

interface RoadmapMakerProps {
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

export default function RoadmapMaker({ projectID, project }: RoadmapMakerProps) {
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const [selectedIdeas, setSelectedIdeas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [roadmapParams, setRoadmapParams] = useState({
    timeline: "6months",
    goals: "",
    weakness: "",
  });

  useEffect(() => {
    // Load saved ideas when project changes
    if (project?.savedOutputs) {
      const ideas = project.savedOutputs
        .filter(output => output.type === 'ideation')
        .map(output => ({
          id: String(Date.now()),
          name: output.type,
          description: output.content,
          analysis: {},
          ...output // spread to get type, content, savedAt
        }));
      setSavedIdeas(ideas);
    }
  }, [project]);

  const generateRoadmap = async () => {
    if (selectedIdeas.length === 0) return;
    setLoading(true);
    
    try {
      const selectedIdeaDetails = selectedIdeas
        .map(id => savedIdeas.find(i => i.id === id))
        .filter(Boolean);

      const data = await apiFetch("/assistant/ideation/generateRoadmap", {
        method: "POST",
        json: {
          projectID,
          ideas: selectedIdeaDetails,
          params: roadmapParams,
          save: true
        }
      });
      
      if (data.error) throw new Error(data.error);
      setRoadmap(data.roadmap);

      // Clear selections after successful generation
      setSelectedIdeas([]);
      setRoadmapParams({
        timeline: "6months",
        goals: "",
        weakness: ""
      });
    } catch (error) {
      console.error("Error generating roadmap:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Create Project Roadmap</h2>
      
      <div className="space-y-6">
        {/* Idea Selection */}
        <div>
          <h3 className="font-medium mb-3">Select Ideas for Roadmap</h3>
          {savedIdeas.length === 0 ? (
            <p className="text-gray-500">
              No saved ideas yet. Use the idea generator to create and save some ideas first.
            </p>
          ) : (
            <div className="grid gap-3">
              {savedIdeas.map(idea => (
                <div key={idea.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={selectedIdeas.includes(idea.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIdeas(prev => [...prev, idea.id]);
                      } else {
                        setSelectedIdeas(prev => prev.filter(id => id !== idea.id));
                      }
                    }}
                    className="mt-1"
                  />
                  <div>
                    <h4 className="font-medium">{idea.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {typeof idea.description === 'string' 
                        ? idea.description.slice(0, 100) + '...'
                        : JSON.stringify(idea.description).slice(0, 100) + '...'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Roadmap Parameters */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Timeline</label>
            <select
              value={roadmapParams.timeline}
              onChange={(e) => setRoadmapParams(prev => ({ ...prev, timeline: e.target.value }))}
              className="w-full p-2 border rounded"
            >
              <option value="3months">3 Months</option>
              <option value="6months">6 Months</option>
              <option value="12months">12 Months</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Key Goals</label>
            <textarea
              value={roadmapParams.goals}
              onChange={(e) => setRoadmapParams(prev => ({ ...prev, goals: e.target.value }))}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Enter your key goals and objectives..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Current Challenges</label>
            <textarea
              value={roadmapParams.weakness}
              onChange={(e) => setRoadmapParams(prev => ({ ...prev, weakness: e.target.value }))}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Enter your current challenges or areas needing improvement..."
            />
          </div>
        </div>

        <div>
          <button
            onClick={generateRoadmap}
            disabled={loading || selectedIdeas.length === 0}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Roadmap"}
          </button>
        </div>
      </div>

      {roadmap && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Generated Roadmap</h3>
          <div className="prose prose-sm max-w-none">
            {typeof roadmap === 'string'
              ? roadmap
              : (
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(roadmap, null, 2)}
                </pre>
              )
            }
          </div>
        </div>
      )}
    </div>
  );
}