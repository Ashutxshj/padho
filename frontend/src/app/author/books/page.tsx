"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { Book, RoyaltySummary, PaginatedResponse } from "@/types";
import { Skeleton, CardSkeleton, TableSkeleton } from "@/components/Skeleton";

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
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CardSkeleton />
          </div>
          <CardSkeleton />
        </div>
        <div className="card-surface rounded-md">
          <TableSkeleton rows={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Author Catalog & Royalties
          </h1>
          <p className="text-sm text-stone-500 mt-1 leading-relaxed">
            Manage your published titles, track quarterly earnings, and review platform distribution channels.
          </p>
        </div>
        <div>
          <Link
            href="/author/tickets/new"
            className="inline-flex items-center px-4 py-2 border border-stone-900 rounded-sm text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 transition-colors shadow-sm"
          >
            Submit Inquiry
          </Link>
        </div>
      </div>

      {/* Financial Overview (Asymmetric 2-column layout, not a generic 3-box row) */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Financial Balance Sheet */}
          <div className="lg:col-span-2 card-surface p-6 sm:p-8 rounded-md">
            <div className="text-xs uppercase tracking-widest font-semibold text-stone-500 mb-4">
              Royalty Balance Sheet
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 pb-6 border-b border-stone-100">
              <div>
                <span className="text-xs text-stone-500 block">Total Royalty Earned</span>
                <span className="text-2xl font-bold text-stone-900 mt-1 block">
                  ₹{summary.total_earned.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] text-stone-400 mt-1 block">
                  80% net profit share
                </span>
              </div>

              <div>
                <span className="text-xs text-stone-500 block">Disbursed to Bank</span>
                <span className="text-2xl font-bold text-stone-900 mt-1 block">
                  ₹{summary.total_paid.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Settled transfers
                </span>
              </div>

              <div>
                <span className="text-xs text-stone-500 block">Current Balance Pending</span>
                <span className="text-2xl font-bold text-stone-900 mt-1 block">
                  ₹{summary.total_pending.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Outstanding balance
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-500 mt-4 leading-relaxed">
              Net Profit Formula: MRP minus the sum of printing cost, platform commission (Amazon/Flipkart), and shipping charges.
              Disbursements occur within 45 days after quarter close.
            </p>
          </div>

          {/* Disbursement Status & Action Card */}
          <div className="card-surface p-6 sm:p-8 rounded-md flex flex-col justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest font-semibold text-stone-500 mb-3">
                Disbursement Status
              </div>

              <div className="my-4">
                {summary.eligible_for_payout ? (
                  <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-sm text-xs text-amber-900">
                    <span className="font-semibold block">Eligible for Next Quarter Run</span>
                    <span className="mt-1 block text-amber-800">
                      Balance exceeds the ₹1,000 threshold and is queued for transfer to your registered account.
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-sm text-xs text-stone-700">
                    <span className="font-semibold block">Below ₹1,000 Threshold</span>
                    <span className="mt-1 block text-stone-500">
                      Earnings below ₹1,000 automatically roll over to the subsequent quarter.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-stone-100 pt-4 mt-4">
              <Link
                href="/author/tickets/new"
                className="text-xs font-semibold text-stone-800 hover:text-stone-950 underline underline-offset-4"
              >
                Inquire about royalty calculations &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Catalog List */}
      <div className="card-surface rounded-md overflow-hidden">
        <div className="p-6 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900">
            Registered Catalog Titles ({books.length})
          </h2>
          <span className="text-xs text-stone-500">
            Official BookLeaf Publisher Imprint
          </span>
        </div>

        <div className="divide-y divide-stone-200">
          {books.map((book) => {
            const isProduction = book.status.includes("Production");

            return (
              <div key={book.id} className="p-6 sm:p-8 hover:bg-stone-50/40 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="space-y-3 max-w-xl">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2 py-0.5 rounded-sm bg-stone-100 text-stone-700 border border-stone-200 font-medium">
                        {book.genre}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-sm border ${
                        isProduction
                          ? "bg-amber-50 text-amber-900 border-amber-300 font-semibold"
                          : "bg-stone-100 text-stone-800 border-stone-300 font-medium"
                      }`}>
                        {book.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-stone-900 tracking-tight">
                      {book.title}
                    </h3>

                    <div className="text-xs text-stone-500 flex flex-wrap gap-x-6 gap-y-1.5 pt-1">
                      <span><strong>ISBN:</strong> {book.isbn || "Pending Assignment"}</span>
                      {book.publication_date && <span><strong>Published:</strong> {book.publication_date}</span>}
                      {book.print_partner && <span><strong>Print Facility:</strong> {book.print_partner}</span>}
                    </div>

                    {book.available_on && book.available_on.length > 0 && (
                      <div className="pt-2">
                        <span className="text-xs text-stone-500 block mb-1.5 font-medium">
                          Active Distribution Channels:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {book.available_on.map((channel, i) => (
                            <span
                              key={i}
                              className="text-[11px] px-2 py-0.5 rounded-sm bg-white border border-stone-200 text-stone-600"
                            >
                              {channel}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Financial Column per book */}
                  <div className="lg:text-right border-t lg:border-t-0 pt-4 lg:pt-0 border-stone-100">
                    {isProduction ? (
                      <div className="text-xs text-stone-500 max-w-xs lg:ml-auto">
                        <span className="font-semibold block text-stone-800">In Production Pipeline</span>
                        <span>Pricing and sales reports activate upon final live publication.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-xs text-stone-500">
                          MRP: <strong className="text-stone-900">₹{book.mrp}</strong> &bull; Per-copy royalty: ₹{book.author_royalty_per_copy}
                        </div>
                        <div className="text-sm text-stone-600">
                          Copies Sold: <strong className="text-stone-900">{book.total_copies_sold}</strong>
                        </div>
                        <div className="text-base font-bold text-stone-900 pt-1">
                          Earned: ₹{(book.total_royalty_earned || 0).toLocaleString("en-IN")}
                        </div>
                        <div className="text-xs text-stone-500">
                          Paid: ₹{(book.royalty_paid || 0).toLocaleString("en-IN")} | Pending: <span className="font-semibold text-stone-900">₹{(book.royalty_pending || 0).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <Link
                        href={`/author/tickets/new?book_id=${book.id}`}
                        className="text-xs font-semibold text-stone-700 hover:text-stone-900 underline underline-offset-4"
                      >
                        Query about this book &rarr;
                      </Link>
                    </div>
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
