"use client";

import { useState, useEffect } from "react";

export function NetworkBadge() {
  const [network, setNetwork] = useState<string>("testnet");

  useEffect(() => {
    const net = process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet";
    setNetwork(net);
  }, []);

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border border-yellow-500/30 bg-yellow-500/10 text-yellow-500">
      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
      {network.charAt(0).toUpperCase() + network.slice(1)}
    </div>
  );
}
