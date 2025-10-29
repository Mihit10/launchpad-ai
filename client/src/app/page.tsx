"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Sparkles, Zap } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  const features = [
    {
      title: "AI Ideation Suite",
      desc: "Generate, validate, and plan startup ideas with structured insights powered by Gemini.",
      icon: "💡",
    },
    {
      title: "Branding Assistant",
      desc: "Create names, taglines, and content that reflect your startup’s identity and appeal.",
      icon: "🎨",
    },
    {
      title: "Legal Advisor",
      desc: "Simplify complex documents and get business structure guidance with AI-powered legal tools.",
      icon: "⚖️",
    },
    {
      title: "Marketing Hub",
      desc: "Craft compelling copy, strategy, and social posts that amplify your brand’s reach.",
      icon: "📈",
    },
    {
      title: "Motivation Companion",
      desc: "Stay consistent with encouragement, milestone tracking, and founder success stories.",
      icon: "🔥",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0e1015] text-gray-100 overflow-x-hidden">
      {/* Hero */}
      <section className="h-screen flex flex-col justify-center items-center text-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-full text-sm text-emerald-400 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Startup Platform</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-indigo-400 via-emerald-400 to-lime-300 bg-clip-text text-transparent"
        >
          LaunchPad AI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-4 text-lg md:text-2xl text-gray-300 tracking-wide"
        >
          Innovate. <span className="text-emerald-400">Implement.</span> Repeat.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6 w-full max-w-3xl"
        >
          <div
            onClick={() => router.push("/login")}
            className="group flex-1 cursor-pointer bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-8 hover:border-emerald-400 transition-all duration-300"
          >
            <div className="text-3xl mb-4">👤</div>
            <h2 className="text-xl font-semibold mb-2 group-hover:text-emerald-400">
              Already a Founder?
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Continue building your journey with LaunchPad AI.
            </p>
            <button className="px-6 py-2 bg-emerald-400/10 text-emerald-300 rounded-lg border border-emerald-500 hover:bg-emerald-400 hover:text-black transition">
              Log In
            </button>
          </div>

          <div
            onClick={() => router.push("/signup")}
            className="group flex-1 cursor-pointer bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-8 hover:border-lime-400 transition-all duration-300"
          >
            <div className="text-3xl mb-4">🚀</div>
            <h2 className="text-xl font-semibold mb-2 group-hover:text-lime-400">
              New to LaunchPad?
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Join thousands of founders accelerating their ideas with AI.
            </p>
            <button className="px-6 py-2 bg-lime-400/10 text-lime-300 rounded-lg border border-lime-500 hover:bg-lime-400 hover:text-black transition">
              Get Started
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 md:px-12 bg-[#10131a]">
        {/* <div className="max-w-7xl mx-auto"> */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 rounded-full text-sm text-cyan-400 backdrop-blur-sm mb-6">
              <Zap className="w-4 h-4" />
              <span>Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-400 via-cyan-400 to-lime-400 bg-clip-text text-transparent">
              Everything You Need to Build
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Comprehensive suite of AI-powered tools designed to take your startup from idea to launch
            </p>
          </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {features.map((f, idx) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="p-6 bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-2xl border border-slate-700 hover:border-emerald-400 hover:scale-[1.02] transition-all"
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-emerald-300">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 text-sm border-t border-slate-800">
        <p>
          © {new Date().getFullYear()} LaunchPad AI. Built for founders to dream → build → scale.
        </p>
      </footer>
    </div>
  );
}
