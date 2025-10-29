"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageCircle,
  Plus,
  Send,
  Download,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface Conversation {
  id: string;
  startAt: string;
  endAt?: string;
  crisisDetected: boolean;
  messageCount: number;
  lastMessage?: string;
}

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  timestamp: string;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const session = await response.json();
        setIsAuthenticated(!!session?.user);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchConversations();
    }
  }, [isAuthenticated, authLoading]);

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const startNewConversation = async () => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        const newConversation = {
          id: data.conversation.id,
          startAt: data.conversation.startAt,
          endAt: undefined,
          crisisDetected: false,
          messageCount: 0,
          lastMessage: undefined,
        };
        setConversations([newConversation, ...conversations]);
        setSelectedConversation(newConversation);
        setMessages([]);
        setIsNewConversationOpen(false);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    setSending(true);
    try {
      const response = await fetch(
        `/api/conversations/${selectedConversation.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: newMessage }),
        }
      );

      if (response.ok) {
        const updatedConversation = await response.json();
        setMessages(updatedConversation.messages || []);
        setNewMessage("");

        // Update conversation in list
        setConversations(
          conversations.map((conv) =>
            conv.id === selectedConversation.id
              ? {
                  ...conv,
                  messageCount: (conv.messageCount || 0) + 2,
                  lastMessage: newMessage,
                }
              : conv
          )
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const exportConversation = async (conversationId: string) => {
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/export`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `conversation-${conversationId}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting conversation:", error);
    }
  };

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchConversationMessages(conversation.id);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-3 h-96">
            <div className="bg-gray-200 rounded"></div>
            <div className="md:col-span-2 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-16">
          <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You need to be signed in to access AI conversations. Please sign in
            to continue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login">
              <Button>Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="outline">Create Account</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-3 h-96">
            <div className="bg-gray-200 rounded"></div>
            <div className="md:col-span-2 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Conversations</h1>
          <p className="text-muted-foreground">
            Chat with your AI mental health assistant
          </p>
        </div>
        <Dialog
          open={isNewConversationOpen}
          onOpenChange={setIsNewConversationOpen}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Conversation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start New Conversation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Begin a new conversation with your AI mental health assistant.
                All conversations are private and secure.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsNewConversationOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={startNewConversation}>
                  Start Conversation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Conversations List */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Your Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No conversations yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Start your first conversation with the AI assistant.
                  </p>
                  <Button onClick={() => setIsNewConversationOpen(true)}>
                    Start Chatting
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedConversation?.id === conversation.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => selectConversation(conversation)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {conversation.crisisDetected && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm font-medium">
                            {new Date(
                              conversation.startAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <Badge variant="outline">
                          {conversation.messageCount || 0} messages
                        </Badge>
                      </div>
                      {conversation.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.lastMessage}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="md:col-span-2">
          {selectedConversation ? (
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    {selectedConversation.crisisDetected ? (
                      <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    )}
                    Conversation
                    {selectedConversation.crisisDetected && (
                      <Badge variant="destructive" className="ml-2">
                        Crisis Detected
                      </Badge>
                    )}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportConversation(selectedConversation.id)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Started{" "}
                  {new Date(selectedConversation.startAt).toLocaleString()}
                  {selectedConversation.endAt && (
                    <>
                      {" "}
                      • Ended{" "}
                      {new Date(selectedConversation.endAt).toLocaleString()}
                    </>
                  )}
                </p>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        Start the conversation
                      </h3>
                      <p className="text-muted-foreground">
                        Send your first message to begin chatting with the AI
                        assistant.
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "USER" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            message.role === "USER"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="flex-shrink-0 flex space-x-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="flex-1"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">
                  Select a Conversation
                </h3>
                <p className="text-muted-foreground mb-4">
                  Choose a conversation from the list to start chatting, or
                  create a new one.
                </p>
                <Button onClick={() => setIsNewConversationOpen(true)}>
                  Start New Conversation
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
