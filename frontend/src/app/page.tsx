"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role === "author") {
        router.push("/author/books");
      } else {
        router.push("/admin/queue");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex h-96 items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
    </div>
  );
}
