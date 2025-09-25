
"use client";

import { useState } from "react";
import { Boxes, PanelLeft, User } from "lucide-react";
import Link from "next/link";
import { user } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DashboardNav } from "@/components/dashboard/nav";
import { ModeToggle } from "@/components/mode-toggle";
import { AnimatedTitle } from "@/components/dashboard/animated-title";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <div className="flex flex-col sm:gap-4 sm:py-4">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-xs">
                <SheetHeader>
                  <SheetTitle>
                     <Link
                      href="/dashboard"
                      className="group flex items-center gap-2 text-lg font-semibold"
                    >
                      <Boxes className="h-6 w-6 text-primary" />
                      <AnimatedTitle />
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <nav className="grid gap-6 text-lg font-medium mt-4">
                  <DashboardNav onLinkClick={() => setIsSheetOpen(false)} />
                </nav>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-4">
               <Link
                href="/dashboard"
                className="hidden items-center gap-2 text-lg font-semibold sm:flex"
              >
                <Boxes className="h-6 w-6 text-primary" />
                <AnimatedTitle />
              </Link>
            </div>
            <div className="relative ml-auto flex-1 md:grow-0">
              <ModeToggle />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="overflow-hidden rounded-full"
                >
                  <Avatar>
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/">Logout</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
          </main>
        </div>
      </div>
  );
}
