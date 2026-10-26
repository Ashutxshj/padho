"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/Skeleton";

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
    <div className="max-w-md mx-auto py-24 space-y-4">
      <Skeleton className="h-8 w-2/3 mx-auto" />
      <Skeleton className="h-4 w-1/2 mx-auto" />
      <Skeleton className="h-48 w-full mt-6" />
    </div>
  );
}
