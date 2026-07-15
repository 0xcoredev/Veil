import { NextRequest, NextResponse } from "next/server";
import { verifyChallenge } from "@/lib/stellar/auth";

export async function POST(request: NextRequest) {
  try {
    const { transaction } = await request.json();

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction XDR required" },
        { status: 400 }
      );
    }

    const { address, token } = verifyChallenge(transaction);

    return NextResponse.json({ token, address });
  } catch (error) {
    console.error("Token verification failed:", error);
    return NextResponse.json(
      { error: "Invalid challenge response" },
      { status: 401 }
    );
  }
}
