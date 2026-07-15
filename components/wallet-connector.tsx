"use client";

import { useState, useEffect, useCallback } from "react";
import { isConnected, requestAccess, signTransaction } from "@stellar/freighter-api";
import { truncateAddress } from "@/lib/utils";
import { toast } from "sonner";
import { Wallet, LogOut, Copy, Check } from "lucide-react";

interface WalletState {
  connected: boolean;
  address: string | null;
  loading: boolean;
}

export default function ConnectWallet() {
  const [state, setState] = useState<WalletState>({
    connected: false,
    address: null,
    loading: false,
  });
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const result = await isConnected();
      if (result.isConnected) {
        const access = await requestAccess();
        if (!access.error) {
          setState({
            connected: true,
            address: access.address,
            loading: false,
          });
        }
      }
    } catch (error) {
      console.error("Wallet check failed:", error);
    }
  };

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const result = await isConnected();
      if (!result.isConnected) {
        toast.error("Please install Freighter wallet extension");
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      const access = await requestAccess();
      if (access.error) {
        throw new Error(access.error.message);
      }

      setState({
        connected: true,
        address: access.address,
        loading: false,
      });
      toast.success("Wallet connected!");
    } catch (error) {
      console.error("Connection failed:", error);
      toast.error("Failed to connect wallet");
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({ connected: false, address: null, loading: false });
    setShowDropdown(false);
    toast.success("Wallet disconnected");
  }, []);

  const copyAddress = useCallback(() => {
    if (state.address) {
      navigator.clipboard.writeText(state.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [state.address]);

  if (!state.connected) {
    return (
      <button
        onClick={connect}
        disabled={state.loading}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        <Wallet className="h-4 w-4" />
        {state.loading ? "Connecting..." : "Connect Wallet"}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
      >
        <div className="w-2 h-2 rounded-full bg-green-500" />
        {truncateAddress(state.address!, 4)}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-lg z-50 p-3">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Connected</p>
                <p className="text-sm font-mono truncate">{state.address}</p>
              </div>
            </div>

            <div className="flex gap-1">
              <button
                onClick={copyAddress}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border hover:bg-muted transition-colors"
              >
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={disconnect}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="h-3 w-3" />
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
