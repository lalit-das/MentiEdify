import { useState, useEffect } from "react";
import { Search, Send, Phone, Video, MoreVertical, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const MessagesPage = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
      setupRealtimeSubscription();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      // Get conversations where user is either mentor or mentee
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          mentor_id,
          mentee_id
        `)
        .or(`mentor_id.eq.${user?.id},mentee_id.eq.${user?.id}`)
        .eq('status', 'confirmed');

      if (bookingsError) throw bookingsError;

      // Transform bookings into conversations
      const conversationsMap = new Map();
      
      bookingsData?.forEach(booking => {
        const conversationId = `${booking.mentor_id}-${booking.mentee_id}`;
        
        if (!conversationsMap.has(conversationId)) {
          conversationsMap.set(conversationId, {
            id: conversationId,
            booking_id: booking.id,
            name: "Conversation Partner",
            title: booking.mentor_id === user?.id ? 'Mentee' : 'Mentor',
            lastMessage: "",
            timestamp: "",
            unread: 0,
            online: false,
            avatar: "/placeholder.svg",
            mentor_id: booking.mentor_id,
            mentee_id: booking.mentee_id
          });
        }
      });

      setConversations(Array.from(conversationsMap.values()));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const [mentorId, menteeId] = conversationId.split('-');
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${user?.id === mentorId ? menteeId : mentorId}),and(sender_id.eq.${user?.id === mentorId ? menteeId : mentorId},recipient_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages = data?.map(message => ({
        id: message.id,
        sender: message.sender_id === user?.id ? 'You' : 'Contact',
        content: message.content,
        timestamp: new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: message.sender_id === user?.id
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id.eq.${user?.id}`
      }, (payload) => {
        // Refresh messages if the new message is for the current conversation
        if (selectedConversation) {
          fetchMessages(selectedConversation);
        }
        // Refresh conversations to update last message
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      setSendingMessage(true);
      const [mentorId, menteeId] = selectedConversation.split('-');
      const recipientId = user.id === mentorId ? menteeId : mentorId;

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage("");
      fetchMessages(selectedConversation);
      fetchConversations(); // Update last message in conversations
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  
  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please log in to view messages</h1>
            <p className="text-muted-foreground">You need to be logged in to access your conversations.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Messages</h1>
          <p className="text-muted-foreground">Communicate with your mentors and mentees</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        ) : conversations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
              <p className="text-muted-foreground mb-4">
                Book a session with a mentor to start your first conversation!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
            {/* Conversations List */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Conversations</CardTitle>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer border-b hover:bg-accent transition-colors ${
                        selectedConversation === conversation.id ? "bg-accent" : ""
                      }`}
                      onClick={() => setSelectedConversation(conversation.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <img
                            src={conversation.avatar}
                            alt={conversation.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          {conversation.online && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm truncate">{conversation.name}</h4>
                            {conversation.unread > 0 && (
                              <Badge variant="default" className="text-xs">
                                {conversation.unread}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{conversation.title}</p>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {conversation.lastMessage}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{conversation.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="lg:col-span-3 flex flex-col">
              {selectedConv ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="lg:hidden"
                          onClick={() => setSelectedConversation(null)}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="relative">
                          <img
                            src={selectedConv.avatar}
                            alt={selectedConv.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          {selectedConv.online && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{selectedConv.name}</h3>
                          <p className="text-sm text-muted-foreground">{selectedConv.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <Separator />

                  {/* Messages */}
                  <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-[400px] p-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] p-3 rounded-lg ${
                                message.isMe
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  message.isMe
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {message.timestamp}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>

                  {/* Message Input */}
                  <Separator />
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && !sendingMessage && handleSendMessage()}
                        className="flex-1"
                        disabled={sendingMessage}
                      />
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={!newMessage.trim() || sendingMessage}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">Select a Conversation</h3>
                    <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MessagesPage;