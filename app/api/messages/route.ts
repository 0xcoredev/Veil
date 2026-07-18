import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

let mockMessages: any[] = [];

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("room_id");
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!roomId) {
    return NextResponse.json({ error: "room_id required" }, { status: 400 });
  }

  if (!supabase) {
    const filtered = mockMessages
      .filter((m) => m.room_id === roomId)
      .slice(offset, offset + limit);
    return NextResponse.json({ messages: filtered, demo: true });
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  const { room_id, content } = body;

  if (!room_id || !content) {
    return NextResponse.json(
      { error: "room_id and content required" },
      { status: 400 }
    );
  }

  if (!supabase) {
    const demoMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      room_id,
      user_id: "00000000-0000-0000-0000-000000000000",
      content,
      is_encrypted: content.startsWith("vault:"),
      created_at: new Date().toISOString(),
    };
    mockMessages.push(demoMessage);
    return NextResponse.json({ message: demoMessage }, { status: 201 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("room_members")
    .select("id")
    .eq("room_id", room_id)
    .eq("user_id", user.id)
    .is("removed_at", null)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Not a room member" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      room_id,
      user_id: user.id,
      content,
      is_encrypted: content.startsWith("vault:"),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: data }, { status: 201 });
}
