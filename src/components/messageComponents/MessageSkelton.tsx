import React from "react";
import { useFiltersContext } from "../../context/FiltersContext";

interface MessageSkeletonProps {
  type: "restaurant" | "menu";
}

export const MessageSkeleton: React.FC<MessageSkeletonProps> = ({ type }) => {
  const { theme } = useFiltersContext();

  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-full"
          style={{ backgroundColor: `${theme.cardBg}80` }}
        />
        <div
          className="h-4 rounded w-3/4"
          style={{ backgroundColor: `${theme.cardBg}80` }}
        />
      </div>

      {type === "restaurant" && (
        <>
          <div className="flex items-center gap-2 mt-2">
            <div
              className="h-6 rounded-full w-32"
              style={{ backgroundColor: `${theme.cardBg}80` }}
            />
            <div
              className="h-6 rounded-full w-16"
              style={{ backgroundColor: `${theme.cardBg}80` }}
            />
            <div
              className="h-6 rounded-full w-24"
              style={{ backgroundColor: `${theme.cardBg}80` }}
            />
            <div
              className="h-6 rounded-full w-20"
              style={{ backgroundColor: `${theme.cardBg}80` }}
            />
          </div>
          <div className="flex gap-2 mt-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-[80px]">
                <div
                  className="h-[55px] rounded-lg mb-2"
                  style={{ backgroundColor: `${theme.cardBg}80` }}
                />
                <div
                  className="h-3 rounded w-full mb-1"
                  style={{ backgroundColor: `${theme.cardBg}80` }}
                />
                <div
                  className="h-3 rounded w-1/2"
                  style={{ backgroundColor: `${theme.cardBg}80` }}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {type === "menu" && (
        <div className="flex gap-2 mt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-[80px]">
              <div className="h-[55px] bg-gray-200 rounded-lg mb-2" />
              <div className="h-3 bg-gray-200 rounded w-full mb-1" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
