import { Shield, Eye, Server, Key } from "lucide-react";

export function Security() {
  return (
    <section id="security" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Security by Design</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Privacy isn&apos;t a feature — it&apos;s the foundation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Client-Side Encryption</h3>
                <p className="text-sm text-muted-foreground">
                  All messages are encrypted in your browser before being sent.
                  The server never sees plaintext.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Zero Knowledge</h3>
                <p className="text-sm text-muted-foreground">
                  We don&apos;t log IP addresses, metadata, or any identifying
                  information about your sessions.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Decentralized</h3>
                <p className="text-sm text-muted-foreground">
                  No central server holds your data. Messages are stored
                  encrypted and can only be read by room members.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Open Source</h3>
                <p className="text-sm text-muted-foreground">
                  Every line of code is auditable. Verify our security claims
                  yourself.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
