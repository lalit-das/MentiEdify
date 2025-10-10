import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Settings, MoveVertical as MoreVertical, Clock, Users, Loader as Loader2, X, Wifi, WifiOff, Signal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  isMe: boolean;
}

const CallPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [callSession, setCallSession] = useState<any>(null);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [otherParticipant, setOtherParticipant] = useState<any>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [isInitiator, setIsInitiator] = useState<boolean>(false);
  const [otherParticipantJoined, setOtherParticipantJoined] = useState<boolean>(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatChannelRef = useRef<any>(null);
  const callStartedRef = useRef(false);
  const presenceChannelRef = useRef<any>(null);

  // WebRTC hook
  const {
    localStream,
    remoteStream,
    isConnecting,
    isConnected,
    error: webrtcError,
    connectionState,
    startCall: startWebRTCCall,
    endCall: endWebRTCCall,
    toggleAudio: toggleWebRTCAudio,
    toggleVideo: toggleWebRTCVideo,
  } = useWebRTC({
    sessionId: sessionId || 'default',
    isInitiator,
    onRemoteStream: (stream) => {
      console.log('📺 Remote stream received');
    },
    onConnectionStateChange: (state) => {
      console.log('🔌 Connection state changed:', state);
      if (state === 'connected') {
        updateCallSessionStatus('connected');
        toast({
          title: "Connected",
          description: "Call connected successfully",
        });
      } else if (state === 'disconnected' || state === 'failed') {
        if (state === 'failed') {
          toast({
            title: "Connection Failed",
            description: "Failed to establish connection. Retrying...",
            variant: "destructive",
          });
        }
        updateCallSessionStatus('failed');
      }
    }
  });

  useEffect(() => {
    if (!sessionId || !user) {
      toast({
        title: "Invalid Session",
        description: "No session ID or user not authenticated",
        variant: "destructive",
      });
      navigate('/mentee-dashboard');
      return;
    }
    fetchSessionData();
  }, [sessionId, user]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);

      // Fetch current user details
      const { data: currentUser, error: currentUserError } = await supabase
        .from('users')
        .select('first_name, last_name, user_type')
        .eq('id', user?.id)
        .single();

      if (currentUserError) throw currentUserError;

      const currentUserFullName = `${currentUser.first_name} ${currentUser.last_name}`;
      setCurrentUserName(currentUserFullName);
      console.log('👤 Current user:', currentUserFullName, `(${currentUser.user_type})`);

      // ✅ FIXED: Fetch call session with BOTH mentor and mentee details
      const { data: sessionData, error: sessionError } = await supabase
        .from('call_sessions')
        .select(`
          *,
          bookings!inner (
            id,
            mentor_id,
            mentee_id,
            mentors!bookings_mentor_id_fkey (
              id,
              name,
              title,
              profile_image_url,
              user_id
            )
          )
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      if (!sessionData) {
        toast({
          title: "Session Not Found",
          description: "The call session doesn't exist",
          variant: "destructive",
        });
        navigate('/mentee-dashboard');
        return;
      }

      console.log('📦 Session data:', sessionData);

      // Validate user is part of this session
      if (sessionData.caller_id !== user?.id && sessionData.callee_id !== user?.id) {
        toast({
          title: "Unauthorized",
          description: "You are not authorized to join this call",
          variant: "destructive",
        });
        navigate('/mentee-dashboard');
        return;
      }

      setCallSession(sessionData);
      setBooking(sessionData.bookings);

      // Determine if current user is the initiator
      const userIsInitiator = sessionData.caller_id === user?.id;
      setIsInitiator(userIsInitiator);
      console.log('🎯 User role:', userIsInitiator ? 'INITIATOR (Caller)' : 'RECEIVER (Callee)');

      // ✅ CRITICAL FIX: Identify if current user is mentor or mentee
      const booking = sessionData.bookings;
      const mentor = booking.mentors;
      const isMentor = mentor.user_id === user?.id;

      console.log('🔍 Mentor user_id:', mentor.user_id);
      console.log('🔍 Current user_id:', user?.id);
      console.log('🔍 Is current user mentor?', isMentor);

      if (isMentor) {
        // Current user is MENTOR - show MENTEE info
        const menteeId = booking.mentee_id;
        
        const { data: menteeData, error: menteeError } = await supabase
          .from('users')
          .select('id, first_name, last_name, profile_image_url')
          .eq('id', menteeId)
          .single();

        if (menteeError) throw menteeError;

        setOtherParticipant({
          name: `${menteeData.first_name} ${menteeData.last_name}`,
          title: 'Mentee',
          avatar: menteeData.profile_image_url || "/placeholder.svg"
        });

        console.log('👥 Other participant (Mentee):', `${menteeData.first_name} ${menteeData.last_name}`);
      } else {
        // Current user is MENTEE - show MENTOR info
        setOtherParticipant({
          name: mentor.name,
          title: mentor.title || 'Mentor',
          avatar: mentor.profile_image_url || "/placeholder.svg"
        });

        console.log('👥 Other participant (Mentor):', mentor.name);
      }

      // Setup chat channel
      setupChatChannel();

      // Setup presence channel
      setupPresenceChannel();

    } catch (error) {
      console.error('❌ Error fetching session data:', error);
      toast({
        title: "Error",
        description: "Failed to load session data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupPresenceChannel = () => {
    const presenceChannel = supabase.channel(`presence-${sessionId}`, {
      config: {
        presence: {
          key: user?.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const participants = Object.keys(state);
        console.log('👥 Participants in call:', participants.length);

        if (participants.length >= 2) {
          setOtherParticipantJoined(true);
          console.log('✅ Other participant has joined!');
        }
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        console.log('👋 Participant joined:', key);
        if (key !== user?.id) {
          setOtherParticipantJoined(true);
          toast({
            title: "Participant Joined",
            description: `${otherParticipant?.name || 'Other participant'} has joined the call`,
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log('👋 Participant left:', key);
        if (key !== user?.id) {
          setOtherParticipantJoined(false);
          toast({
            title: "Participant Left",
            description: `${otherParticipant?.name || 'Other participant'} has left the call`,
            variant: "destructive",
          });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user?.id,
            online_at: new Date().toISOString(),
          });
          console.log('📡 Presence channel subscribed');
        }
      });

    presenceChannelRef.current = presenceChannel;
  };

  const setupChatChannel = () => {
    const channel = supabase.channel(`chat-${sessionId}`, {
      config: {
        broadcast: { self: false }
      }
    });

    channel
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        const newMessage: ChatMessage = {
          id: payload.id,
          sender: payload.senderName,
          message: payload.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: false
        };
        setChatMessages(prev => [...prev, newMessage]);
      })
      .subscribe();

    chatChannelRef.current = channel;
  };

  const updateCallSessionStatus = async (status: string) => {
    try {
      const updates: any = { status };

      if (status === 'connected' && !callSession?.started_at) {
        updates.started_at = new Date().toISOString();
      } else if (status === 'ended' || status === 'failed') {
        updates.ended_at = new Date().toISOString();
        
        if (callSession?.started_at) {
          const duration = Math.floor(
            (new Date().getTime() - new Date(callSession.started_at).getTime()) / 1000
          );
          updates.duration_seconds = duration;
        }

        if (callSession?.booking_id) {
          await supabase
            .from('bookings')
            .update({ status: 'completed' })
            .eq('id', callSession.booking_id);
        }
      }

      await supabase
        .from('call_sessions')
        .update(updates)
        .eq('id', sessionId);

      setCallSession((prev: any) => ({ ...prev, ...updates }));

    } catch (error) {
      console.error('Error updating call session:', error);
    }
  };

  useEffect(() => {
    if (!loading && callSession && !callStartedRef.current && isInitiator !== undefined) {
      callStartedRef.current = true;
      console.log('🚀 Auto-starting call...');
      startCall();
    }
  }, [loading, callSession, isInitiator]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected]);

  useEffect(() => {
    if (webrtcError) {
      toast({
        title: "Call Error",
        description: webrtcError,
        variant: "destructive",
      });
    }
  }, [webrtcError, toast]);

  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting, cleaning up channels...');
      if (chatChannelRef.current) {
        try {
          supabase.removeChannel(chatChannelRef.current);
        } catch (err) {
          console.error('Error removing chat channel:', err);
        }
      }
      if (presenceChannelRef.current) {
        try {
          supabase.removeChannel(presenceChannelRef.current);
        } catch (err) {
          console.error('Error removing presence channel:', err);
        }
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    toggleWebRTCAudio(newState);
  };

  const toggleVideo = () => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    toggleWebRTCVideo(newState);
  };

  const startCall = async () => {
    try {
      await startWebRTCCall();
      toast({
        title: "Joining Call",
        description: "Connecting to the session...",
      });
    } catch (err) {
      console.error('Failed to start call:', err);
      toast({
        title: "Failed to Start Call",
        description: "Please check your camera and microphone permissions",
        variant: "destructive",
      });
    }
  };

  const endCall = async () => {
    console.log('📞 Ending call...');
    
    await updateCallSessionStatus('ended');
    endWebRTCCall();
    
    if (chatChannelRef.current) {
      try {
        await supabase.removeChannel(chatChannelRef.current);
        console.log('✅ Chat channel removed');
      } catch (err) {
        console.error('❌ Error removing chat channel:', err);
      }
    }
    if (presenceChannelRef.current) {
      try {
        await supabase.removeChannel(presenceChannelRef.current);
        console.log('✅ Presence channel removed');
      } catch (err) {
        console.error('❌ Error removing presence channel:', err);
      }
    }
    
    toast({
      title: "Call Ended",
      description: "Redirecting to your dashboard...",
    });

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user?.id)
        .single();

      if (userError) throw userError;

      const redirectPath = userData?.user_type === 'mentor' 
        ? '/mentor-dashboard' 
        : '/mentee-dashboard';
      
      console.log('🎯 Redirecting to:', redirectPath);

      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 2000);

    } catch (error) {
      console.error('❌ Error in redirect logic:', error);
      setTimeout(() => {
        navigate('/mentee-dashboard', { replace: true });
      }, 2000);
    }
  };

  const sendMessage = () => {
    if (chatMessage.trim() && chatChannelRef.current && currentUserName) {
      const messageId = Date.now().toString();
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const newMessage: ChatMessage = {
        id: messageId,
        sender: "You",
        message: chatMessage.trim(),
        timestamp,
        isMe: true
      };

      setChatMessages(prev => [...prev, newMessage]);

      chatChannelRef.current.send({
        type: 'broadcast',
        event: 'message',
        payload: {
          id: messageId,
          senderName: currentUserName,
          message: chatMessage.trim(),
          timestamp
        }
      });

      setChatMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium">Loading call session...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Badge variant="default" className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              {formatDuration(callDuration)}
            </Badge>
            <Badge
              variant={isConnected ? "default" : isConnecting ? "secondary" : "outline"}
              className="flex items-center gap-2"
            >
              <Users className="h-3 w-3" />
              {isConnected
                ? 'Connected'
                : isConnecting
                  ? 'Connecting...'
                  : otherParticipantJoined
                    ? 'Both Joined'
                    : 'Waiting for other participant'}
            </Badge>
            {isConnected && (
              <Badge variant="outline" className="flex items-center gap-2">
                {connectionState === 'connected' ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">Good</span>
                  </>
                ) : connectionState === 'connecting' ? (
                  <>
                    <Signal className="h-3 w-3 text-yellow-500 animate-pulse" />
                    <span className="text-yellow-500">Connecting</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">Poor</span>
                  </>
                )}
              </Badge>
            )}
          </div>
          <Button variant="destructive" onClick={endCall}>
            <PhoneOff className="h-4 w-4 mr-2" />
            End Call
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Remote Video */}
            <Card className="relative aspect-video bg-slate-800 overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              {connectionState === 'disconnected' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-10">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 text-white animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg font-medium">Reconnecting...</p>
                    <p className="text-slate-300 text-sm">Please wait while we restore the connection</p>
                  </div>
                </div>
              )}
              
              {!remoteStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800">
                  <div className="text-center space-y-6 px-8">
                    <div className="relative">
                      <img
                        src={otherParticipant?.avatar || "/placeholder.svg"}
                        alt={otherParticipant?.name || "Participant"}
                        className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white/20 shadow-2xl"
                      />
                      {otherParticipantJoined && (
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-green-500 text-white border-2 border-white shadow-lg animate-pulse">
                            <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                            Online
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div>
                      <h2 className="text-white text-3xl font-bold mb-2">
                        {otherParticipant?.name || 'Participant'}
                      </h2>
                      {otherParticipant?.title && (
                        <p className="text-slate-300 text-lg mb-4">{otherParticipant.title}</p>
                      )}
                      
                      <div className="space-y-3 mt-6">
                        {!otherParticipantJoined ? (
                          <>
                            <div className="flex items-center justify-center gap-2 text-yellow-400">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                              <span className="text-base font-medium">Waiting to join...</span>
                            </div>
                            <p className="text-sm text-slate-400">
                              They will appear here once they join the call
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-center gap-2 text-green-400">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              <span className="text-base font-medium">Establishing video connection...</span>
                            </div>
                            <p className="text-sm text-slate-400">
                              Video will appear shortly
                            </p>
                            <div className="flex items-center justify-center gap-2 mt-4">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {remoteStream && (
                <div className="absolute bottom-4 left-4">
                  <Badge className="bg-black/70 text-white backdrop-blur-sm px-4 py-2 text-base border border-white/20">
                    <Users className="h-4 w-4 mr-2 inline" />
                    {otherParticipant?.name || 'Participant'}
                  </Badge>
                </div>
              )}
            </Card>

            {/* Local Video */}
            <Card className="relative w-64 aspect-video bg-slate-800 overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
              <Badge className="absolute top-2 left-2">You</Badge>
              <Badge className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm">
                {currentUserName}
              </Badge>
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                  <VideoOff className="h-8 w-8 text-slate-400" />
                </div>
              )}
            </Card>

            {/* Call Controls */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant={isAudioEnabled ? "default" : "destructive"}
                    size="lg"
                    className="rounded-full h-14 w-14"
                    onClick={toggleAudio}
                  >
                    {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant={isVideoEnabled ? "default" : "destructive"}
                    size="lg"
                    className="rounded-full h-14 w-14"
                    onClick={toggleVideo}
                  >
                    {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full h-14 w-14"
                    onClick={() => setShowChat(!showChat)}
                  >
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full h-14 w-14"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full h-14 w-14"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {otherParticipant && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Participant</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <img
                      src={otherParticipant.avatar}
                      alt={otherParticipant.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium">{otherParticipant.name}</p>
                      <p className="text-sm text-muted-foreground">{otherParticipant.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {showChat && (
              <Card className="flex flex-col h-[500px]">
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-lg">Chat</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChat(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <Separator />
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.isMe
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm font-medium mb-1">{msg.sender}</p>
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">{msg.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Separator />
                <div className="p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                    <Button onClick={sendMessage}>Send</Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default CallPage;
