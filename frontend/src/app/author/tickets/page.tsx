"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { Ticket, PaginatedResponse } from "@/types";
import { useTicketStream } from "@/lib/useSSE";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { PlusCircle, MessageSquare, ArrowRight, Clock } from "lucide-react";

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
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Support Queries</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time status updates and communication with the BookLeaf operations team.
          </p>
        </div>
        <Link
          href="/author/tickets/new"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Raise New Ticket
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900">No support tickets found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Have questions about your book distribution, printing, or royalties? Submit a query to reach our team.
          </p>
          <Link
            href="/author/tickets/new"
            className="mt-4 inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            Create Your First Ticket
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-200">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/author/tickets/${ticket.id}`}
              className="block p-5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {ticket.reference_no}
                    </span>
                    <span className="text-gray-400">&bull;</span>
                    <span className="text-gray-600 font-medium">{ticket.category}</span>
                    {ticket.book_title && (
                      <>
                        <span className="text-gray-400">&bull;</span>
                        <span className="text-gray-500 italic truncate max-w-xs">{ticket.book_title}</span>
                      </>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-gray-900">{ticket.subject}</h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{ticket.description}</p>
                </div>

                <div className="flex items-center space-x-4 self-end sm:self-center">
                  <div className="text-right">
                    <StatusBadge status={ticket.status} />
                    <div className="text-[11px] text-gray-400 mt-1 flex items-center justify-end">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(ticket.created_at).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
