"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { auth } from "../../lib/firebase";
import { apiFetch } from "../../lib/api";
import { FolderOpen, Trash2, Sparkles, LogOut } from "lucide-react";

interface Project {
  projectID: string;
  projectName: string;
  status: string;
  timeline?: string;
  lastOutputs?: Record<string, string>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [userName, setUserName] = useState<string>("Founder");

  // ✅ Auth + Fetch Projects
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) router.push("/login");
      else setUserName(user.displayName || "Founder");
    });
    fetchProjects();
    return () => unsubscribe();
  }, []);

  async function fetchProjects() {
    try {
      const data = await apiFetch("/dashboard/viewProjects");
      if (data.error) throw new Error(data.error);
      if (!Array.isArray(data.projects)) throw new Error("Invalid data");
      setProjects(data.projects);
    } catch (err: any) {
      setError(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreating(true);
    try {
      const data = await apiFetch("/project/create", {
        method: "POST",
        json: { projectName: newProjectName.trim() },
      });
      if (data.error) throw new Error(data.error);
      await fetchProjects();
      setNewProjectName("");
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteProject(projectID: string) {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const data = await apiFetch(`/project/${projectID}/delete`, {
        method: "DELETE",
      });
      if (data.error) throw new Error(data.error);
      setProjects(projects.filter((p) => p.projectID !== projectID));
    } catch (err: any) {
      setError(err.message || "Failed to delete project");
    }
  }

  async function handleSignOut() {
    localStorage.removeItem("lpai_token");
    localStorage.removeItem("lpai_uid");
    await auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0f13] text-gray-200">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-lime-400 rounded-full mb-4"></div>
        <p>Loading your projects...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0f13] via-[#0e1319] to-[#111827] text-gray-100 p-6 sm:p-8">
      {/* Header */}
    <motion.header
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="w-full mb-10 border-b border-slate-800/60 pb-6"
    >
    {/* Top Row */}
    <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-lime-400 tracking-wide">
        LaunchPad AI
        </h1>
        <button
        onClick={handleSignOut}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-gray-300 hover:text-lime-400 rounded-md border border-slate-700/70 transition"
        >
        <LogOut className="w-4 h-4" /> Sign Out
        </button>
    </div>

    {/* Greeting Line */}
    <div className="flex items-center gap-2 mt-6 text-gray-300">
        <Sparkles className="w-5 h-5 text-lime-400" />
        <h2 className="text-xl font-medium">
        Hello, <span className="text-gray-100 font-semibold">{userName}</span> — let’s build something amazing!
        </h2>
    </div>
    </motion.header>


      {/* Create Project Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-xl mb-10"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="flex items-center text-xl font-semibold text-lime-400">
            <Sparkles className="w-5 h-5 mr-2 text-lime-400" /> Create New Project
          </h2>
          <form
            onSubmit={handleCreateProject}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Enter project name..."
              className="flex-1 rounded-lg border border-slate-600 bg-slate-800/80 p-3 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400"
              required
            />
            <button
              type="submit"
              disabled={creating || !newProjectName.trim()}
              className="bg-lime-400 hover:bg-lime-300 text-slate-900 font-semibold px-5 py-3 rounded-lg shadow-md transition disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/40 border border-red-500 text-red-300 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {projects.map((project) => (
            <motion.div
              key={project.projectID}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.02 }}
              className="bg-slate-900/70 border border-slate-700/50 rounded-xl p-6 flex flex-col justify-between shadow-lg hover:shadow-lime-400/10 transition"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-1">
                  {project.projectName}
                </h3>
                {project.status && (
                  <p className="text-sm text-gray-400 mb-4">
                    Status: {project.status}
                  </p>
                )}
              </div>
              <div className="flex justify-between items-center mt-auto">
                <button
                  onClick={() => router.push(`/ideation/${project.projectID}`)}
                  className="flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-slate-900 font-medium px-4 py-2 rounded-md transition"
                >
                  <FolderOpen className="w-4 h-4" /> Open
                </button>
                <button
                  onClick={() => handleDeleteProject(project.projectID)}
                  className="text-red-400 hover:text-red-300 transition flex items-center gap-1 text-sm"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-inner"
        >
          <h3 className="text-2xl font-semibold text-gray-100 mb-4">
            No projects yet 🌱
          </h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            “Every big dream starts with a single idea. Create your first project and
            let LaunchPad AI help you turn it into reality.”
          </p>
          <button
            onClick={() => document.querySelector("input")?.focus()}
            className="px-6 py-3 bg-lime-400 hover:bg-lime-300 text-slate-900 font-semibold rounded-lg shadow-md transition"
          >
            Create Project
          </button>
        </motion.div>
      )}
    </div>
  );
}
