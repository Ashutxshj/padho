"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { Book, RoyaltySummary, PaginatedResponse } from "@/types";
import { BookOpen, DollarSign, CheckCircle2, AlertCircle, PlusCircle, ArrowUpRight } from "lucide-react";

export default function AuthorBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [summary, setSummary] = useState<RoyaltySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [booksRes, summaryRes] = await Promise.all([
          apiRequest<PaginatedResponse<Book>>("/books"),
          apiRequest<RoyaltySummary>("/books/summary/royalties"),
        ]);
        setBooks(booksRes.items);
        setSummary(summaryRes);
      } catch (err) {
        console.error("Failed to load author books", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Books & Royalties</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your published catalog, quarterly royalties, and distribution channels.
          </p>
        </div>
        <Link
          href="/author/tickets/new"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Raise Support Query
        </Link>
      </div>

      {/* Financial Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lifetime Earned</span>
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 mt-3">
              ₹{summary.total_earned.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-gray-500 mt-1">Based on BookLeaf 80/20 net profit split</div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Royalties Disbursed</span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 mt-3">
              ₹{summary.total_paid.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-emerald-700 font-medium mt-1">Direct bank transfers confirmed</div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Payout Balance</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                summary.eligible_for_payout ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"
              }`}>
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 mt-3">
              ₹{summary.total_pending.toLocaleString("en-IN")}
            </div>
            <div className="flex items-center mt-1 text-xs">
              {summary.eligible_for_payout ? (
                <span className="text-amber-700 font-semibold flex items-center">
                  &bull; Meets ₹1,000 threshold (Scheduled for quarterly payout)
                </span>
              ) : (
                <span className="text-gray-500">
                  &bull; Under ₹1,000 threshold (Rolls over to next quarter)
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Books Table / Cards */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Published & In-Production Titles ({books.length})</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {books.map((book) => {
            const isProduction = book.status.includes("Production");

            return (
              <div key={book.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                        {book.genre}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        isProduction
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {book.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900">{book.title}</h3>

                    <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                      <span><strong>ISBN:</strong> {book.isbn || "Pending Assignment"}</span>
                      {book.publication_date && <span><strong>Published:</strong> {book.publication_date}</span>}
                      {book.print_partner && <span><strong>Print Partner:</strong> {book.print_partner}</span>}
                    </div>

                    {book.available_on && book.available_on.length > 0 && (
                      <div className="flex items-center space-x-1.5 pt-1 text-xs text-gray-600">
                        <span className="font-medium text-gray-500">Available on:</span>
                        {book.available_on.map((ch) => (
                          <span key={ch} className="px-2 py-0.5 bg-gray-100 rounded text-gray-700 text-[11px]">
                            {ch}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Financial Breakdown */}
                  <div className="flex items-center gap-6 self-start lg:self-center">
                    {!isProduction ? (
                      <div className="grid grid-cols-3 gap-4 text-right">
                        <div>
                          <div className="text-xs text-gray-500">Copies Sold</div>
                          <div className="text-sm font-bold text-gray-900">{book.total_copies_sold.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Earned</div>
                          <div className="text-sm font-bold text-gray-900">₹{book.total_royalty_earned.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Pending</div>
                          <div className="text-sm font-bold text-amber-600">₹{book.royalty_pending.toLocaleString()}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-purple-700 bg-purple-50 px-3 py-2 rounded-lg border border-purple-100 font-medium">
                        Milestone in progress: No sales or royalty calculations active.
                      </div>
                    )}

                    <Link
                      href={`/author/tickets/new?book_id=${book.id}`}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Raise Ticket
                      <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
