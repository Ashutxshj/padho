import React from "react";

export function StatusBadge({ status }: { status: string }) {
  let color = "bg-gray-100 text-gray-700 border-gray-200";

  switch (status) {
    case "Open":
      color = "bg-blue-50 text-blue-700 border-blue-200";
      break;
    case "In Progress":
      color = "bg-amber-50 text-amber-700 border-amber-200";
      break;
    case "Resolved":
      color = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;
    case "Closed":
      color = "bg-gray-100 text-gray-600 border-gray-300";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}
    >
      {status}
    </span>
  );
}
