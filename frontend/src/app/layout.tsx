import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-source-sans",
});

export const metadata: Metadata = {
  title: "BookLeaf Author Support & Communication Portal",
  description: "Operations and author support portal for book royalties, ticket triage, and knowledge-grounded communication.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={sourceSans.className}>
      <body className="min-h-screen flex flex-col bg-[#fbfbf9] text-stone-900 selection:bg-amber-100 selection:text-amber-900">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-10">
            {children}
          </main>
          <footer className="border-t border-stone-200 bg-white py-6 text-xs text-stone-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                BookLeaf Publishing Author Support & Communication Portal &copy; {new Date().getFullYear()}
              </div>
              <div className="flex items-center space-x-6">
                <Link href="/terms" className="text-stone-500 hover:text-stone-800 transition-colors">
                  Terms of Service
                </Link>
                <Link href="/privacy" className="text-stone-500 hover:text-stone-800 transition-colors">
                  Privacy Policy
                </Link>
                <span className="text-stone-400">Internal Evaluation Build</span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
