"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { TicketDetail, TicketMessage, InternalNote, AIDraftResponse } from "@/types";
import { useAuth } from "@/lib/auth";
import { useTicketStream } from "@/lib/useSSE";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import {
  ArrowLeft,
  Send,
  Sparkles,
  Lock,
  User as UserIcon,
  BookOpen,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  FileText
} from "lucide-react";

const CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];

const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

export default function AdminTicketDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;
  const { user } = useAuth();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [internalNotes, setInternalNotes] = useState<InternalNote[]>([]);
  const [newReply, setNewReply] = useState("");
  const [newNote, setNewNote] = useState("");
  const [aiDraft, setAiDraft] = useState<AIDraftResponse | null>(null);
  const [draftingAI, setDraftingAI] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicketAndNotes = async () => {
    try {
      const [ticketData, notesData] = await Promise.all([
        apiRequest<TicketDetail>(`/tickets/${ticketId}`),
        apiRequest<InternalNote[]>(`/tickets/${ticketId}/internal-notes`),
      ]);
      setTicket(ticketData);
      setInternalNotes(notesData);
    } catch (err) {
      console.error("Failed to load ticket management data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchTicketAndNotes();
    }
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  // Real-time listener for author replies or status changes
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

  // Handle Category Override
  const handleCategoryOverride = async (category: string) => {
    try {
      const updated = await apiRequest<TicketDetail>(`/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({ category }),
      });
      setTicket((prev) => (prev ? { ...prev, category: updated.category } : prev));
    } catch (err) {
      console.error("Failed to override category", err);
    }
  };

  // Handle Priority Override
  const handlePriorityOverride = async (priority: string) => {
    try {
      const updated = await apiRequest<TicketDetail>(`/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({ priority }),
      });
      setTicket((prev) => (prev ? { ...prev, priority: updated.priority } : prev));
    } catch (err) {
      console.error("Failed to override priority", err);
    }
  };

  // Handle Status Update
  const handleStatusUpdate = async (status: string) => {
    try {
      const updated = await apiRequest<TicketDetail>(`/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setTicket((prev) => (prev ? { ...prev, status: updated.status } : prev));
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  // Generate AI Draft Grounded in BookLeaf Knowledge Base
  const handleGenerateAIDraft = async () => {
    setDraftingAI(true);
    try {
      const res = await apiRequest<AIDraftResponse>("/ai/draft-response", {
        method: "POST",
        body: JSON.stringify({ ticket_id: ticketId }),
      });
      setAiDraft(res);
      setNewReply(res.suggested_draft);
    } catch (err) {
      console.error("Failed to generate AI draft", err);
    } finally {
      setDraftingAI(false);
    }
  };

  // Send Public Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    setSendingReply(true);
    try {
      const msg = await apiRequest<TicketMessage>(`/tickets/${ticketId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message_body: newReply }),
      });

      setTicket((prev) =>
        prev
          ? {
              ...prev,
              status: prev.status === "Open" ? "In Progress" : prev.status,
              messages: [...prev.messages, msg],
            }
          : prev
      );
      setNewReply("");
      setAiDraft(null);
    } catch (err) {
      console.error("Failed to send reply", err);
    } finally {
      setSendingReply(false);
    }
  };

  // Add Internal Staff Note
  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSavingNote(true);
    try {
      const note = await apiRequest<InternalNote>(`/tickets/${ticketId}/internal-notes`, {
        method: "POST",
        body: JSON.stringify({ note_text: newNote }),
      });

      setInternalNotes((prev) => [...prev, note]);
      setNewNote("");
    } catch (err) {
      console.error("Failed to add internal note", err);
    } finally {
      setSavingNote(false);
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
    <div className="space-y-6">
      <Link
        href="/admin/queue"
        className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Operations Queue
      </Link>

      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded border border-gray-300">
              {ticket.reference_no}
            </span>
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />

            {ticket.is_overdue && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Overdue SLA (&gt;48h)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-gray-500">Status Control:</span>
            <select
              value={ticket.status}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 pt-1 border-t border-gray-100">
          <span><strong>Author:</strong> {ticket.author_name} ({ticket.author_email})</span>
          <span><strong>Created:</strong> {new Date(ticket.created_at).toLocaleString("en-IN")}</span>
          {ticket.book_title && <span><strong>Book:</strong> {ticket.book_title}</span>}
        </div>
      </div>

      {/* Main 3-Column Cockpit Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Author & Book Metadata (3 Cols) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Author Card */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
              <UserIcon className="w-4 h-4 text-amber-600" />
              <span>Author Profile</span>
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="font-bold text-gray-900 text-sm">{ticket.author_name}</div>
              <div>{ticket.author_email}</div>
              {ticket.author_phone && <div>Phone: {ticket.author_phone}</div>}
              {ticket.author_city && <div>City: {ticket.author_city}</div>}
              <div>Joined: {ticket.author_joined_date || "N/A"}</div>
            </div>
          </div>

          {/* Book & Royalty Context */}
          {ticket.book ? (
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>Book Context</span>
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="font-bold text-gray-900">{ticket.book.title}</div>
                <div>ISBN: {ticket.book.isbn || "Pending"}</div>
                <div>Status: <span className="font-semibold text-gray-800">{ticket.book.status}</span></div>

                <div className="pt-2 border-t border-gray-100 space-y-1">
                  <div className="flex justify-between">
                    <span>Copies Sold:</span>
                    <span className="font-bold text-gray-900">{ticket.book.total_copies_sold}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Earned:</span>
                    <span className="font-bold text-gray-900">₹{ticket.book.total_royalty_earned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disbursed:</span>
                    <span className="font-bold text-emerald-700">₹{ticket.book.royalty_paid}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-gray-100">
                    <span className="text-amber-800">Pending Royalty:</span>
                    <span className="text-amber-700">₹{ticket.book.royalty_pending}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-xs text-gray-500 text-center">
              General / Account-level query (No specific book attached).
            </div>
          )}

          {/* AI Decision Rationale Card */}
          <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-200 shadow-sm space-y-2 text-xs">
            <div className="flex items-center space-x-1.5 font-bold text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>AI Triage Reasoning</span>
            </div>
            <div className="text-gray-700 leading-relaxed">
              {ticket.ai_rationale || "Automated triage completed with default classification rules."}
            </div>
          </div>
        </div>

        {/* Center Column: Public Conversation Thread & Composer (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Public Author Conversation ({ticket.messages.length})
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">Live SSE Feed</span>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {ticket.messages.map((msg) => {
              const isAdmin = msg.sender_role === "admin";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center space-x-1.5 text-xs text-gray-500 mb-1">
                    {isAdmin ? (
                      <Shield className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    <span className="font-semibold text-gray-800">
                      {msg.sender_name || (isAdmin ? "BookLeaf Operations" : ticket.author_name)}
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
                    className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-sm ${
                      isAdmin
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

          {/* Reply Form */}
          <form onSubmit={handleSendReply} className="p-4 border-t border-gray-200 space-y-2 bg-white">
            <textarea
              required
              rows={3}
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder="Type public response to author, or click 'Generate AI Reply' on the right..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            ></textarea>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sendingReply || !newReply.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5"
              >
                <span>Send Public Reply</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: AI Draft Studio, Overrides & Staff Notes (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Overrides Card */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Triage Overrides
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 mb-1">
                  Category (AI: <em>{ticket.ai_category_suggestion || "None"}</em>)
                </label>
                <select
                  value={ticket.category}
                  onChange={(e) => handleCategoryOverride(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-500 mb-1">
                  Priority (AI: <em>{ticket.ai_priority_suggestion || "None"}</em>)
                </label>
                <select
                  value={ticket.priority}
                  onChange={(e) => handlePriorityOverride(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* AI Response Draft Studio */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-bold text-xs text-amber-900 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>AI Response Draft Studio</span>
              </div>
              <button
                type="button"
                onClick={handleGenerateAIDraft}
                disabled={draftingAI}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded text-[11px] font-medium shadow-sm transition-colors"
              >
                {draftingAI ? "Drafting..." : "Generate AI Reply"}
              </button>
            </div>

            <p className="text-[11px] text-amber-800 leading-normal">
              Uses BookLeaf Knowledge Base policies and the author&apos;s exact book metrics.
            </p>

            {aiDraft && (
              <div className="space-y-2 pt-2 border-t border-amber-200">
                <div className="flex flex-wrap gap-1">
                  {aiDraft.grounded_policies_used.map((policy) => (
                    <span
                      key={policy}
                      className="px-1.5 py-0.5 bg-amber-200/60 text-amber-900 rounded text-[10px] font-medium"
                    >
                      {policy}
                    </span>
                  ))}
                </div>
                <div className="p-3 bg-white rounded-lg border border-amber-200 text-xs text-gray-800 max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {aiDraft.suggested_draft}
                </div>
                <button
                  type="button"
                  onClick={() => setNewReply(aiDraft.suggested_draft)}
                  className="w-full py-1 text-center bg-white hover:bg-amber-100/70 border border-amber-300 text-amber-900 rounded text-xs font-semibold transition-colors"
                >
                  Apply to Reply Composer
                </button>
              </div>
            )}
          </div>

          {/* Private Internal Staff Notes */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700 uppercase tracking-wider">
              <span className="flex items-center">
                <Lock className="w-3.5 h-3.5 text-gray-500 mr-1.5" />
                Private Staff Notes ({internalNotes.length})
              </span>
              <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                Hidden from Author
              </span>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto divide-y divide-gray-100">
              {internalNotes.length === 0 ? (
                <div className="text-center py-3 text-xs text-gray-400">
                  No internal staff notes on this ticket yet.
                </div>
              ) : (
                internalNotes.map((note) => (
                  <div key={note.id} className="pt-2 first:pt-0 text-xs space-y-0.5">
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span className="font-semibold text-gray-700">{note.staff_name || "Ops Staff"}</span>
                      <span>{new Date(note.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className="text-gray-800 bg-gray-50 p-2 rounded border border-gray-100">
                      {note.note_text}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddInternalNote} className="space-y-2 pt-2 border-t border-gray-100">
              <textarea
                required
                rows={2}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add private debugging note or task coordination..."
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              ></textarea>
              <button
                type="submit"
                disabled={savingNote || !newNote.trim()}
                className="w-full py-1.5 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-sm transition-colors"
              >
                {savingNote ? "Saving Note..." : "Save Internal Note"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
