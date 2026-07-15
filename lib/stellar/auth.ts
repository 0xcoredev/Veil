import {
  Keypair,
  TransactionBuilder,
  Operation,
  Transaction,
} from "@stellar/stellar-sdk";
import jwt from "jsonwebtoken";

const HOME_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SERVER_SECRET = process.env.STELLAR_SERVER_SECRET!;
const JWT_SECRET = process.env.JWT_SECRET!;
const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE!;

function getHorizonServer() {
  const { Horizon } = require("@stellar/stellar-sdk");
  return new Horizon.Server(process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL!);
}

export async function generateChallenge(account: string) {
  const serverKeypair = Keypair.fromSecret(SERVER_SECRET);
  const server = getHorizonServer();
  const serverAccount = await server.loadAccount(serverKeypair.publicKey());

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const transaction = new TransactionBuilder(serverAccount, {
    fee: "0",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.manageData({
        source: account,
        name: `${HOME_DOMAIN} auth`,
        value: Buffer.from(nonce),
      })
    )
    .addOperation(
      Operation.manageData({
        source: serverKeypair.publicKey(),
        name: "web_auth_domain",
        value: Buffer.from(HOME_DOMAIN),
      })
    )
    .setTimeout(900)
    .build();

  transaction.sign(serverKeypair);

  return transaction.toXDR();
}

export function verifyChallenge(signedXdr: string): { address: string; token: string } {
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE) as Transaction;

  if (tx.sequence !== "0") {
    throw new Error("Invalid sequence number");
  }

  const now = Math.floor(Date.now() / 1000);
  if (tx.timeBounds) {
    if (now < Number(tx.timeBounds.minTime) || now > Number(tx.timeBounds.maxTime)) {
      throw new Error("Challenge expired");
    }
  }

  const clientAccount = tx.operations[0].source;
  if (!clientAccount) {
    throw new Error("No source account in transaction");
  }

  const token = jwt.sign(
    {
      sub: clientAccount,
      iss: HOME_DOMAIN,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    },
    JWT_SECRET
  );

  return { address: clientAccount, token };
}

export function verifyToken(token: string): { sub: string } {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string };
  } catch {
    throw new Error("Invalid token");
  }
}
