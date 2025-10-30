"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Lightbulb,
  Rocket,
  Megaphone,
  Scale,
  Brain,
  Menu,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  active: string;
  onSelect: (value: string) => void;
}

const menuItems = [
  { label: "Ideation", value: "generator", icon: <Lightbulb className="w-5 h-5" /> },
  { label: "Branding", value: "branding", icon: <Rocket className="w-5 h-5" /> },
  { label: "Marketing", value: "marketing", icon: <Megaphone className="w-5 h-5" /> },
  { label: "Legal", value: "legal", icon: <Scale className="w-5 h-5" /> },
  { label: "Motivation", value: "motivation", icon: <Brain className="w-5 h-5" /> },
];

export default function Sidebar({ active, onSelect }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const params = useParams();
  const projectID = params?.projectID;

  const navigateTo = (value: string) => {
    onSelect(value);
    if (value === "generator") {
      router.push(`/ideation/${projectID}`);
    } else {
      router.push(`/${value}/${projectID}`);
    }
    setOpen(false); // close menu on mobile after navigation
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-40 md:hidden bg-slate-900/80 border border-slate-700 text-lime-400 p-2 rounded-lg shadow-lg backdrop-blur-md"
      >
        <Menu className="w-5 h-5" />
      </button>

      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 w-64 transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 
        bg-gradient-to-b from-slate-900/95 to-slate-800/90 backdrop-blur-xl 
        border-r border-slate-700/70 shadow-2xl`}
      >
        {/* Header */}
        <div
          onClick={() => router.push("/dashboard")}
          className="cursor-pointer flex items-center justify-center py-5 border-b border-slate-700 hover:bg-slate-800/60 transition"
        >
          <h1 className="text-2xl font-bold text-lime-400 tracking-wide hover:scale-105 transition-transform">
            LaunchPad <span className="text-white">AI</span>
          </h1>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.value}
              onClick={() => navigateTo(item.value)}
              className={`flex items-center w-full px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                active === item.value
                  ? "bg-lime-400/90 text-slate-900 font-semibold shadow-lg"
                  : "text-gray-300 hover:bg-slate-800 hover:text-lime-300"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-4 left-0 w-full px-4">
          <button
            onClick={() => router.push("/login")}
            className="flex items-center justify-center gap-2 w-full py-2 text-sm rounded-lg border border-slate-700 text-gray-400 hover:text-lime-300 hover:border-lime-400/70 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
