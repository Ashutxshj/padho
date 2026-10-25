"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { Book, PaginatedResponse, Ticket } from "@/types";
import { ArrowLeft, Send, Paperclip, AlertCircle, CheckCircle2 } from "lucide-react";

export default function NewTicketPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedBookId = searchParams.get("book_id") || "";

  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState(preSelectedBookId);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [fileAttachment, setFileAttachment] = useState<File | null>(null);
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
      setError(err.message || "Failed to submit ticket");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/author/books"
        className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-amber-600 to-amber-700 text-white">
          <h1 className="text-xl font-bold">Submit a Support Query</h1>
          <p className="text-xs text-amber-100 mt-1">
            Our team and AI triage assistant will review your query and respond shortly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Associated Book
            </label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">General / Account Level (No specific book)</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.isbn || b.status})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-500 mt-1">
              Selecting your book allows our AI and operations desk to instantly inspect royalty and distribution metrics.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Subject Line *
            </label>
            <input
              type="text"
              required
              minLength={3}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Question regarding Q3 royalty payout or ISBN Amazon mismatch"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Detailed Description *
            </label>
            <textarea
              required
              minLength={10}
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide full details about your query, including dates or error messages if applicable..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            ></textarea>
            <p className="text-[11px] text-gray-500 mt-1">Minimum 10 characters.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Attach Supporting File or Photo (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-amber-500 transition-colors">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFileAttachment(e.target.files[0]);
                  }
                }}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center space-y-1"
              >
                <Paperclip className="w-5 h-5 text-gray-400" />
                <span className="text-xs font-medium text-amber-700 hover:text-amber-800">
                  {fileAttachment ? fileAttachment.name : "Choose a file (images, PDFs, documents up to 5MB)"}
                </span>
                {fileAttachment && (
                  <span className="text-[10px] text-emerald-600 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Ready for submission
                  </span>
                )}
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <Link
              href="/author/books"
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-5 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Submitting..." : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
