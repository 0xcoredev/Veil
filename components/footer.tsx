import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Veil</span>
            <span className="text-xs text-muted-foreground">
              Powered by Stellar
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Speak freely. Stay veiled. Decentralized communication on Stellar.
          </p>
        </div>
      </div>
    </footer>
  );
}
