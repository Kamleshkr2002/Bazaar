import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send } from "lucide-react";
import { io, Socket } from "socket.io-client";
import type { MessageWithUsers, Conversation, User } from "@shared/schema";

interface ChatMessage extends MessageWithUsers {
  fromUser: User;
  toUser: User;
}

export default function ChatInterface() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      const socketInstance = io();
      setSocket(socketInstance);
      
      socketInstance.emit('join', user.id);
      
      socketInstance.on('newMessage', (message: ChatMessage) => {
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        if (activeConversation) {
          queryClient.invalidateQueries({ 
            queryKey: ["/api/conversations", activeConversation, "messages"] 
          });
        }
      });

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [user, activeConversation, queryClient]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["/api/conversations", activeConversation, "messages"],
    enabled: !!activeConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; toUserId: string; itemId?: string }) => {
      return apiRequest("POST", "/api/messages", messageData);
    },
    onSuccess: (newMessage) => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", activeConversation, "messages"] 
      });
      
      // Emit via socket for real-time updates
      if (socket) {
        socket.emit('sendMessage', newMessage);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    const conversation = conversations.find(c => c.id === activeConversation);
    if (!conversation) return;

    const toUserId = conversation.participant1Id === user?.id 
      ? conversation.participant2Id 
      : conversation.participant1Id;

    sendMessageMutation.mutate({
      content: newMessage.trim(),
      toUserId,
      itemId: conversation.itemId || undefined,
    });
  };

  const getOtherParticipant = (conversation: Conversation) => {
    // This would need to be enhanced to include participant details
    // For now, we'll use a placeholder approach
    return conversation.participant1Id === user?.id 
      ? { id: conversation.participant2Id, firstName: "Other", lastName: "User" }
      : { id: conversation.participant1Id, firstName: "Other", lastName: "User" };
  };

  const unreadCount = conversations.length; // Simplified - would need proper unread counting

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Chat Toggle Button */}
      <Button
        className="rounded-full shadow-lg"
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MessageCircle className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 text-xs bg-red-500">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-20 right-4 w-80 h-96 shadow-2xl border-0">
          {!activeConversation ? (
            // Conversations List
            <>
              <CardHeader className="bg-primary text-white rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Messages</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-gray-200"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-80 overflow-y-auto">
                {loadingConversations ? (
                  <div className="p-4">
                    <div className="animate-pulse space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No conversations yet</p>
                    <p className="text-xs text-gray-400">Start chatting with sellers!</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {conversations.map((conversation) => {
                      const otherParticipant = getOtherParticipant(conversation);
                      return (
                        <div
                          key={conversation.id}
                          className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => setActiveConversation(conversation.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {otherParticipant.firstName[0]}{otherParticipant.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {otherParticipant.firstName} {otherParticipant.lastName}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                Click to open conversation
                              </p>
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(conversation.lastMessageAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            // Active Conversation
            <>
              <CardHeader className="bg-primary text-white rounded-t-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:text-gray-200 p-1"
                      onClick={() => setActiveConversation(null)}
                    >
                      ←
                    </Button>
                    <div>
                      <h3 className="font-semibold">Chat</h3>
                      <p className="text-xs text-blue-100">Active conversation</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-gray-200"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              {/* Messages */}
              <div className="h-64 overflow-y-auto p-4 bg-gray-50">
                {loadingMessages ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-start space-x-2">
                          <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                          <div className="bg-gray-200 rounded-lg p-2 max-w-xs">
                            <div className="h-4 bg-gray-300 rounded"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs text-gray-400">Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isFromCurrentUser = message.fromUserId === user.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex items-start ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isFromCurrentUser && (
                            <Avatar className="h-6 w-6 mr-2 mt-1">
                              <AvatarImage src={message.fromUser?.profileImageUrl} />
                              <AvatarFallback className="text-xs">
                                {message.fromUser?.firstName?.[0]}{message.fromUser?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`max-w-xs ${isFromCurrentUser ? 'order-1' : 'order-2'}`}>
                            <div className={`rounded-lg p-3 ${
                              isFromCurrentUser 
                                ? 'bg-primary text-white' 
                                : 'bg-white shadow-sm'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <p className={`text-xs text-gray-500 mt-1 ${
                              isFromCurrentUser ? 'text-right' : 'text-left'
                            }`}>
                              {new Date(message.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
