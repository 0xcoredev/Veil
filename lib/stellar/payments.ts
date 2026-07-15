import {
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
} from "@stellar/stellar-sdk";
import { Horizon } from "@stellar/stellar-sdk";

const HORIZON_URL = process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL!;
const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE!;

const server = new Horizon.Server(HORIZON_URL);

export async function getAccountBalance(publicKey: string): Promise<string> {
  try {
    const account = await server.loadAccount(publicKey);
    const balance = account.balances.find(
      (b) => b.asset_type === "native"
    );
    return balance ? balance.balance : "0";
  } catch {
    return "0";
  }
}

export async function buildPaymentTransaction(
  sourcePublicKey: string,
  destination: string,
  amount: string,
  asset: Asset = Asset.native(),
  memo?: string
): Promise<string> {
  const account = await server.loadAccount(sourcePublicKey);

  const transaction = new TransactionBuilder(account, {
    fee: String(await server.fetchBaseFee()),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset,
        amount,
      })
    )
    .setTimeout(180)
    .build();

  return transaction.toXDR();
}
