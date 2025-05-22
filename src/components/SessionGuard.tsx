"use client";

import { useSession } from "next-auth/react";
import { ReactNode } from "react";
import {ThemeProvider} from 'next-themes';
import { Toaster } from "react-hot-toast";

export default function SessionGuard({ children }: { children: ReactNode }) {
  const { status } = useSession();

  if (status === "loading") return <p className="text-center p-6">Loading...</p>;

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <Toaster position="bottom-right" reverseOrder={false} />
      {children}
    </ThemeProvider>
  );
}
