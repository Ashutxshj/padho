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
import { CardSkeleton, Skeleton } from "@/components/Skeleton";

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

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const updated = await apiRequest<TicketDetail>(`/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setTicket((prev) => (prev ? { ...prev, status: updated.status } : prev));
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleCategoryOverride = async (newCat: string) => {
    try {
      const updated = await apiRequest<TicketDetail>(`/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({ category: newCat }),
      });
      setTicket((prev) => (prev ? { ...prev, category: updated.category } : prev));
    } catch (err) {
      console.error("Failed to override category", err);
    }
  };

  const handlePriorityOverride = async (newPri: string) => {
    try {
      const updated = await apiRequest<TicketDetail>(`/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({ priority: newPri }),
      });
      setTicket((prev) => (prev ? { ...prev, priority: updated.priority } : prev));
    } catch (err) {
      console.error("Failed to override priority", err);
    }
  };

  const handleGenerateAIDraft = async () => {
    setDraftingAI(true);
    try {
      const res = await apiRequest<AIDraftResponse>(`/ai/draft-response`, {
        method: "POST",
        body: JSON.stringify({ ticket_id: ticketId }),
      });
      setAiDraft(res);
      setNewReply(res.suggested_draft);
    } catch (err) {
      console.error("Failed to generate AI response draft", err);
    } finally {
      setDraftingAI(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    setSendingReply(true);
    try {
      const newMsg = await apiRequest<TicketMessage>(`/tickets/${ticketId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message_body: newReply }),
      });

      setTicket((prev) => (prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev));
      setNewReply("");
      if (ticket && ticket.status === "Open") {
        setTicket((prev) => (prev ? { ...prev, status: "In Progress" } : prev));
      }
    } catch (err) {
      console.error("Failed to send response", err);
    } finally {
      setSendingReply(false);
    }
  };

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
      <div className="space-y-6">
        <Skeleton className="h-4 w-36" />
        <CardSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="lg:col-span-5">
            <div className="card-surface h-96 p-6 rounded-md">
              <Skeleton className="h-full w-full" />
            </div>
          </div>
          <div className="lg:col-span-4 space-y-4">
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/queue"
        className="text-xs font-semibold uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors"
      >
        &larr; Back to Operations Queue
      </Link>

      {/* Top Header Card */}
      <div className="card-surface p-6 sm:p-8 rounded-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2.5 py-1 rounded-sm border border-stone-300">
              {ticket.reference_no}
            </span>
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />

            {ticket.is_overdue && (
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-rose-50 text-rose-800 border border-rose-300">
                Overdue SLA (&gt;48h)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-stone-500 font-medium">Status Override:</span>
            <select
              value={ticket.status}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              className="px-2.5 py-1 border border-stone-300 rounded-sm text-xs font-semibold bg-white text-stone-900 focus:outline-none focus:border-stone-900"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-stone-900">
          {ticket.subject}
        </h1>

        <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-stone-500 pt-1">
          <span>Author: <strong className="text-stone-800">{ticket.author_name}</strong> ({ticket.author_email})</span>
          <span>Lodged: {new Date(ticket.created_at).toLocaleString("en-IN")}</span>
          {ticket.book_title && <span>Catalog Title: <strong className="text-stone-800">{ticket.book_title}</strong></span>}
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Author Profile and Book Record (3 Cols) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Author Card */}
          <div className="card-surface p-5 rounded-md space-y-3">
            <div className="text-xs font-bold text-stone-500 uppercase tracking-widest border-b border-stone-100 pb-2">
              Author Profile
            </div>
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="font-bold text-stone-900 text-sm">{ticket.author_name}</div>
              <div>{ticket.author_email}</div>
              {ticket.author_phone && <div>Phone: {ticket.author_phone}</div>}
              {ticket.author_city && <div>City: {ticket.author_city}</div>}
              <div>Member Since: {ticket.author_joined_date || "N/A"}</div>
            </div>
          </div>

          {/* Book & Royalty Context */}
          {ticket.book ? (
            <div className="card-surface p-5 rounded-md space-y-3">
              <div className="text-xs font-bold text-stone-500 uppercase tracking-widest border-b border-stone-100 pb-2">
                Catalog Context
              </div>
              <div className="space-y-2 text-xs text-stone-600">
                <div className="font-bold text-stone-900">{ticket.book.title}</div>
                <div>ISBN: {ticket.book.isbn || "Pending Assignment"}</div>
                <div>Status: <span className="font-semibold text-stone-800">{ticket.book.status}</span></div>

                <div className="pt-2 border-t border-stone-100 space-y-1">
                  <div className="flex justify-between">
                    <span>Units Sold:</span>
                    <span className="font-bold text-stone-900">{ticket.book.total_copies_sold}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lifetime Royalty:</span>
                    <span className="font-bold text-stone-900">₹{ticket.book.total_royalty_earned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disbursed:</span>
                    <span className="font-bold text-stone-900">₹{ticket.book.royalty_paid}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-stone-100 text-stone-900">
                    <span>Pending Royalty:</span>
                    <span>₹{ticket.book.royalty_pending}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-surface p-5 rounded-md text-xs text-stone-500 text-center">
              General or Account inquiry (No catalog title linked).
            </div>
          )}

          {/* AI Decision Rationale Card */}
          <div className="card-surface p-5 rounded-md space-y-2 text-xs">
            <div className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">
              Triage Classification Rationale
            </div>
            <div className="text-stone-600 leading-relaxed">
              {ticket.ai_rationale || "Automated triage executed using standard BookLeaf routing rules."}
            </div>
          </div>
        </div>

        {/* Center Column: Public Author Thread (5 Cols) */}
        <div className="lg:col-span-5 card-surface rounded-md flex flex-col h-[650px] overflow-hidden">
          <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              Author Correspondence ({ticket.messages.length})
            </span>
            <span className="text-xs text-stone-500">Live Stream Connected</span>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#faf9f6]">
            {ticket.messages.map((msg) => {
              const isAdmin = msg.sender_role === "admin";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center space-x-1.5 text-xs text-stone-500 mb-1">
                    <span className="font-semibold text-stone-800">
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
                    className={`max-w-md p-3.5 rounded-sm text-xs leading-relaxed whitespace-pre-wrap border ${
                      isAdmin
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

          {/* Reply Form */}
          <form onSubmit={handleSendReply} className="p-4 border-t border-stone-200 space-y-3 bg-white">
            <textarea
              required
              rows={3}
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder="Type public response to author, or click 'Generate Draft Reply' on the right..."
              className="w-full px-3 py-2 border border-stone-300 rounded-sm text-xs bg-white text-stone-900 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sendingReply || !newReply.trim()}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-sm text-xs font-semibold shadow-sm transition-colors"
              >
                {sendingReply ? "Sending..." : "Send Public Reply"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: AI Draft Studio, Overrides & Staff Notes (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Triage Overrides Card */}
          <div className="card-surface p-5 rounded-md space-y-3">
            <div className="text-xs font-bold text-stone-700 uppercase tracking-wider border-b border-stone-100 pb-2">
              Staff Triage Overrides
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-500 mb-1 font-medium">
                  Category (Suggested: <em>{ticket.ai_category_suggestion || "None"}</em>)
                </label>
                <select
                  value={ticket.category}
                  onChange={(e) => handleCategoryOverride(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-sm text-xs bg-white text-stone-900 focus:outline-none focus:border-stone-900"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-500 mb-1 font-medium">
                  Priority (Suggested: <em>{ticket.ai_priority_suggestion || "None"}</em>)
                </label>
                <select
                  value={ticket.priority}
                  onChange={(e) => handlePriorityOverride(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-sm text-xs bg-white text-stone-900 focus:outline-none focus:border-stone-900"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* AI Response Draft Studio (No Sparkles, Flat Editorial Panel) */}
          <div className="card-surface p-5 rounded-md space-y-3 border-stone-300">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                Response Draft Assistant
              </div>
              <button
                type="button"
                onClick={handleGenerateAIDraft}
                disabled={draftingAI}
                className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-sm text-[11px] font-semibold transition-colors shadow-sm"
              >
                {draftingAI ? "Drafting..." : "Generate Draft"}
              </button>
            </div>

            <p className="text-xs text-stone-500 leading-normal">
              Grounded in official BookLeaf Knowledge Base policies and the author&apos;s verified sales figures.
            </p>

            {aiDraft && (
              <div className="space-y-3 pt-2 border-t border-stone-100">
                <div className="flex flex-wrap gap-1">
                  {aiDraft.grounded_policies_used.map((policy) => (
                    <span
                      key={policy}
                      className="px-1.5 py-0.5 bg-stone-100 text-stone-800 border border-stone-200 rounded-sm text-[10px] font-medium"
                    >
                      {policy}
                    </span>
                  ))}
                </div>
                <div className="p-3 bg-stone-50 rounded-sm border border-stone-200 text-xs text-stone-800 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {aiDraft.suggested_draft}
                </div>
                <button
                  type="button"
                  onClick={() => setNewReply(aiDraft.suggested_draft)}
                  className="w-full py-1.5 text-center bg-white hover:bg-stone-50 border border-stone-300 text-stone-900 rounded-sm text-xs font-semibold transition-colors shadow-sm"
                >
                  Insert Draft Into Reply Composer
                </button>
              </div>
            )}
          </div>

          {/* Private Internal Staff Notes */}
          <div className="card-surface p-5 rounded-md space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 uppercase tracking-wider border-b border-stone-100 pb-2">
              <span>Internal Notes ({internalNotes.length})</span>
              <span className="text-[10px] font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-sm">
                Staff Confidential
              </span>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto divide-y divide-stone-100">
              {internalNotes.length === 0 ? (
                <div className="text-center py-3 text-xs text-stone-400">
                  No internal staff notes on this inquiry.
                </div>
              ) : (
                internalNotes.map((note) => (
                  <div key={note.id} className="pt-2 first:pt-0 text-xs space-y-1">
                    <div className="flex justify-between text-[11px] text-stone-400">
                      <span className="font-semibold text-stone-700">{note.staff_name || "Staff Member"}</span>
                      <span>{new Date(note.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className="text-stone-800 bg-stone-50 p-2.5 rounded-sm border border-stone-200 leading-relaxed">
                      {note.note_text}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddInternalNote} className="space-y-2 pt-2 border-t border-stone-100">
              <textarea
                required
                rows={2}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Log internal note, warehouse follow-up, or verification notes..."
                className="w-full px-2.5 py-1.5 border border-stone-300 rounded-sm text-xs bg-white text-stone-900 focus:outline-none focus:border-stone-900 leading-relaxed"
              />
              <button
                type="submit"
                disabled={savingNote || !newNote.trim()}
                className="w-full py-1.5 bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-white rounded-sm text-xs font-semibold shadow-sm transition-colors"
              >
                {savingNote ? "Saving..." : "Save Internal Note"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
