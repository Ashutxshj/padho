import React from "react";

export function PriorityBadge({ priority }: { priority: string }) {
  let color = "bg-gray-100 text-gray-700 border-gray-200";

  switch (priority) {
    case "Critical":
      color = "bg-red-50 text-red-700 border-red-300 font-semibold";
      break;
    case "High":
      color = "bg-orange-50 text-orange-700 border-orange-200";
      break;
    case "Medium":
      color = "bg-yellow-50 text-yellow-800 border-yellow-200";
      break;
    case "Low":
      color = "bg-slate-50 text-slate-600 border-slate-200";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${color}`}
    >
      {priority}
    </span>
  );
}
