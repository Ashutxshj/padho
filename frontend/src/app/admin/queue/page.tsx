"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { Ticket, PaginatedResponse } from "@/types";
import { useTicketStream } from "@/lib/useSSE";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { TableSkeleton, Skeleton } from "@/components/Skeleton";

const CATEGORIES = [
  "All Categories",
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];

const PRIORITIES = ["All Priorities", "Critical", "High", "Medium", "Low"];
const STATUSES = ["All Statuses", "Open", "In Progress", "Resolved", "Closed"];

export default function AdminQueuePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [priorityFilter, setPriorityFilter] = useState("All Priorities");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "All Statuses") params.append("status", statusFilter);
      if (categoryFilter !== "All Categories") params.append("category", categoryFilter);
      if (priorityFilter !== "All Priorities") params.append("priority", priorityFilter);
      if (search.trim()) params.append("search", search.trim());
      params.append("limit", "50");

      const res = await apiRequest<PaginatedResponse<Ticket>>(`/tickets?${params.toString()}`);
      setTickets(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error("Failed to load admin queue", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, priorityFilter, search]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Real-time listener: refresh queue when tickets are created, updated, or replied to
  useTicketStream({
    onTicketCreated: () => {
      fetchQueue();
    },
    onTicketUpdated: () => {
      fetchQueue();
    },
    onNewMessage: () => {
      fetchQueue();
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Operations Triage Queue
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-sm bg-stone-100 text-stone-800 font-semibold border border-stone-300">
              {total} Total Tickets
            </span>
          </div>
          <p className="text-sm text-stone-500 mt-1 leading-relaxed">
            Prioritized author inquiries classified by business urgency, SLA deadlines, and publication status.
          </p>
        </div>

        <button
          onClick={() => { setLoading(true); fetchQueue(); }}
          className="px-3.5 py-1.5 border border-stone-300 rounded-sm text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 transition-colors shadow-sm self-start sm:self-auto"
        >
          Refresh Queue
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-surface p-5 rounded-md space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by subject, title, author..."
              className="w-full px-3 py-2 border border-stone-300 rounded-sm text-xs bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-sm text-xs bg-white text-stone-900 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-sm text-xs bg-white text-stone-900 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-sm text-xs bg-white text-stone-900 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ticket List */}
      <div className="card-surface rounded-md overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} />
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-sm font-bold text-stone-800">No tickets matching filter criteria</h3>
            <p className="text-xs text-stone-500 mt-1">Adjust your status, category, or priority filters to view more items.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-200">
            <div className="p-4 bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-500 grid grid-cols-12 gap-4">
              <div className="col-span-1">Priority</div>
              <div className="col-span-5 sm:col-span-6">Inquiry & Author Context</div>
              <div className="col-span-3 sm:col-span-3">Category</div>
              <div className="col-span-3 sm:col-span-2 text-right">Status</div>
            </div>

            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/admin/tickets/${ticket.id}`}
                className="p-5 sm:p-6 hover:bg-stone-50/60 transition-colors grid grid-cols-12 gap-4 items-center"
              >
                <div className="col-span-1">
                  <PriorityBadge priority={ticket.priority} />
                </div>

                <div className="col-span-5 sm:col-span-6 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 text-xs text-stone-400">
                    <span className="font-mono text-stone-600 font-semibold">{ticket.reference_no}</span>
                    <span>&bull;</span>
                    <span className="text-stone-800 font-medium">{ticket.author_name}</span>
                    {ticket.book_title && (
                      <>
                        <span>&bull;</span>
                        <span className="text-stone-500 italic">{ticket.book_title}</span>
                      </>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-stone-900 leading-snug">
                    {ticket.subject}
                  </h3>

                  <div className="text-xs text-stone-400">
                    Lodged: {new Date(ticket.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="col-span-3 sm:col-span-3">
                  <span className="text-xs text-stone-700 block font-medium">
                    {ticket.category}
                  </span>
                </div>

                <div className="col-span-3 sm:col-span-2 text-right space-y-1">
                  <StatusBadge status={ticket.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
