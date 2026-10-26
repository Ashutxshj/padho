"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === "author") {
        router.push("/author/books");
      } else {
        router.push("/admin/queue");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto my-12">
      <div className="card-surface rounded-md border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-8 sm:p-10 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-sm bg-stone-900 flex items-center justify-center text-white font-serif font-bold text-sm">
              B
            </div>
            <span className="text-xs uppercase tracking-widest font-semibold text-stone-500">
              BookLeaf Publishing
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Sign In to Portal
          </h1>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed">
            Access your author catalog, quarterly royalty statements, or operations queue.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 sm:p-10 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-sm text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-sm text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white font-medium text-sm rounded-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          {/* Test Account Selector */}
          <div className="border-t border-stone-200 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
              Pre-Seeded Accounts
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@bookleafpub.com", "Admin123!")}
                className="w-full flex items-center justify-between text-left p-2.5 rounded-sm border border-stone-200 hover:bg-stone-50 transition-colors text-xs"
              >
                <div>
                  <div className="font-semibold text-stone-900">Operations Admin</div>
                  <div className="text-stone-500">admin@bookleafpub.com</div>
                </div>
                <span className="px-2 py-0.5 rounded-sm bg-stone-100 text-stone-800 font-semibold text-[10px] uppercase tracking-wider border border-stone-200">
                  Staff
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("ananya.reddy@example.com", "Author123!")}
                className="w-full flex items-center justify-between text-left p-2.5 rounded-sm border border-stone-200 hover:bg-stone-50 transition-colors text-xs"
              >
                <div>
                  <div className="font-semibold text-stone-900">Ananya Reddy (₹2,546 Pending)</div>
                  <div className="text-stone-500">ananya.reddy@example.com</div>
                </div>
                <span className="px-2 py-0.5 rounded-sm bg-stone-100 text-stone-800 font-semibold text-[10px] uppercase tracking-wider border border-stone-200">
                  Author
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("kavita.deshmukh@example.com", "Author123!")}
                className="w-full flex items-center justify-between text-left p-2.5 rounded-sm border border-stone-200 hover:bg-stone-50 transition-colors text-xs"
              >
                <div>
                  <div className="font-semibold text-stone-900">Kavita Deshmukh (₹850 Rollover)</div>
                  <div className="text-stone-500">kavita.deshmukh@example.com</div>
                </div>
                <span className="px-2 py-0.5 rounded-sm bg-stone-100 text-stone-800 font-semibold text-[10px] uppercase tracking-wider border border-stone-200">
                  Author
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
