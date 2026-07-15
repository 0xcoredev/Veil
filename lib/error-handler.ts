import { toast } from "sonner";

type ErrorType =
  | "NETWORK"
  | "AUTH"
  | "SEND_MESSAGE"
  | "WALLET"
  | "ENCRYPTION"
  | "UNKNOWN";

const ERROR_MESSAGES: Record<ErrorType, string> = {
  NETWORK: "Network error. Please check your connection.",
  AUTH: "Authentication failed. Please try again.",
  SEND_MESSAGE: "Failed to send message. Please try again.",
  WALLET: "Wallet connection failed. Is Freighter installed?",
  ENCRYPTION: "Encryption error. Please refresh the page.",
  UNKNOWN: "Something went wrong. Please try again.",
};

export function handleAppError(error: unknown, type: ErrorType = "UNKNOWN") {
  console.error(`[${type}]`, error);
  toast.error(ERROR_MESSAGES[type]);
}
