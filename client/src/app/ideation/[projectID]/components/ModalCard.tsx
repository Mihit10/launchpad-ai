"use client";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ModalCardProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  content: string;
}

export default function ModalCard({ isOpen, onClose, title, content }: ModalCardProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal content */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-slate-900 text-gray-100 rounded-xl max-w-3xl w-full shadow-xl border border-slate-700 overflow-y-auto max-h-[80vh]">
          <div className="flex justify-between items-center p-4 border-b border-slate-700">
            <Dialog.Title className="text-lg font-semibold text-lime-400">{title || "Generated Idea"}</Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-lime-400 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 prose prose-invert prose-sm max-w-none overflow-y-auto">
            <div className="p-6 prose prose-invert prose-sm max-w-none overflow-y-auto leading-relaxed">
            <ReactMarkdown
                components={{
                p: ({ children }) => (
                    <p className="mb-4 whitespace-pre-line text-gray-100">{children}</p>
                ),
                h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-lime-400 mt-6 mb-3">
                    {children}
                    </h1>
                ),
                h2: ({ children }) => (
                    <h2 className="text-xl font-semibold text-lime-400 mt-6 mb-2">
                    {children}
                    </h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-lg font-medium text-lime-300 mt-4 mb-1">
                    {children}
                    </h3>
                ),
                li: ({ children }) => (
                    <li className="ml-5 list-disc mb-2 text-gray-200">{children}</li>
                ),
                strong: ({ children }) => (
                    <strong className="text-lime-300 font-semibold">{children}</strong>
                ),
                }}
            >
                {typeof content === "string"
                ? content
                : content && typeof content === "object"
                ? (content as any).description || JSON.stringify(content, null, 2)
                : String(content)}
            </ReactMarkdown>
            </div>

          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
