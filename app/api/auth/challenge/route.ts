import { NextRequest, NextResponse } from "next/server";
import { generateChallenge } from "@/lib/stellar/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const account = searchParams.get("account");

  if (!account) {
    return NextResponse.json(
      { error: "Account parameter required" },
      { status: 400 }
    );
  }

  // Validate Stellar address format (starts with G, 56 chars)
  if (!/^G[A-Z0-9]{55}$/.test(account)) {
    return NextResponse.json(
      { error: "Invalid Stellar address" },
      { status: 400 }
    );
  }

  try {
    const transaction = await generateChallenge(account);
    return NextResponse.json({
      transaction,
      network_passphrase: process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE,
    });
  } catch (error) {
    console.error("Challenge generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate challenge" },
      { status: 500 }
    );
  }
}
