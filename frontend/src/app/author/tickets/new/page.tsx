"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { Book, PaginatedResponse, Ticket } from "@/types";

export default function NewTicketPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedBookId = searchParams.get("book_id") || "";

  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState(preSelectedBookId);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBooks() {
      try {
        const res = await apiRequest<PaginatedResponse<Book>>("/books");
        setBooks(res.items);
      } catch (err) {
        console.error("Failed to load books for dropdown", err);
      }
    }
    fetchBooks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiRequest<Ticket>("/tickets", {
        method: "POST",
        body: JSON.stringify({
          book_id: selectedBookId || null,
          subject,
          description,
        }),
      });

      router.push("/author/tickets");
    } catch (err: any) {
      setError(err.message || "Failed to submit inquiry. Please review required fields.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/author/books"
        className="text-xs font-semibold uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors"
      >
        &larr; Back to Catalog Dashboard
      </Link>

      <div className="card-surface rounded-md border border-stone-200 overflow-hidden">
        <div className="p-8 sm:p-10 border-b border-stone-200 bg-stone-50">
          <span className="text-xs uppercase tracking-widest font-semibold text-stone-500 block mb-2">
            Operations & Editorial Desk
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Submit Support Inquiry
          </h1>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed">
            Inquiries are automatically classified and routed to the responsible BookLeaf operations department.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
              Associated Catalog Title
            </label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-stone-300 rounded-sm text-sm bg-white text-stone-900 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors"
            >
              <option value="">General or Account Level (No specific title)</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.isbn || b.status})
                </option>
              ))}
            </select>
            <p className="text-xs text-stone-500 mt-2 leading-relaxed">
              Linking a book title provides our team with direct access to your print runs, ISBN records, and platform sales data.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
              Inquiry Subject
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Inconsistency in Amazon distribution status or royalty statement"
              className="w-full px-3.5 py-2.5 border border-stone-300 rounded-sm text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
              Detailed Description
            </label>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details regarding dates, batch numbers, or platforms to expedite investigation..."
              className="w-full px-3.5 py-2.5 border border-stone-300 rounded-sm text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors bg-white leading-relaxed"
            />
          </div>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-500">
              Target response window: 24 to 48 hours
            </span>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-6 bg-stone-900 hover:bg-stone-800 text-white font-medium text-sm rounded-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Inquiry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
