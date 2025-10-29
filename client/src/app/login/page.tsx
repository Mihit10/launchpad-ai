"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, ArrowLeft } from "lucide-react";
import { signInWithEmail } from "../../lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userCred = await signInWithEmail(email, password);
      const token = await userCred.user.getIdToken();
      localStorage.setItem("lpai_token", token);
      localStorage.setItem("lpai_uid", userCred.user.uid);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0d1117] via-[#0f141c] to-[#111827] text-gray-100 px-4 sm:px-0">
      {/* Back Button */}
        <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-slate-800/70 border border-slate-700/40 text-gray-300 hover:text-lime-300 hover:bg-slate-800/90 transition backdrop-blur-md"
        >
        <ArrowLeft className="w-5 h-5" />
        </motion.button>
      
      {/* Animated background orbs */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full bg-emerald-500/20 blur-[150px] top-10 left-20"
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 6 }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full bg-lime-400/10 blur-[200px] bottom-10 right-20"
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.15, 1] }}
        transition={{ repeat: Infinity, duration: 7 }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 backdrop-blur-2xl bg-slate-900/60 border border-slate-700/60 shadow-xl rounded-2xl p-8 w-full max-w-md"
      >
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-center bg-gradient-to-r from-emerald-400 via-lime-400 to-teal-400 bg-clip-text text-transparent mb-2"
        >
          Welcome Back
        </motion.h1>
        <p className="text-center text-gray-400 mb-8 text-sm">
          Sign in to continue your founder journey
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-gray-500 h-5 w-5" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 pr-3 py-2 w-full rounded-lg bg-slate-800/60 border border-slate-700 text-gray-100 placeholder-gray-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 transition"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-500 h-5 w-5" />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-3 py-2 w-full rounded-lg bg-slate-800/60 border border-slate-700 text-gray-100 placeholder-gray-500 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/30 transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-md p-2"
            >
              {error}
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-lime-400 text-black font-semibold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition"
          >
            <LogIn className="w-5 h-5" />
            {loading ? "Signing in..." : "Log In"}
          </motion.button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-400">
          New to LaunchPad AI?{" "}
          <a
            href="/signup"
            className="text-emerald-400 hover:text-lime-300 transition font-medium"
          >
            Create an account
          </a>
        </p>
      </motion.div>
    </div>
  );
}
