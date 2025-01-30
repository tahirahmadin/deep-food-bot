// src/components/ChatInput.tsx
import React from "react";
import {
  Send,
  ImageIcon,
  Coffee,
  Pizza,
  Clock,
  Siren as Fire,
} from "lucide-react";

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
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImageUpload(file);
  };

  const handleQuickAction = (message: string) => {
    setInput(message);
    const event = new Event("submit") as unknown as React.FormEvent;
    onSubmit(event);
  };

  return (
    <div
      className={`p-4 border-t border-white/20 bg-white/50 backdrop-blur-sm ${className}`}
    >
      <div>
        {showQuickActions && !input && (
          <div className="grid grid-cols-2 gap-1 mb-2 h-[80px]">
            <button
              onClick={() =>
                handleQuickAction("Suggest Lunch combo for AED 50 or less?")
              }
              className="flex items-center gap-2 p-2 bg-white/80 rounded-xl hover:bg-white/90 transition-colors text-xs text-gray-700 border border-gray-100"
            >
              <Fire className="w-4 h-4 text-orange-500" />
              <span className="text-left">
                <span className="font-medium block">Lunch combo</span>
              </span>
            </button>

            <button
              onClick={() => handleQuickAction("Suggest Best Hot Coffees?")}
              className="flex items-center gap-2 p-2 bg-white/80 rounded-xl hover:bg-white/90 transition-colors text-xs text-gray-700 border border-gray-100"
            >
              <Coffee className="w-4 h-4 text-orange-500" />
              <span className="text-left">
                <span className="font-medium block">Best Hot Coffees</span>
              </span>
            </button>

            <button
              onClick={() => handleQuickAction("Suggest best pizza options?")}
              className="flex items-center gap-2 p-2 bg-white/80 rounded-xl hover:bg-white/90 transition-colors text-xs text-gray-700 border border-gray-100"
            >
              <Pizza className="w-4 h-4 text-orange-500" />
              <span className="text-left">
                <span className="font-medium block">Best Pizza options</span>
              </span>
            </button>

            <button
              onClick={() => handleQuickAction("Suggest best chicken options?")}
              className="flex items-center gap-2 p-2 bg-white/80 rounded-xl hover:bg-white/90 transition-colors text-xs text-gray-700 border border-gray-100"
            >
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-left">
                <span className="font-medium block">Best chicken options</span>
              </span>
            </button>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <input
          type="text"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="flex-1 p-2 rounded-lg bg-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 backdrop-blur-sm placeholder:text-gray-500 disabled:opacity-50"
        />
        <label className="cursor-pointer p-2 bg-orange-500 hover:bg-orange-600 rounded-full text-white transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <ImageIcon className="w-5 h-5" />
        </label>
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2 bg-orange-500 hover:bg-orange-600 rounded-full text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
