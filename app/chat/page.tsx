"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import ConnectWallet from "@/components/wallet-connector";
import { FeedbackButton } from "@/components/feedback-dialog";
import { cn } from "@/lib/utils";
import { handleAppError } from "@/lib/error-handler";
import {
  ArrowLeft,
  MessageSquare,
  Loader2,
  Menu,
  SendHorizontal,
  Users,
  Plus,
  Search,
  Shield,
  Lock,
} from "lucide-react";

type ChatPreview = {
  id: string;
  name: string;
  lastMessage: string;
  lastSeen: string;
  memberCount: number;
};

type ChatMessage = {
  id: string;
  author: "me" | "them";
  text: string;
  time: string;
  status: "sending" | "sent" | "delivered" | "read";
};

interface DBRoom {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  created_by: string;
  is_private: boolean;
}

interface DBMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export default function ChatPage() {
  const [query, setQuery] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<"chats" | "conversation">("conversation");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDesc, setNewRoomDesc] = useState("");

  const [currentUser, setCurrentUser] = useState<{ id: string; stellar_address?: string } | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [messagesByChat, setMessagesByChat] = useState<Record<string, ChatMessage[]>>({});

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const transformToChatMessage = useCallback(
    (message: DBMessage): ChatMessage => ({
      id: message.id,
      author: message.user_id === currentUser?.id ? "me" : "them",
      text: message.content,
      time: new Date(message.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      status: "read",
    }),
    [currentUser?.id]
  );

  const fetchRooms = useCallback(async () => {
    setIsLoadingRooms(true);
    try {
      const response = await fetch("/api/rooms");
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to fetch rooms");
      }

      const rawRooms: DBRoom[] = data.rooms || [];
      const previews: ChatPreview[] = rawRooms.map((room) => ({
        id: room.id,
        name: room.name,
        lastMessage: "No messages yet",
        lastSeen: "",
        memberCount: 0,
      }));

      setChats(previews);
      setSelectedChatId((prev) => prev || previews[0]?.id || null);
    } catch (error) {
      console.error("Failed to fetch rooms", error);
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  const fetchMessagesForRoom = useCallback(
    async (roomId: string) => {
      setIsLoadingMessages(true);
      try {
        const response = await fetch(
          `/api/messages?room_id=${encodeURIComponent(roomId)}&limit=100&offset=0`
        );
        const data = await response.json();

        if (!response.ok || data.error) {
          throw new Error(data.error || "Failed to fetch messages");
        }

        const parsed = (data.messages || []).map(transformToChatMessage);
        setMessagesByChat((prev) => ({ ...prev, [roomId]: parsed }));
      } catch (error) {
        console.error("Failed to fetch messages", error);
        setMessagesByChat((prev) => ({ ...prev, [roomId]: [] }));
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [transformToChatMessage]
  );

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (selectedChatId && !messagesByChat[selectedChatId]) {
      fetchMessagesForRoom(selectedChatId);
    }
  }, [selectedChatId, messagesByChat, fetchMessagesForRoom]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [selectedChatId, messagesByChat]);

  const handleSendMessage = useCallback(async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed || !selectedChatId) return;

    const tempId = `temp_${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      author: "me",
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
      status: "sending",
    };

    setMessagesByChat((prev) => ({
      ...prev,
      [selectedChatId]: [...(prev[selectedChatId] || []), optimistic],
    }));
    setInputMessage("");
    setIsSending(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: selectedChatId, content: trimmed }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to send message");
      }

      const saved: ChatMessage = data.message
        ? transformToChatMessage(data.message)
        : { ...optimistic, status: "sent" };

      setMessagesByChat((prev) => ({
        ...prev,
        [selectedChatId]: (prev[selectedChatId] || []).map((m) =>
          m.id === tempId ? saved : m
        ),
      }));

      setChats((prev) =>
        prev.map((c) =>
          c.id === selectedChatId
            ? { ...c, lastMessage: trimmed, lastSeen: saved.time }
            : c
        )
      );
    } catch (error) {
      handleAppError(error, "SEND_MESSAGE");
      setMessagesByChat((prev) => ({
        ...prev,
        [selectedChatId]: (prev[selectedChatId] || []).filter((m) => m.id !== tempId),
      }));
    } finally {
      setIsSending(false);
    }
  }, [inputMessage, selectedChatId, transformToChatMessage]);

  const handleCreateRoom = useCallback(async () => {
    if (!newRoomName.trim()) return;

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoomName.trim(),
          description: newRoomDesc.trim() || null,
          is_private: false,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to create room");
      }

      setChats((prev) => [
        {
          id: data.room.id,
          name: data.room.name,
          lastMessage: "No messages yet",
          lastSeen: "",
          memberCount: 1,
        },
        ...prev,
      ]);
      setSelectedChatId(data.room.id);
      setShowCreateRoom(false);
      setNewRoomName("");
      setNewRoomDesc("");
    } catch (error) {
      handleAppError(error, "UNKNOWN");
    }
  }, [newRoomName, newRoomDesc]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const filteredChats = useMemo(() => {
    if (!query.trim()) return chats;
    const lowered = query.toLowerCase();
    return chats.filter((c) => c.name.toLowerCase().includes(lowered));
  }, [chats, query]);

  const selectedChat = useMemo(
    () => chats.find((c) => c.id === selectedChatId) || null,
    [chats, selectedChatId]
  );

  const messages = selectedChat ? messagesByChat[selectedChat.id] || [] : [];
  const isMobileSidebarVisible = mobileSidebarOpen || activeMobileTab === "chats";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-24 md:pb-8 px-3 sm:px-6">
        <div className="mx-auto w-full max-w-7xl h-[min(84vh,820px)] rounded-3xl border border-border/70 bg-card/90 shadow-2xl overflow-hidden">
          <div className="h-full flex relative">
            {/* Sidebar */}
            <aside
              className={cn(
                "absolute inset-y-0 left-0 z-20 w-full border-r border-border/70 bg-card md:static md:w-[340px]",
                "transition-transform duration-300 ease-out md:translate-x-0",
                isMobileSidebarVisible ? "translate-x-0" : "-translate-x-full"
              )}
            >
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-border/70 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <h2 className="text-base font-semibold">Groups</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowCreateRoom(true)}
                        className="p-1.5 rounded-lg border hover:bg-muted transition-colors"
                        title="Create room"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <ConnectWallet />
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search groups..."
                      className="w-full rounded-xl border border-border/80 bg-background/70 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                  {isLoadingRooms && (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  )}

                  {!isLoadingRooms && filteredChats.length === 0 && (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      No groups yet. Create one to get started.
                    </div>
                  )}

                  {!isLoadingRooms &&
                    filteredChats.map((chat) => {
                      const isActive = chat.id === selectedChatId;
                      return (
                        <button
                          key={chat.id}
                          onClick={() => {
                            setSelectedChatId(chat.id);
                            setMobileSidebarOpen(false);
                            setActiveMobileTab("conversation");
                          }}
                          className={cn(
                            "w-full text-left p-3 rounded-xl transition mb-1 border border-transparent",
                            "hover:bg-muted/40",
                            isActive && "bg-primary/10 border-primary/25"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{chat.name}</p>
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {chat.lastMessage}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-[11px] text-muted-foreground">{chat.lastSeen}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            </aside>

            {mobileSidebarOpen && (
              <button
                className="md:hidden absolute inset-0 z-10 bg-black/30"
                onClick={() => setMobileSidebarOpen(false)}
              />
            )}

            {/* Chat Area */}
            <section
              className={cn(
                "flex-1 flex flex-col bg-background/30",
                activeMobileTab === "chats" && "hidden md:flex"
              )}
            >
              {!selectedChat && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Select a group</p>
                    <p className="text-sm">Or create a new one to start chatting</p>
                  </div>
                </div>
              )}

              {selectedChat && (
                <>
                  {/* Chat Header */}
                  <header className="px-4 sm:px-5 py-3 border-b border-border/70 bg-card/70 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border/80"
                          onClick={() => setMobileSidebarOpen(true)}
                        >
                          <Menu className="h-4 w-4" />
                        </button>

                        <button
                          className="hidden md:inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border/80"
                          onClick={() => setSelectedChatId(null)}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>

                        <div className="min-w-0">
                          <p className="font-semibold truncate">{selectedChat.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            E2E Encrypted
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {selectedChat.memberCount || "..."}
                        </span>
                      </div>
                    </div>
                  </header>

                  {/* Messages */}
                  <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-gradient-to-b from-background/40 to-background"
                  >
                    {isLoadingMessages && (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    )}

                    {!isLoadingMessages && messages.length === 0 && (
                      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                        No messages yet. Start the conversation.
                      </div>
                    )}

                    {!isLoadingMessages &&
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "max-w-[85%] sm:max-w-[72%] rounded-2xl px-4 py-2.5 shadow-sm text-sm",
                            message.author === "me"
                              ? "ml-auto bg-primary text-primary-foreground rounded-br-sm"
                              : "mr-auto bg-card border border-border/70 rounded-bl-sm"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words leading-relaxed">
                            {message.text}
                          </p>
                          <div
                            className={cn(
                              "mt-1 flex items-center justify-end gap-1 text-[10px]",
                              message.author === "me"
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                            )}
                          >
                            <span>{message.time}</span>
                            {message.author === "me" && (
                              <span>{message.status === "sending" ? "..." : "✓✓"}</span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-3 sm:p-4 border-t border-border/70 bg-card/80 backdrop-blur-sm">
                    <div className="flex items-end gap-2 sm:gap-3">
                      <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        placeholder="Type a message..."
                        className="flex-1 min-h-10 max-h-32 resize-none rounded-2xl border border-border/80 bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={!inputMessage.trim() || isSending}
                        className="h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <SendHorizontal className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>

        {/* Mobile Nav */}
        <nav className="md:hidden fixed inset-x-3 bottom-3 z-30 rounded-2xl border border-border/70 bg-card/95 backdrop-blur shadow-lg">
          <div className="grid grid-cols-2 gap-1 p-1.5">
            <button
              onClick={() => {
                setActiveMobileTab("chats");
                setMobileSidebarOpen(false);
              }}
              className={cn(
                "min-h-12 rounded-xl inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors",
                activeMobileTab === "chats"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/40"
              )}
            >
              <Users className="h-4 w-4" /> Groups
            </button>
            <button
              onClick={() => {
                setActiveMobileTab("conversation");
                setMobileSidebarOpen(false);
              }}
              className={cn(
                "min-h-12 rounded-xl inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors",
                activeMobileTab === "conversation"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/40"
              )}
            >
              <MessageSquare className="h-4 w-4" /> Chat
            </button>
          </div>
        </nav>
      </main>
      <Footer />

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Create Group</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <input
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="My Anonymous Group"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description (optional)</label>
                <input
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="What's this group about?"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCreateRoom(false);
                    setNewRoomName("");
                    setNewRoomDesc("");
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={!newRoomName.trim()}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <FeedbackButton />
    </div>
  );
}
