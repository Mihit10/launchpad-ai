"use client";
import { useState } from "react";
import { Lightbulb, Rocket, Megaphone, Scale, Brain, Menu } from "lucide-react";

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

  return (
    <aside className={`fixed md:static inset-y-0 left-0 z-30 w-64 transform ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800`}>
      <div className="flex items-center justify-between px-4 py-4 md:hidden">
        <h1 className="text-xl font-bold text-lime-400">Menu</h1>
        <button onClick={() => setOpen(!open)} className="text-gray-300">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.value}
            onClick={() => onSelect(item.value)}
            className={`flex items-center w-full px-4 py-2 text-sm rounded-lg transition-all ${
              active === item.value
                ? "bg-lime-400 text-slate-900 font-semibold"
                : "text-gray-300 hover:bg-slate-800 hover:text-lime-300"
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
