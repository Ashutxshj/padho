import React from "react";

export function PriorityBadge({ priority }: { priority: string }) {
  let style = "bg-stone-100 text-stone-700 border-stone-200";

  switch (priority) {
    case "Critical":
      style = "bg-rose-50 text-rose-900 border-rose-300 font-bold uppercase tracking-wider text-[10px]";
      break;
    case "High":
      style = "bg-amber-50 text-amber-900 border-amber-300 font-semibold";
      break;
    case "Medium":
      style = "bg-stone-100 text-stone-800 border-stone-300";
      break;
    case "Low":
      style = "bg-stone-50 text-stone-500 border-stone-200";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs border ${style}`}
    >
      {priority}
    </span>
  );
}
