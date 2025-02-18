import React from "react";

interface MessageSkeletonProps {
  type: "restaurant" | "menu";
}

export const MessageSkeleton: React.FC<MessageSkeletonProps> = ({ type }) => {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>

      {type === "restaurant" && (
        <>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-6 bg-gray-200 rounded-full w-32" />
            <div className="h-6 bg-gray-200 rounded-full w-16" />
            <div className="h-6 bg-gray-200 rounded-full w-24" />
            <div className="h-6 bg-gray-200 rounded-full w-20" />
          </div>
          <div className="flex gap-2 mt-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-[80px]">
                <div className="h-[55px] bg-gray-200 rounded-lg mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full mb-1" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
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
