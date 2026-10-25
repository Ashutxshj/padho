"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { BookOpen, Ticket, PlusCircle, LogOut, ShieldCheck, User as UserIcon } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const isAuthor = user.role === "author";

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href={isAuthor ? "/author/books" : "/admin/queue"} className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold shadow-sm">
                BL
              </div>
              <div>
                <span className="font-bold text-gray-900 text-lg leading-tight block">BookLeaf</span>
                <span className="text-xs text-gray-500 block leading-tight">Author Portal & Support</span>
              </div>
            </Link>

            <nav className="hidden md:flex space-x-2">
              {isAuthor ? (
                <>
                  <Link
                    href="/author/books"
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === "/author/books"
                        ? "bg-amber-50 text-amber-900 font-semibold"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <BookOpen className="w-4 h-4 mr-1.5 text-amber-600" />
                    My Books
                  </Link>
                  <Link
                    href="/author/tickets"
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname.startsWith("/author/tickets") && pathname !== "/author/tickets/new"
                        ? "bg-amber-50 text-amber-900 font-semibold"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Ticket className="w-4 h-4 mr-1.5 text-amber-600" />
                    My Tickets
                  </Link>
                  <Link
                    href="/author/tickets/new"
                    className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 shadow-sm ml-2"
                  >
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    Submit Query
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/admin/queue"
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname.startsWith("/admin/queue") || pathname.startsWith("/admin/tickets")
                        ? "bg-amber-50 text-amber-900 font-semibold"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 mr-1.5 text-amber-600" />
                    Operations Queue
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <UserIcon className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{user.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                isAuthor ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
              }`}>
                {user.role.toUpperCase()}
              </span>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
