"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { Ticket, PaginatedResponse } from "@/types";
import { useTicketStream } from "@/lib/useSSE";
import { StatusBadge } from "@/components/StatusBadge";
import { TableSkeleton, Skeleton } from "@/components/Skeleton";

export default function AuthorTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      const res = await apiRequest<PaginatedResponse<Ticket>>("/tickets");
      setTickets(res.items);
    } catch (err) {
      console.error("Failed to load tickets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Real-time updates without refreshing page
  useTicketStream({
    onTicketCreated: () => {
      fetchTickets();
    },
    onTicketUpdated: (data) => {
      setTickets((prev) =>
        prev.map((t) => (t.id === data.ticket_id ? { ...t, ...data } : t))
      );
    },
    onNewMessage: (data) => {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === data.ticket_id
            ? { ...t, status: data.ticket_status || t.status, updated_at: data.created_at }
            : t
        )
      );
    },
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="card-surface rounded-md">
          <TableSkeleton rows={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Author Support Inquiries
          </h1>
          <p className="text-sm text-stone-500 mt-1 leading-relaxed">
            Direct communication channel with the BookLeaf operations and editorial desk.
          </p>
        </div>
        <Link
          href="/author/tickets/new"
          className="inline-flex items-center px-4 py-2 border border-stone-900 rounded-sm text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 transition-colors shadow-sm"
        >
          Submit New Inquiry
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="card-surface p-12 text-center rounded-md">
          <h3 className="text-base font-bold text-stone-900">No active support inquiries</h3>
          <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Need assistance with distribution channels, printing, or royalty accounting? Submit a formal query.
          </p>
          <div className="mt-6">
            <Link
              href="/author/tickets/new"
              className="inline-flex items-center px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-sm shadow-sm transition-colors"
            >
              Submit Your First Inquiry
            </Link>
          </div>
        </div>
      ) : (
        <div className="card-surface rounded-md overflow-hidden divide-y divide-stone-200">
          <div className="p-4 bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-500 grid grid-cols-12 gap-4">
            <div className="col-span-6 sm:col-span-7">Subject / Reference</div>
            <div className="col-span-3 sm:col-span-3">Category</div>
            <div className="col-span-3 sm:col-span-2 text-right">Status</div>
          </div>

          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/author/tickets/${ticket.id}`}
              className="p-6 hover:bg-stone-50/60 transition-colors grid grid-cols-12 gap-4 items-center"
            >
              <div className="col-span-6 sm:col-span-7 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs text-stone-400">
                    #{ticket.id.slice(0, 8)}
                  </span>
                  {ticket.book_title && (
                    <span className="text-xs text-stone-500 font-medium">
                      &bull; {ticket.book_title}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-stone-900 leading-snug">
                  {ticket.subject}
                </h3>
                <div className="text-xs text-stone-400">
                  Updated: {new Date(ticket.updated_at || ticket.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="col-span-3 sm:col-span-3">
                <span className="text-xs text-stone-600 block">
                  {ticket.category}
                </span>
              </div>

              <div className="col-span-3 sm:col-span-2 text-right">
                <StatusBadge status={ticket.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
