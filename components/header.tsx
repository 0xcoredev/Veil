"use client";

import Link from "next/link";
import { useState } from "react";
import ConnectWallet from "./wallet-connector";
import { NetworkBadge } from "./network-badge";
import { Menu, X, Shield } from "lucide-react";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed w-full top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Veil</span>
          <NetworkBadge />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm hover:text-primary transition-colors">
            Features
          </Link>
          <Link href="#security" className="text-sm hover:text-primary transition-colors">
            Security
          </Link>
          <Link href="/chat" className="text-sm hover:text-primary transition-colors">
            Open App
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/chat"
            className="px-4 py-2 text-sm font-medium rounded-lg border hover:bg-muted transition-colors"
          >
            Launch Chat
          </Link>
          <ConnectWallet />
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {isOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur">
          <div className="px-4 py-4 space-y-3">
            <Link href="#features" className="block text-sm hover:text-primary">
              Features
            </Link>
            <Link href="#security" className="block text-sm hover:text-primary">
              Security
            </Link>
            <Link href="/chat" className="block text-sm hover:text-primary">
              Open App
            </Link>
            <div className="pt-3 border-t space-y-2">
              <Link
                href="/chat"
                className="block w-full px-4 py-2 text-sm font-medium rounded-lg border text-center"
              >
                Launch Chat
              </Link>
              <ConnectWallet />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
