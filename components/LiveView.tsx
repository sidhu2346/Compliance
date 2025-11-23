import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ai } from '../services/geminiService';
import { createPcmBlob, base64ToBytes, decodeAudioData } from '../utils/audioUtils';
import { Modality, LiveServerMessage } from '@google/genai';
import { MODEL_LIVE } from '../constants';

const LiveView: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [volume, setVolume] = useState(0);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Clean up audio context
  const cleanupAudio = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    if (outputContextRef.current) {
      outputContextRef.current.close();
      outputContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const connect = async () => {
    try {
      setStatus('connecting');
      
      // Setup Audio Contexts
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const outputNode = outputContextRef.current.createGain();
      outputNode.connect(outputContextRef.current.destination);

      // Initialize Gemini Live Session
      const sessionPromise = ai.live.connect({
        model: MODEL_LIVE,
        callbacks: {
          onopen: () => {
            console.log("Live session opened");
            setIsConnected(true);
            setStatus('connected');
            
            // Start Microphone Stream
            if (inputContextRef.current) {
              const source = inputContextRef.current.createMediaStreamSource(stream);
              sourceRef.current = source;
              
              const scriptProcessor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
              processorRef.current = scriptProcessor;
              
              scriptProcessor.onaudioprocess = (e) => {
                if (!isMicOn) return;
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Visualization Data
                let sum = 0;
                for(let i = 0; i < inputData.length; i++) sum += Math.abs(inputData[i]);
                setVolume(Math.min(100, (sum / inputData.length) * 500));

                const pcmBlob = createPcmBlob(inputData);
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputContextRef.current.destination);
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputContextRef.current) {
              const ctx = outputContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                base64ToBytes(base64Audio),
                ctx,
                24000,
                1
              );
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
            }
          },
          onclose: () => {
            console.log("Session closed");
            setIsConnected(false);
            setStatus('idle');
          },
          onerror: (err) => {
            console.error("Session error", err);
            setStatus('error');
            setIsConnected(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (e) {
      console.error(e);
      setStatus('error');
      cleanupAudio();
    }
  };

  const disconnect = () => {
    if (sessionRef.current) {
        // Since we can't easily call close on the promise result synchronously here without tracking,
        // we rely on browser cleanup mostly, but in a real app we'd await the promise and call close.
        // For now, reload or simple state reset is safer for the demo to prevent complexity.
        window.location.reload(); 
    }
    cleanupAudio();
    setIsConnected(false);
    setStatus('idle');
  };

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
  };

  // Simple Visualizer
  useEffect(() => {
    if (!isConnected) return;
    
    // Just a dummy visualizer loop since real data is in the audio callback
    // We use the `volume` state for height
  }, [isConnected]);

  return (
    <div className="flex flex-col h-full bg-slate-950 items-center justify-center relative p-6">
       {/* Background Pulse */}
       <div className={`absolute w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] transition-all duration-300 ${isConnected ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}></div>

       {/* Status Indicator */}
       <div className="z-10 mb-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Gemini Live</h2>
          <p className="text-slate-400">Real-time voice conversation</p>
          <div className={`mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
            status === 'connected' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
            status === 'connecting' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
            status === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
            'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${
              status === 'connected' ? 'bg-green-400 animate-pulse' :
              status === 'connecting' ? 'bg-yellow-400 animate-bounce' :
              status === 'error' ? 'bg-red-400' :
              'bg-slate-500'
            }`}></span>
            {status.toUpperCase()}
          </div>
       </div>

       {/* Visualizer Circle */}
       <div className="relative z-10 w-64 h-64 flex items-center justify-center">
          {/* Outer ring */}
          <div className={`absolute inset-0 border-2 border-slate-700 rounded-full ${isConnected ? 'animate-[spin_10s_linear_infinite]' : ''} border-dashed`}></div>
          
          {/* Inner Audio Reactive Blob */}
          <div 
            className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full transition-all duration-75 shadow-[0_0_40px_rgba(59,130,246,0.5)]"
            style={{
              transform: `scale(${1 + (volume / 50)})`,
              filter: `brightness(${1 + (volume / 100)})`
            }}
          ></div>
       </div>

       {/* Controls */}
       <div className="z-10 mt-12 flex gap-6">
         {!isConnected ? (
           <button 
            onClick={connect}
            disabled={status === 'connecting'}
            className="group relative flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
           >
             <i className="fa-solid fa-bolt text-blue-600"></i>
             Start Conversation
             <div className="absolute inset-0 rounded-full ring-2 ring-white/50 animate-pulse-slow"></div>
           </button>
         ) : (
           <>
            <button 
              onClick={toggleMic}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-xl transition-all border ${
                isMicOn 
                ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700' 
                : 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30'
              }`}
            >
              <i className={`fa-solid ${isMicOn ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
            </button>
            <button 
              onClick={disconnect}
              className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center text-xl hover:bg-red-700 transition-all shadow-lg hover:shadow-red-900/30"
            >
              <i className="fa-solid fa-phone-slash"></i>
            </button>
           </>
         )}
       </div>
    </div>
  );
};

export default LiveView;
