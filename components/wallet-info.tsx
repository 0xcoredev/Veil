"use client";

import { useState, useEffect } from "react";
import { isConnected, requestAccess } from "@stellar/freighter-api";
import { Wallet, Copy, Check, ExternalLink } from "lucide-react";
import { truncateAddress } from "@/lib/utils";

export function WalletInfo() {
  const [address, setAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const result = await isConnected();
        if (result.isConnected) {
          const access = await requestAccess();
          if (!access.error) {
            setAddress(access.address);
          }
        }
      } catch {}
    }
    check();
  }, []);

  if (!address) return null;

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 bg-muted/30 text-xs">
      <Wallet className="h-3.5 w-3.5 text-primary" />
      <span className="font-mono">{truncateAddress(address, 4)}</span>
      <button onClick={copyAddress} className="hover:text-primary transition-colors">
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </button>
      <a
        href={`https://stellar.expert/explorer/testnet/account/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-primary transition-colors"
      >
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
