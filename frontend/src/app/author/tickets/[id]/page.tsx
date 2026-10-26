"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { TicketDetail, TicketMessage } from "@/types";
import { useAuth } from "@/lib/auth";
import { useTicketStream } from "@/lib/useSSE";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton, CardSkeleton } from "@/components/Skeleton";

export default function AuthorTicketDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;
  const { user } = useAuth();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = async () => {
    try {
      const data = await apiRequest<TicketDetail>(`/tickets/${ticketId}`);
      setTicket(data);
    } catch (err) {
      console.error("Failed to load ticket detail", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  // Real-time listener for incoming messages or status changes
  useTicketStream({
    onTicketUpdated: (data) => {
      if (data.ticket_id === ticketId) {
        setTicket((prev) => (prev ? { ...prev, ...data } : prev));
      }
    },
    onNewMessage: (data) => {
      if (data.ticket_id === ticketId) {
        setTicket((prev) => {
          if (!prev) return prev;
          if (prev.messages.some((m) => m.id === data.message_id)) return prev;

          const newMsg: TicketMessage = {
            id: data.message_id,
            ticket_id: ticketId,
            sender_id: data.sender_id,
            sender_role: data.sender_role,
            sender_name: data.sender_name,
            message_body: data.message_body,
            created_at: data.created_at,
          };

          return {
            ...prev,
            status: data.ticket_status || prev.status,
            messages: [...prev.messages, newMsg],
          };
        });
      }
    },
  });

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSending(true);
    try {
      const newMsg = await apiRequest<TicketMessage>(`/tickets/${ticketId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message_body: replyText }),
      });

      setTicket((prev) => (prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev));
      setReplyText("");
    } catch (err) {
      console.error("Failed to send reply", err);
    } finally {
      setSending(false);
    }
  };

  if (loading || !ticket) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-4 w-32" />
        <CardSkeleton />
        <div className="card-surface h-96 p-6 rounded-md">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/author/tickets"
        className="text-xs font-semibold uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors"
      >
        &larr; Back to All Inquiries
      </Link>

      {/* Ticket Header Card */}
      <div className="card-surface p-6 sm:p-8 rounded-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-sm border border-stone-200">
              {ticket.reference_no}
            </span>
            <StatusBadge status={ticket.status} />
            <span className="text-xs text-stone-500 font-medium">
              {ticket.category}
            </span>
          </div>

          <span className="text-xs text-stone-400">
            Lodged: {new Date(ticket.created_at).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">
            {ticket.subject}
          </h1>

          {ticket.book && (
            <div className="mt-3 p-3 bg-stone-50 border border-stone-200 rounded-sm text-xs text-stone-700 flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong>Catalog Title:</strong> {ticket.book.title} (ISBN: {ticket.book.isbn || "Pending Assignment"})
              </span>
              <span>
                <strong>Unpaid Balance:</strong> ₹{ticket.book.royalty_pending.toLocaleString("en-IN")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Message Feed */}
      <div className="card-surface rounded-md overflow-hidden flex flex-col h-[560px]">
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Correspondence Thread ({ticket.messages.length})
          </span>
          <span className="text-xs text-stone-500 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block mr-2" />
            Active Real-Time Stream
          </span>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-[#faf9f6]">
          {ticket.messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            const isAdmin = msg.sender_role === "admin";

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center space-x-2 text-xs text-stone-500 mb-1.5">
                  <span className="font-semibold text-stone-900">
                    {msg.sender_name || (isAdmin ? "BookLeaf Operations" : "Author")}
                  </span>
                  <span>&bull;</span>
                  <span>
                    {new Date(msg.created_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div
                  className={`max-w-xl p-4 rounded-sm text-sm leading-relaxed whitespace-pre-wrap border ${
                    isMe
                      ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                      : "bg-white text-stone-900 border-stone-200 shadow-sm"
                  }`}
                >
                  {msg.message_body}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Composer */}
        <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-stone-200 flex gap-3">
          <input
            type="text"
            required
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write your response to BookLeaf operations..."
            className="flex-1 px-3.5 py-2.5 border border-stone-300 rounded-sm text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors bg-white"
          />
          <button
            type="submit"
            disabled={sending || !replyText.trim()}
            className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-sm text-sm font-medium transition-colors shadow-sm"
          >
            {sending ? "Sending..." : "Send Reply"}
          </button>
        </form>
      </div>
    </div>
  );
}
