import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to speak freely?</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Connect your Stellar wallet and join anonymous communities today.
        </p>
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Launch Veil
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
