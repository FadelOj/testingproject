"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils"; // Assuming you have a utils file, standard in shadcn
import { ModeToggle } from "./mode-toggle";

export default function Header() {
  const pathname = usePathname();

  const navItemClass = (path: string) =>
    cn(
      "text-sm font-medium transition-colors hover:text-primary",
      pathname === path ? "text-foreground" : "text-muted-foreground"
    );

  return (
    <header className="sticky top-0 z-50 w-full glass-header">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-primary transition-all group-hover:scale-125" />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight text-foreground">
              Gold Profit
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className={navItemClass("/")}>
              Home
            </Link>
            <Link href="/dashboard" className={navItemClass("/dashboard")}>
              Dashboard
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}

