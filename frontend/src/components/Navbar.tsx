"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const isAuthor = user.role === "author";

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex justify-between items-center h-18 py-3">
          <div className="flex items-center space-x-10">
            <Link href={isAuthor ? "/author/books" : "/admin/queue"} className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-sm bg-stone-900 flex items-center justify-center text-white font-serif font-bold text-base shadow-sm">
                B
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-stone-900 text-base tracking-tight leading-none">
                  BookLeaf Publishing
                </span>
                <span className="text-[11px] text-stone-500 uppercase tracking-widest mt-1">
                  Author Support
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              {isAuthor ? (
                <>
                  <Link
                    href="/author/books"
                    className={`px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
                      pathname === "/author/books"
                        ? "bg-stone-100 text-stone-900 font-semibold"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                    }`}
                  >
                    Catalog & Royalties
                  </Link>
                  <Link
                    href="/author/tickets"
                    className={`px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
                      pathname.startsWith("/author/tickets") && pathname !== "/author/tickets/new"
                        ? "bg-stone-100 text-stone-900 font-semibold"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                    }`}
                  >
                    Support Inquiries
                  </Link>
                  <Link
                    href="/author/tickets/new"
                    className="ml-3 px-3.5 py-1.5 rounded-sm text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 transition-colors shadow-sm"
                  >
                    Submit Inquiry
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/admin/queue"
                    className={`px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
                      pathname.startsWith("/admin/queue") || pathname.startsWith("/admin/tickets")
                        ? "bg-stone-100 text-stone-900 font-semibold"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                    }`}
                  >
                    Operations Triage Queue
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-xs text-stone-700 bg-stone-50 px-3 py-1.5 rounded-sm border border-stone-200">
              <span className="font-semibold text-stone-900">{user.name}</span>
              <span className="text-stone-300">/</span>
              <span className="uppercase tracking-wider font-semibold text-stone-500">
                {user.role}
              </span>
            </div>

            <button
              onClick={logout}
              className="text-xs font-semibold uppercase tracking-wider text-stone-500 hover:text-stone-900 hover:bg-stone-100 px-3 py-1.5 rounded-sm transition-colors border border-transparent hover:border-stone-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
