import { NextRequest, NextResponse } from "next/server";
import { verifyChallenge } from "@/lib/stellar/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createHash } from "crypto";

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

    // If Supabase is configured, handle registration and session sign-in
    const adminSupabase = createAdminClient();
    if (adminSupabase) {
      const email = `${address.toLowerCase()}@veil.anonymous`;
      const password = createHash("sha256")
        .update(address + process.env.STELLAR_SERVER_SECRET)
        .digest("hex");

      // Check if profile exists
      const { data: profile, error: profileError } = await adminSupabase
        .from("profiles")
        .select("id")
        .eq("stellar_address", address)
        .maybeSingle();

      let userId = profile?.id;

      if (!profile) {
        // Create user in auth.users
        const { data: userData, error: createError } = await adminSupabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { stellar_address: address }
        });

        if (createError) {
          // If the user already exists in auth.users but has no profile, handle it gracefully
          if (createError.message.includes("already registered") || createError.status === 422) {
            // User exists, retrieve their details
            const { data: listData } = await adminSupabase.auth.admin.listUsers();
            const existingUser = listData.users.find(u => u.email === email);
            if (existingUser) {
              userId = existingUser.id;
            }
          } else {
            console.error("Supabase user creation failed:", createError);
            return NextResponse.json({ error: createError.message }, { status: 500 });
          }
        } else if (userData?.user) {
          userId = userData.user.id;
        }

        // Insert new profile if we have a userId
        if (userId) {
          const { error: insertError } = await adminSupabase
            .from("profiles")
            .insert({
              id: userId,
              stellar_address: address,
              display_name: address.slice(0, 6) + "..." + address.slice(-4),
            });

          if (insertError) {
            console.error("Profile insertion failed:", insertError);
          }
        }
      }

      // Sign in user using cookie-based server client to set session cookies
      const serverSupabase = await createServerClient();
      if (serverSupabase) {
        const { data: signInData, error: signInError } = await serverSupabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.error("Supabase sign in failed:", signInError);
          return NextResponse.json({ error: signInError.message }, { status: 401 });
        }

        return NextResponse.json({
          token,
          address,
          session: signInData.session,
          user: signInData.user,
        });
      }
    }

    return NextResponse.json({ token, address });
  } catch (error: any) {
    console.error("Token verification failed:", error);
    return NextResponse.json(
      { error: error?.message || "Invalid challenge response" },
      { status: 401 }
    );
  }
}

