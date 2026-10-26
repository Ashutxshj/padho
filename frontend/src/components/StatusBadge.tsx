import React from "react";

export function StatusBadge({ status }: { status: string }) {
  let style = "bg-stone-100 text-stone-700 border-stone-200";

  switch (status) {
    case "Open":
      style = "bg-stone-100 text-stone-900 border-stone-400 font-semibold";
      break;
    case "In Progress":
      style = "bg-amber-50 text-amber-900 border-amber-300 font-semibold";
      break;
    case "Resolved":
      style = "bg-emerald-50 text-emerald-900 border-emerald-300";
      break;
    case "Closed":
      style = "bg-stone-50 text-stone-500 border-stone-200";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs border tracking-wide ${style}`}
    >
      {status}
    </span>
  );
}
