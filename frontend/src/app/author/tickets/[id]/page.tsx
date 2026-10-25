"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { TicketDetail, TicketMessage } from "@/types";
import { useAuth } from "@/lib/auth";
import { useTicketStream } from "@/lib/useSSE";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, Send, User as UserIcon, Shield, Clock } from "lucide-react";

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
          // Avoid duplicate message appending
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
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/author/tickets"
        className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to All Tickets
      </Link>

      {/* Ticket Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
              {ticket.reference_no}
            </span>
            <StatusBadge status={ticket.status} />
            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">
              {ticket.category}
            </span>
          </div>

          <span className="text-xs text-gray-400 flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Created {new Date(ticket.created_at).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>

        {ticket.book && (
          <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-lg text-xs text-amber-900 flex items-center justify-between">
            <span>
              <strong>Associated Book:</strong> {ticket.book.title} (ISBN: {ticket.book.isbn || "Pending"})
            </span>
            <span>
              <strong>Pending Royalty:</strong> ₹{ticket.book.royalty_pending.toLocaleString("en-IN")}
            </span>
          </div>
        )}
      </div>

      {/* Message Feed */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[520px]">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Conversation Thread ({ticket.messages.length})
          </span>
          <span className="text-[11px] text-emerald-600 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1.5 animate-pulse"></span>
            Real-Time Live Updates
          </span>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {ticket.messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            const isAdmin = msg.sender_role === "admin";

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center space-x-1.5 text-xs text-gray-500 mb-1">
                  {isAdmin ? (
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span className="font-semibold text-gray-800">
                    {msg.sender_name || (isAdmin ? "BookLeaf Operations" : "You")}
                  </span>
                  <span>&bull;</span>
                  <span className="text-[11px]">
                    {new Date(msg.created_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div
                  className={`max-w-xl p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                    isMe
                      ? "bg-amber-600 text-white rounded-tr-none"
                      : "bg-slate-100 text-gray-900 rounded-tl-none border border-slate-200"
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
        <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-gray-200 flex gap-3">
          <input
            type="text"
            required
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your response to BookLeaf support..."
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={sending || !replyText.trim()}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
