import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseWebRTCProps {
  sessionId: string;
  isInitiator: boolean;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: string) => void;
}

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  connectionState: string;
  startCall: () => Promise<void>;
  endCall: () => void;
  toggleAudio: (enabled: boolean) => void;
  toggleVideo: (enabled: boolean) => void;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const useWebRTC = ({
  sessionId,
  isInitiator,
  onRemoteStream,
  onConnectionStateChange,
}: UseWebRTCProps): UseWebRTCReturn => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<string>('new');

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const signalingChannelRef = useRef<any>(null);
  const hasStartedRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  // Create mock stream for testing
  const createMockStream = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    let frame = 0;
    const animate = () => {
      if (ctx) {
        // Create animated gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, `hsl(${frame % 360}, 70%, 50%)`);
        gradient.addColorStop(1, `hsl(${(frame + 120) % 360}, 70%, 30%)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText('🎥 TEST CAMERA', canvas.width / 2, canvas.height / 2 - 40);
        
        ctx.font = '32px Arial';
        ctx.fillText(isInitiator ? 'INITIATOR' : 'RECEIVER', canvas.width / 2, canvas.height / 2 + 20);
        
        ctx.font = '24px Arial';
        ctx.fillText(`Session: ${sessionId.substring(0, 8)}...`, canvas.width / 2, canvas.height / 2 + 60);
        
        frame++;
      }
      requestAnimationFrame(animate);
    };
    animate();
    
    // @ts-ignore - captureStream is supported but not in types
    const videoStream = canvas.captureStream(30);
    
    // Create silent audio track
    const audioContext = new AudioContext();
    const dest = audioContext.createMediaStreamDestination();
    
    const mockStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...dest.stream.getAudioTracks()
    ]);
    
    console.log('✅ Created mock stream for', isInitiator ? 'INITIATOR' : 'RECEIVER');
    return mockStream;
  }, [isInitiator, sessionId]);

  // Get local stream - Try real camera first, fall back to mock
  const getLocalStream = useCallback(async () => {
    try {
      console.log('📹 Requesting camera access...');
      
      // Try to get real camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('✅ Got real camera stream');
      setLocalStream(stream);
      setError(null);
      return stream;
    } catch (err: any) {
      console.warn('⚠️ Real camera not available, using mock stream:', err.message);
      
      // Use mock stream as fallback
      const mockStream = createMockStream();
      setLocalStream(mockStream);
      setError(null);
      return mockStream;
    }
  }, [createMockStream]);

  // Send signal via Supabase Realtime
  const sendSignal = useCallback((data: any) => {
    if (!signalingChannelRef.current) {
      console.error('❌ No signaling channel available');
      return;
    }
    
    const message = {
      ...data,
      sender: isInitiator ? 'initiator' : 'receiver',
      timestamp: Date.now()
    };
    
    try {
      signalingChannelRef.current.send({
        type: 'broadcast',
        event: 'webrtc-signal',
        payload: message
      });
      console.log('📤 Sent signal via Supabase:', data.type);
    } catch (err) {
      console.error('❌ Failed to send signal:', err);
    }
  }, [isInitiator]);

  // Setup Supabase Realtime signaling
  useEffect(() => {
    try {
      const channel = supabase.channel(`webrtc-${sessionId}`, {
        config: {
          broadcast: { self: false }
        }
      });
      
      signalingChannelRef.current = channel;
      console.log('📡 Supabase channel created for session:', sessionId);
      
      channel.subscribe((status) => {
        console.log('📡 Signaling channel status:', status);
      });

      return () => {
        console.log('🧹 Closing Supabase channel');
        try {
          supabase.removeChannel(channel);
        } catch (err) {
          console.error('Error removing channel:', err);
        }
        signalingChannelRef.current = null;
      };
    } catch (err) {
      console.error('❌ Failed to setup signaling channel:', err);
      setError('Failed to setup signaling channel');
    }
  }, [sessionId]);

  // Create peer connection
  const createPeerConnection = useCallback((stream: MediaStream) => {
    if (peerConnectionRef.current) {
      console.log('⚠️ Peer connection already exists');
      return peerConnectionRef.current;
    }

    console.log('🔗 Creating peer connection');
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    stream.getTracks().forEach((track) => {
      console.log('➕ Adding local track:', track.kind);
      pc.addTrack(track, stream);
    });

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log('📹 Received remote track:', event.track.kind);
      const remoteStream = event.streams[0];
      setRemoteStream(remoteStream);
      onRemoteStream?.(remoteStream);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Sending ICE candidate');
        sendSignal({
          type: 'ice-candidate',
          candidate: event.candidate.toJSON()
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log('🔌 Connection state:', state);
      setConnectionState(state);

      if (state === 'connected') {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        retryCountRef.current = 0;
        console.log('✅ WebRTC connection established successfully!');
        onConnectionStateChange?.('connected');
      } else if (state === 'disconnected') {
        setIsConnected(false);
        console.log('⚠️ Connection disconnected, may reconnect automatically');
        onConnectionStateChange?.(state);
      } else if (state === 'failed') {
        setIsConnected(false);
        setIsConnecting(false);
        console.error('❌ Connection failed!');

        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          console.log(`🔄 Retry attempt ${retryCountRef.current}/${MAX_RETRIES}`);
          setError(`Connection failed. Retrying (${retryCountRef.current}/${MAX_RETRIES})...`);

          retryTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            handleRetryConnection();
          }, 2000 * retryCountRef.current);
        } else {
          setError('Connection failed after multiple attempts. Please try again.');
        }
        onConnectionStateChange?.(state);
      } else if (state === 'connecting') {
        setIsConnecting(true);
      }
    };

    // Handle ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE state:', pc.iceConnectionState);
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [sendSignal, onRemoteStream, onConnectionStateChange]);

  // Handle retry connection
  const handleRetryConnection = useCallback(async () => {
    console.log('🔄 Retrying connection...');

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    hasStartedRef.current = false;

    try {
      const stream = localStream || await getLocalStream();
      const pc = createPeerConnection(stream);

      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal({ type: 'offer', offer });
      }
    } catch (err) {
      console.error('❌ Retry failed:', err);
    }
  }, [localStream, getLocalStream, createPeerConnection, isInitiator, sendSignal]);

  // Listen for signals via Supabase
  useEffect(() => {
    const channel = signalingChannelRef.current;
    if (!channel) return;
    
    const handleSignal = async ({ payload }: any) => {
      const senderType = isInitiator ? 'receiver' : 'initiator';
      
      // Ignore own messages
      if (payload.sender !== senderType) return;
      
      console.log('📨 Received signal via Supabase:', payload.type);
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.warn('⚠️ No peer connection when receiving signal');
        return;
      }

      try {
        if (payload.type === 'offer') {
          console.log('📨 Processing offer');
          await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal({ type: 'answer', answer });
          console.log('✅ Answer sent');
          
        } else if (payload.type === 'answer') {
          console.log('📨 Processing answer');
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
          console.log('✅ Answer set');
          
        } else if (payload.type === 'ice-candidate') {
          console.log('📨 Adding ICE candidate');
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      } catch (err) {
        console.error('❌ Signal handling error:', err);
        setError('Failed to process signaling data');
      }
    };

    channel.on('broadcast', { event: 'webrtc-signal' }, handleSignal);
    
    return () => {
      try {
        channel.off('broadcast', handleSignal);
      } catch (err) {
        console.error('Error removing event listener:', err);
      }
    };
  }, [isInitiator, sendSignal]);

  // Start call
  const startCall = useCallback(async () => {
    if (hasStartedRef.current) {
      console.log('⚠️ Call already started');
      return;
    }
    hasStartedRef.current = true;

    console.log('🚀 Starting call, role:', isInitiator ? 'INITIATOR' : 'RECEIVER');
    setIsConnecting(true);
    setError(null);
    retryCountRef.current = 0;

    try {
      const stream = await getLocalStream();
      const pc = createPeerConnection(stream);

      // Wait for signaling channel to be ready
      console.log('⏳ Waiting for signaling channel...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (isInitiator) {
        console.log('👋 INITIATOR: Creating and sending offer');
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await pc.setLocalDescription(offer);
        sendSignal({ type: 'offer', offer });
        console.log('✅ Offer sent, waiting for answer...');
      } else {
        console.log('👂 RECEIVER: Waiting for offer from initiator...');
      }

      console.log('✅ Call setup completed, waiting for connection...');
    } catch (err: any) {
      console.error('❌ Start call failed:', err);
      setError(err.message || 'Failed to start call');
      setIsConnecting(false);
      hasStartedRef.current = false;
    }
  }, [getLocalStream, createPeerConnection, isInitiator, sendSignal]);

  // End call
  const endCall = useCallback(() => {
    console.log('☎️ Ending call');

    try {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      localStream?.getTracks().forEach((track) => {
        track.stop();
        console.log('🛑 Stopped track:', track.kind);
      });

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      setLocalStream(null);
      setRemoteStream(null);
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionState('closed');
      hasStartedRef.current = false;
      retryCountRef.current = 0;

      console.log('✅ Call ended');
    } catch (err) {
      console.error('Error ending call:', err);
    }
  }, [localStream]);

  // Toggle audio
  const toggleAudio = useCallback((enabled: boolean) => {
    try {
      localStream?.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
        console.log(`🎤 Audio ${enabled ? 'enabled' : 'disabled'}`);
      });
    } catch (err) {
      console.error('Error toggling audio:', err);
    }
  }, [localStream]);

  // Toggle video
  const toggleVideo = useCallback((enabled: boolean) => {
    try {
      localStream?.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
        console.log(`📹 Video ${enabled ? 'enabled' : 'disabled'}`);
      });
    } catch (err) {
      console.error('Error toggling video:', err);
    }
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    localStream,
    remoteStream,
    isConnecting,
    isConnected,
    error,
    connectionState,
    startCall,
    endCall,
    toggleAudio,
    toggleVideo,
  };
};
