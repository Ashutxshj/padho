"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { Ticket, PaginatedResponse } from "@/types";
import { useTicketStream } from "@/lib/useSSE";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Search, Filter, AlertTriangle, ArrowRight, Clock, ShieldCheck, Sparkles, RefreshCw } from "lucide-react";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Support Operations Queue</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
              Live Triage
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Deterministic triage queue sorted by AI urgency score and SLA response deadlines.
          </p>
        </div>

        <button
          onClick={() => { setLoading(true); fetchQueue(); }}
          className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Queue
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search author, subject, ref..."
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
          <span>Showing <strong>{tickets.length}</strong> of <strong>{total}</strong> tickets</span>
          <span className="flex items-center text-amber-700 font-medium">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-600" />
            Auto-prioritized by AI Urgency Weighting
          </span>
        </div>
      </div>

      {/* Tickets Queue Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">No tickets match the selected filters</p>
            <p className="text-xs text-gray-400 mt-1">Try clearing some filter criteria above.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/admin/tickets/${ticket.id}`}
                className="block p-5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {ticket.reference_no}
                      </span>
                      <PriorityBadge priority={ticket.priority} />
                      <StatusBadge status={ticket.status} />

                      {ticket.is_overdue && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 animate-pulse">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          SLA Overdue (&gt;48h)
                        </span>
                      )}

                      <span className="text-gray-400">&bull;</span>
                      <span className="text-gray-600 font-medium">{ticket.category}</span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 hover:text-amber-700 transition-colors">
                      {ticket.subject}
                    </h3>

                    <p className="text-xs text-gray-600 line-clamp-1">{ticket.description}</p>

                    <div className="flex items-center space-x-3 text-xs text-gray-400 pt-0.5">
                      <span><strong>Author:</strong> {ticket.author_name} ({ticket.author_email})</span>
                      {ticket.book_title && <span>&bull; <strong>Book:</strong> {ticket.book_title}</span>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 self-start lg:self-center">
                    <div className="text-right text-xs">
                      <div className="text-gray-500 font-medium">
                        {ticket.assignee_name ? `Assigned: ${ticket.assignee_name}` : "Unassigned"}
                      </div>
                      <div className="text-gray-400 mt-1 flex items-center justify-end">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(ticket.created_at).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
