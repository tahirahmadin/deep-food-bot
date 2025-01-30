import React from "react";
import { Users, MessageSquare, Menu } from "lucide-react";
import { useChatContext } from "../context/ChatContext";

interface FiltersProps {
  isVegOnly: boolean;
  setIsVegOnly: (value: boolean) => void;
  peopleCount: number;
  setPeopleCount: (value: number) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  isVegOnly,
  setIsVegOnly,
  peopleCount,
  setPeopleCount,
}) => {
  const { state, dispatch } = useChatContext();

  return (
    <div className="px-3 bg-white/50 backdrop-blur-sm border-b border-white/20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsVegOnly(!isVegOnly)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isVegOnly ? "bg-green-500" : "bg-gray-400"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isVegOnly ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm font-medium text-gray-700">Veg</span>
        </div>

        <div className="flex bg-gray-200 rounded-lg p-1">
          <button
            onClick={() => dispatch({ type: "SET_MODE", payload: "chat" })}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              state.mode === "chat"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
          <button
            onClick={() => dispatch({ type: "SET_MODE", payload: "browse" })}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              state.mode === "browse"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Menu className="w-4 h-4" />
            Browse
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-gray-600" />
        <select
          value={peopleCount}
          onChange={(e) => setPeopleCount(Number(e.target.value))}
          className="bg-white/50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 p-2 pr-8"
        >
          {[1, 2, 3, 4, 5].map((num) => (
            <option key={num} value={num}>
              {num} {num === 1 ? "Person" : "People"}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
