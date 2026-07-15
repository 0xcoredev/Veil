import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ rooms: [], demo: true });
  }

  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("is_private", false)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rooms: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured. Set up your .env.local first." },
      { status: 503 }
    );
  }

  const body = await request.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description, is_private } = body;

  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let roomId = "";
  for (let i = 0; i < 8; i++) {
    roomId += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const { data, error } = await supabase
    .from("rooms")
    .insert({
      id: roomId,
      name,
      description: description || null,
      is_private: is_private || false,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("room_members").insert({
    room_id: roomId,
    user_id: user.id,
  });

  return NextResponse.json({ room: data }, { status: 201 });
}
