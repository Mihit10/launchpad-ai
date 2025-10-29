export interface Project {
  projectID: string;
  projectName: string;
  status?: string;
  timeline?: string;
  lastOutputs: {
    [key: string]: any;
  };
  savedOutputs: Array<{
    type: string;
    content: any;
    savedAt: any;
  }>;
  milestones?: any[];
  achievements?: any[];
}

export interface FeatureComponentProps {
  projectID: string;
  project: Project | null;
}