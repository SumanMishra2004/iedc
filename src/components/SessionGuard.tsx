"use client";

import { useSession } from "next-auth/react";
import { ReactNode } from "react";

export default function SessionGuard({ children }: { children: ReactNode }) {
  const { status } = useSession();

  if (status === "loading") return <p className="text-center p-6">Loading...</p>;

  return <>{children}</>;
}
