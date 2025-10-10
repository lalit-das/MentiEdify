// src/components/CallNotification.tsx

import { useState, useEffect } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface IncomingCall {
  sessionId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  bookingId: string;
}

export const CallNotification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [ringingAudio] = useState(() => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe77eeeTRAMUKfj8LZjHAY4ktjyzHksBSN2x/DdkUEKFF607OunVRQKRp/g8r5sIQUrgs/y2Yk2CBhmuOznoU0QDFCn4/C2YxwGOJLZ8s15LAUkdsfw3pFBChRete3rpVUUCkaf4O++bCEFK4PP8tmJNwgYZ7js56FNEQ1Sp+Pwtl8cBjiS2vLMeSwFJHbH8N+RQAoUXLTt66VVFApGn+DvvmwhBSuD0PLZiTcHGGi57OehTRENUqfk77ZfHAU4ktv4');
    audio.loop = true;
    return audio;
  });

  useEffect(() => {
    if (!user) {
      console.log('❌ No user logged in');
      return;
    }

    console.log('🔔 [CallNotification] Initializing for user:', user.id);

    // ✅ Use a simple channel name (like it was working before)
    const channel = supabase
      .channel('call-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_sessions',
          filter: `callee_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('📨 [CallNotification] New call_session INSERT:', payload.new);
          const callSession = payload.new;

          if (callSession.status === 'initiated') {
            console.log('📞 [CallNotification] Processing incoming call...');
            
            try {
              // Fetch booking with mentor info
              const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .select(`
                  id,
                  mentor_id,
                  mentee_id,
                  mentors!inner(
                    name,
                    profile_image_url,
                    user_id
                  )
                `)
                .eq('id', callSession.booking_id)
                .single();

              if (bookingError) {
                console.error('❌ Error fetching booking:', bookingError);
                return;
              }

              console.log('📦 Booking data:', booking);

              // Fetch mentee info
              const { data: mentee } = await supabase
                .from('users')
                .select('id, first_name, last_name, profile_image_url')
                .eq('id', booking.mentee_id)
                .single();

              // Determine who is calling
              const mentor = booking.mentors;
              const isMentorCaller = callSession.caller_id === mentor.user_id;
              
              const callerName = isMentorCaller
                ? mentor.name
                : `${mentee?.first_name || ''} ${mentee?.last_name || ''}`.trim();
              
              const callerAvatar = isMentorCaller
                ? mentor.profile_image_url
                : mentee?.profile_image_url;

              console.log('👤 Caller:', callerName);

              // Set incoming call
              setIncomingCall({
                sessionId: callSession.id,
                callerId: callSession.caller_id,
                callerName: callerName || 'Unknown Caller',
                callerAvatar,
                bookingId: callSession.booking_id,
              });

              console.log('✅ [CallNotification] Showing notification for:', callerName);

              // Play ringtone
              ringingAudio.play().catch((err) => {
                console.warn('⚠️ Could not play ringtone:', err);
              });

              // Toast notification
              toast({
                title: '📞 Incoming Call',
                description: `${callerName} is calling you`,
              });

              // Browser notification
              if ('Notification' in window) {
                if (Notification.permission === 'granted') {
                  new Notification('Incoming Call', {
                    body: `${callerName} is calling you`,
                    icon: callerAvatar || '/favicon.ico',
                    tag: callSession.id,
                  });
                } else if (Notification.permission === 'default') {
                  Notification.requestPermission();
                }
              }
            } catch (error) {
              console.error('❌ Error processing call:', error);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_sessions',
          filter: `callee_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('📝 Call session updated:', payload.new.status);
          
          if (payload.new.status === 'ended' || payload.new.status === 'cancelled') {
            console.log('📵 Call ended, clearing notification');
            setIncomingCall(null);
            ringingAudio.pause();
            ringingAudio.currentTime = 0;
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [CallNotification] Channel status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ [CallNotification] Successfully subscribed to call notifications');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [CallNotification] Channel error - Realtime might be disabled');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ [CallNotification] Channel timed out');
        } else if (status === 'CLOSED') {
          console.log('🔒 [CallNotification] Channel closed');
        }
      });

    return () => {
      console.log('🧹 [CallNotification] Cleaning up');
      supabase.removeChannel(channel);
      ringingAudio.pause();
      ringingAudio.currentTime = 0;
    };
  }, [user, toast, ringingAudio]);

  const handleAnswer = async () => {
    console.log('✅ [CallNotification] Answering call:', incomingCall?.sessionId);
    ringingAudio.pause();
    ringingAudio.currentTime = 0;

    if (incomingCall) {
      try {
        await supabase
          .from('call_sessions')
          .update({ status: 'ringing' })
          .eq('id', incomingCall.sessionId);

        console.log('📞 Navigating to call page...');
        window.location.href = `/call/${incomingCall.sessionId}?initiator=false`;
      } catch (error) {
        console.error('❌ Error answering:', error);
        window.location.href = `/call/${incomingCall.sessionId}?initiator=false`;
      }
    }
  };

  const handleReject = async () => {
    console.log('❌ [CallNotification] Rejecting call:', incomingCall?.sessionId);
    ringingAudio.pause();
    ringingAudio.currentTime = 0;

    if (incomingCall) {
      try {
        await supabase
          .from('call_sessions')
          .update({ 
            status: 'ended', 
            ended_at: new Date().toISOString() 
          })
          .eq('id', incomingCall.sessionId);

        toast({
          title: 'Call Declined',
          description: 'You declined the incoming call',
        });
      } catch (error) {
        console.error('❌ Error rejecting:', error);
      }
    }

    setIncomingCall(null);
  };

  // Auto-timeout
  useEffect(() => {
    if (incomingCall) {
      console.log('⏰ Starting 60-second timeout for call');
      const timeout = setTimeout(() => {
        console.log('⏰ Call timeout reached - auto-rejecting');
        handleReject();
        toast({
          title: 'Missed Call',
          description: `You missed a call from ${incomingCall.callerName}`,
          variant: 'destructive',
        });
      }, 60000);

      return () => {
        console.log('⏰ Clearing timeout');
        clearTimeout(timeout);
      };
    }
  }, [incomingCall]);

  if (!incomingCall) {
    return null;
  }

  console.log('🎨 [CallNotification] Rendering notification UI');

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-primary shadow-lg">
                <AvatarImage src={incomingCall.callerAvatar} />
                <AvatarFallback className="text-2xl bg-primary/20">
                  {incomingCall.callerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 animate-pulse">
                <Video className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{incomingCall.callerName}</CardTitle>
          <p className="text-muted-foreground animate-pulse">Incoming video call...</p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 justify-center">
            <Button
              size="lg"
              variant="destructive"
              className="rounded-full h-16 w-16 shadow-lg hover:scale-110 transition-transform"
              onClick={handleReject}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button
              size="lg"
              className="rounded-full h-16 w-16 bg-green-500 hover:bg-green-600 shadow-lg animate-bounce hover:scale-110 transition-transform"
              onClick={handleAnswer}
            >
              <Phone className="h-6 w-6" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
