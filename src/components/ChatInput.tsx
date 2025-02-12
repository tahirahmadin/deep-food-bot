// src/components/ChatInput.tsx
import React, { useRef } from "react";
import { Send, ImageIcon, Leaf, Clock as Timer, Zap, Tag } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onImageUpload: (file: File) => void;
  isLoading?: boolean;
  className?: string;
  placeholder?: string;
  showQuickActions?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSubmit,
  onImageUpload,
  isLoading = false,
  className = "",
  placeholder = "Type a message...",
  showQuickActions = true,
}) => {
  const { addresses } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImageUpload(file);
  };

  const handleQuickAction = (message: string) => {
    setInput(message);
    if (formRef.current) {
      formRef.current.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    }
  };

  return (
    <div
      className={`p-2 border-t border-white/200 bg-white/50 backdrop-blur-sm fixed bottom-0 left-0 right-0 ${className}`}
    >
      <div className="w-full">
        {showQuickActions && !input && (
          <div className="grid grid-cols-2 gap-2 mb-2 max-h-[120px] overflow-y-auto">
            <button
              onClick={() => handleQuickAction("Show me lunch combos")}
              className="flex items-center gap-2 px-4 py-2 bg-white/90 rounded-full hover:bg-white transition-colors text-xs text-gray-600 shadow-sm justify-center"
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Lunch combos ?</span>
            </button>

            <button
              onClick={() => handleQuickAction("Show me best veg options")}
              className="flex items-center gap-2 px-4 py-2 bg-white/90 rounded-full hover:bg-white transition-colors text-xs text-gray-600 shadow-sm justify-center"
            >
              <Leaf className="w-3.5 h-3.5" />
              <span>Best veg options ?</span>
            </button>

            <button
              onClick={() =>
                handleQuickAction("What are most exciting options today?")
              }
              className="flex items-center gap-2 px-4 py-2 bg-white/90 rounded-full hover:bg-white transition-colors text-xs text-gray-600 shadow-sm justify-center"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Best offers today ?</span>
            </button>

            <button
              onClick={() =>
                handleQuickAction("Show me quickest delivery options")
              }
              className="flex items-center gap-2 px-4 py-2 bg-white/90 rounded-full hover:bg-white transition-colors text-xs text-gray-600 shadow-sm justify-center"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Quickest delivery ?</span>
            </button>
          </div>
        )}
      </div>

      <form
        ref={formRef}
        onSubmit={onSubmit}
        className={`flex items-center gap-2 bg-white rounded-full border border-gray-200 px-4 py-2 ${
          addresses.length === 0 ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <input
          type="text"
          placeholder="Ask here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading || addresses.length === 0}
          className="flex-1 bg-transparent focus:outline-none placeholder:text-gray-400 text-[16px]" // Ensure font size is 16px
        />
        <label className="cursor-pointer p-1 text-gray-400 hover:text-gray-600">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={addresses.length === 0}
            className="hidden"
          />
          <ImageIcon className="w-5 h-5" />
        </label>
        <button
          type="submit"
          className="p-1 text-gray-400 hover:text-gray-600"
          disabled={addresses.length === 0}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
