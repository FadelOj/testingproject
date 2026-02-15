"use client";
import Link from "next/link";

import { ModeToggle } from "./mode-toggle";

export default function Header() {
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display text-lg font-semibold tracking-tight">
            Gold Profit
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/">Home</Link>
            <Link href="/dashboard">Dashboard</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
