"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { BookOpen, Shield, User, Lock, ArrowRight } from "lucide-react";

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
      setError(err.message || "Failed to log in");
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
    <div className="max-w-md mx-auto my-12 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-8 text-white text-center">
        <div className="w-14 h-14 bg-white/20 rounded-2xl mx-auto flex items-center justify-center mb-3 backdrop-blur-sm">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">BookLeaf Publishing</h1>
        <p className="text-amber-100 text-sm mt-1">Author Support & Operations Portal</p>
      </div>

      <div className="p-8">
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="author@email.com"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-sm shadow-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-500 font-medium mb-3 text-center uppercase tracking-wider">
            Quick Fill Demo Accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("priya.sharma@email.com", "Author123!")}
              className="p-2.5 text-left border border-amber-200 bg-amber-50/50 hover:bg-amber-100/50 rounded-lg text-xs transition-colors"
            >
              <div className="font-semibold text-amber-900 flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-amber-700" /> Author Demo
              </div>
              <div className="text-gray-600 text-[11px] truncate mt-0.5">Priya Sharma</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("admin@bookleafpub.com", "Admin123!")}
              className="p-2.5 text-left border border-purple-200 bg-purple-50/50 hover:bg-purple-100/50 rounded-lg text-xs transition-colors"
            >
              <div className="font-semibold text-purple-900 flex items-center">
                <Shield className="w-3.5 h-3.5 mr-1 text-purple-700" /> Admin Demo
              </div>
              <div className="text-gray-600 text-[11px] truncate mt-0.5">Operations Desk</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
