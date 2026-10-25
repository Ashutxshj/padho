import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "BookLeaf Author Support & Communication Portal",
  description: "Dual author & operations portal for book royalties, tickets, and AI-assisted responses.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
          <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-500">
            BookLeaf Publishing Author Support & Communication Portal &copy; {new Date().getFullYear()} &bull; Confidential Evaluation
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
