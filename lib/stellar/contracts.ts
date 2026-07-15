// Soroban contract interaction helpers
// These functions interact with deployed Soroban contracts on testnet

const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL!;
const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE!;

function getRpcServer() {
  const { rpc } = require("@stellar/stellar-sdk");
  return new rpc.Server(RPC_URL);
}

function getStellarModules() {
  return require("@stellar/stellar-sdk");
}

// Contract IDs (set after deployment)
export const CONTRACT_IDS = {
  tokenGate: process.env.NEXT_PUBLIC_TOKEN_GATE_CONTRACT || "",
  governance: process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT || "",
  reputation: process.env.NEXT_PUBLIC_REPUTATION_CONTRACT || "",
};

// --- Token Gate ---

export async function checkTokenGateAccess(
  userAddress: string,
  roomId: string
): Promise<boolean> {
  if (!CONTRACT_IDS.tokenGate) {
    return true;
  }

  try {
    const { Contract, Address, TransactionBuilder } = getStellarModules();
    const { rpc } = getStellarModules();
    const rpcServer = getRpcServer();
    const contract = new Contract(CONTRACT_IDS.tokenGate);
    const user = new Address(userAddress);

    const account = await rpcServer.getAccount(userAddress);
    const tx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("check_access", user.toScVal()))
      .setTimeout(30)
      .build();

    const result = await rpcServer.simulateTransaction(tx);
    return rpc.Api.isSimulationSuccess(result);
  } catch (error) {
    console.error("Token gate check failed:", error);
    return true;
  }
}

// --- Governance ---

export async function createProposal(
  proposerAddress: string,
  roomId: string,
  action: string,
  targetUser: string
): Promise<number | null> {
  if (!CONTRACT_IDS.governance) {
    return null;
  }

  try {
    const { Contract, Address, TransactionBuilder } = getStellarModules();
    const { rpc } = getStellarModules();
    const rpcServer = getRpcServer();
    const contract = new Contract(CONTRACT_IDS.governance);
    const proposer = new Address(proposerAddress);
    const target = new Address(targetUser);

    const account = await rpcServer.getAccount(proposerAddress);
    const tx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("propose", proposer.toScVal(), target.toScVal()))
      .setTimeout(30)
      .build();

    const result = await rpcServer.simulateTransaction(tx);
    return rpc.Api.isSimulationSuccess(result) ? 0 : null;
  } catch (error) {
    console.error("Proposal creation failed:", error);
    return null;
  }
}

// --- Reputation ---

export async function getReputation(
  userAddress: string
): Promise<{ score: number; messagesSent: number; roomsCreated: number }> {
  if (!CONTRACT_IDS.reputation) {
    return { score: 0, messagesSent: 0, roomsCreated: 0 };
  }

  try {
    const { Contract, Address, TransactionBuilder } = getStellarModules();
    const { rpc } = getStellarModules();
    const rpcServer = getRpcServer();
    const contract = new Contract(CONTRACT_IDS.reputation);
    const user = new Address(userAddress);

    const account = await rpcServer.getAccount(userAddress);
    const tx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("get_reputation", user.toScVal()))
      .setTimeout(30)
      .build();

    const result = await rpcServer.simulateTransaction(tx);
    return rpc.Api.isSimulationSuccess(result)
      ? { score: 0, messagesSent: 0, roomsCreated: 0 }
      : { score: 0, messagesSent: 0, roomsCreated: 0 };
  } catch (error) {
    console.error("Reputation query failed:", error);
    return { score: 0, messagesSent: 0, roomsCreated: 0 };
  }
}

// --- Balance Check (for token gates) ---

export async function checkTokenBalance(
  userAddress: string,
  assetCode: string,
  assetIssuer?: string
): Promise<number> {
  try {
    const { Horizon } = getStellarModules();
    const horizonServer = new Horizon.Server(
      process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL!
    );
    const account = await horizonServer.loadAccount(userAddress);
    const balance = account.balances.find((b: any) => {
      if (assetCode === "XLM" && b.asset_type === "native") return true;
      return (
        "asset_code" in b &&
        b.asset_code === assetCode &&
        (!assetIssuer || ("asset_issuer" in b && b.asset_issuer === assetIssuer))
      );
    });

    return balance ? Number(balance.balance) : 0;
  } catch {
    return 0;
  }
}
