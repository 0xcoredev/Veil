import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />

      <div className="relative max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary mb-8">
          <Shield className="h-3.5 w-3.5" />
          Privacy-first communication
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
          Speak freely.
          <br />
          <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Stay veiled.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Anonymous, end-to-end encrypted chat powered by Stellar.
          No emails. No phone numbers. Just your wallet.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start Chatting
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://stellar.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl border hover:bg-muted transition-colors"
          >
            Powered by Stellar
          </a>
        </div>
      </div>
    </section>
  );
}
