"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "../../../../lib/api";

import { Project } from '../../../../lib/types';

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
  const [selectedIdea, setSelectedIdea] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<any>(null);

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

  const validateIdea = async () => {
    if (!selectedIdea) return;
    setLoading(true);
    
    try {
      const idea = savedIdeas.find(i => i.id === selectedIdea);
      if (!idea) return;

      const data = await apiFetch("/assistant/ideation/validateIdea", {
        method: "POST",
        json: {
          projectID,
          idea: JSON.stringify({
            name: idea.name,
            description: idea.description
          }),
          save: true
        }
      });
      
      if (data.error) throw new Error(data.error);
      setValidation(data.validation);

      // Update saved idea with validation results
      setSavedIdeas(prev => prev.map(i => 
        i.id === selectedIdea 
          ? { ...i, analysis: { ...i.analysis, validation: data.validation }}
          : i
      ));
    } catch (error) {
      console.error("Error validating idea:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Validate Saved Ideas</h2>
      
      <div className="space-y-4">
        {savedIdeas.length === 0 ? (
          <p className="text-gray-500">
            No saved ideas yet. Use the idea generator to create and save some ideas first.
          </p>
        ) : (
          <>
            <div className="grid gap-4">
              {savedIdeas.map(idea => (
                <div key={idea.id} className="p-4 bg-gray-50 rounded">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{idea.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {typeof idea.description === 'string' 
                          ? idea.description.slice(0, 100) + '...'
                          : JSON.stringify(idea.description).slice(0, 100) + '...'}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedIdea(idea.id)}
                      className={`px-4 py-2 text-sm rounded ${
                        selectedIdea === idea.id
                          ? 'bg-indigo-600 text-white'
                          : 'border border-indigo-600 text-indigo-600'
                      }`}
                    >
                      {selectedIdea === idea.id ? 'Selected' : 'Select'}
                    </button>
                  </div>

                  {idea.analysis?.validation && (
                    <div className="mt-4 p-4 bg-white rounded border">
                      <h4 className="font-medium text-sm mb-2">Validation Results</h4>
                      <div className="text-sm prose prose-sm max-w-none">
                        {typeof idea.analysis.validation === 'string'
                          ? idea.analysis.validation
                          : (
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(idea.analysis.validation, null, 2)}
                            </pre>
                          )
                        }
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6">
              <button
                onClick={validateIdea}
                disabled={loading || !selectedIdea}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Validate Selected Idea"}
              </button>
            </div>
          </>
        )}
      </div>

      {validation && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Latest Validation Results</h3>
          <div className="prose prose-sm max-w-none">
            {typeof validation === 'string'
              ? validation
              : (
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(validation, null, 2)}
                </pre>
              )
            }
          </div>
        </div>
      )}
    </div>
  );
}