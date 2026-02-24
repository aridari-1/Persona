"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/providers/AppProvider";

export default function Gate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useApp();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return null;
  }

  return <>{children}</>;
}