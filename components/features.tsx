import { Shield, Lock, Users, Zap, Globe, Vote } from "lucide-react";

const features = [
  {
    icon: Lock,
    title: "End-to-End Encrypted",
    description:
      "Messages are encrypted client-side with X25519 + AES-GCM. Not even we can read them.",
  },
  {
    icon: Shield,
    title: "Zero Identity",
    description:
      "Connect with your Stellar wallet. No email, phone, or personal data required.",
  },
  {
    icon: Users,
    title: "Token-Gated Rooms",
    description:
      "Create exclusive communities that require holding specific tokens to access.",
  },
  {
    icon: Vote,
    title: "DAO Governance",
    description:
      "Community-driven moderation through on-chain voting. No central authority.",
  },
  {
    icon: Zap,
    title: "Micropayments",
    description:
      "Tip message authors and pay for premium rooms with sub-cent Stellar transactions.",
  },
  {
    icon: Globe,
    title: "Global Access",
    description:
      "475,000+ on/off ramp locations worldwide. Access from anywhere with an internet connection.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Built for Privacy</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every feature designed to protect your identity and communication.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-2xl border border-border/50 hover:border-primary/25 hover:bg-muted/30 transition-colors"
            >
              <feature.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
