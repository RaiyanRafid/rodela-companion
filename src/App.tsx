import { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

type Reaction = {
  id: string;
  emotion: string;
  dialogue: string;
  animation: 'idle' | 'working' | 'dancing' | 'bounce';
  should_speak: boolean;
};
type Expression = 'happy' | 'panic' | 'music' | 'jealous' | 'love' | 'blink';

export default function App() {
  const [emotion, setEmotion] = useState('neutral');
  const [blinking, setBlinking] = useState(false);
  const [speech, setSpeech] = useState('');
  const [speechActive, setSpeechActive] = useState(false);
  const [animation, setAnimation] = useState<Reaction['animation']>('idle');
  const [isJumping, setIsJumping] = useState(false);
  const speechTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const expression: Expression = blinking && !['panic', 'love'].includes(emotion)
    ? 'blink' : emotion === 'concerned' ? 'panic'
    : ['panic', 'music', 'jealous', 'love'].includes(emotion) ? emotion as Expression : 'happy';

  const showSpeech = useCallback((text: string, duration = 6500) => {
    clearTimeout(speechTimer.current);
    setSpeech(text);
    setSpeechActive(Boolean(text));
    if (text) speechTimer.current = setTimeout(() => setSpeechActive(false), duration);
  }, []);

  useEffect(() => {
    let blinkTimer: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setBlinking(true);
      blinkTimer = setTimeout(() => setBlinking(false), 180);
    }, 4200);
    return () => { clearInterval(interval); clearTimeout(blinkTimer); clearTimeout(speechTimer.current); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let lastId = '';
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const reaction = await invoke<Reaction | null>('get_companion_reaction');
        if (!cancelled && reaction && reaction.id !== lastId) {
          lastId = reaction.id;
          setEmotion(reaction.emotion);
          setAnimation(reaction.animation);
          showSpeech(reaction.should_speak ? reaction.dialogue : '');
        }
      } catch { /* Remain quiet when no desktop bridge is available. */ }
      if (!cancelled) timer = setTimeout(poll, 1000);
    };
    void poll();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [showSpeech]);

  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | undefined;
    let jumpTimer: ReturnType<typeof setTimeout> | undefined;
    listen('screen-jump', () => {
      setIsJumping(true);
      clearTimeout(jumpTimer);
      jumpTimer = setTimeout(() => setIsJumping(false), 850);
    }).then(un => { if (cancelled) un(); else unlisten = un; }).catch(() => {});
    return () => { cancelled = true; unlisten?.(); clearTimeout(jumpTimer); };
  }, []);

  const handlePoke = () => {
    // Replay the last genuine agent response; never manufacture a canned message.
    if (speech) showSpeech(speech);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-end pb-3 select-none overflow-hidden bg-transparent">
      {/* Speech Bubble */}
      <div
        className={`relative max-w-[220px] mb-2 px-3.5 py-2 rounded-2xl bg-slate-950/90 border border-teal-500/40 text-slate-100 text-[11px] font-medium text-center shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_15px_rgba(111,200,183,0.25)] backdrop-blur-md transition-all duration-300 pointer-events-none ${
          speechActive ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-90'
        }`}
      >
        {speech}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-slate-950/90" />
      </div>

      {/* Robot Stage */}
      <div
        onClick={handlePoke}
        className="relative w-[140px] h-[150px] flex items-center justify-center cursor-pointer group"
      >
        {/* Floor Shadow */}
        <div className="absolute bottom-1 w-20 h-3.5 bg-[radial-gradient(ellipse_at_center,rgba(111,200,183,0.4)_0%,rgba(0,0,0,0)_75%)] rounded-full animate-pulse pointer-events-none" />

        {/* Floating Robot Body */}
        <div
          className={`relative flex flex-col items-center transition-all duration-300 group-hover:scale-105 active:scale-95 ${
            isJumping ? 'scale-0 translate-y-10 opacity-0' : 'scale-100 translate-y-0 opacity-100'
          }`}
          style={{ animation: 'floatAnim 2.8s ease-in-out infinite' }}
        >
          {/* Antenna */}
          <div className="relative w-1 h-3 bg-teal-400 rounded-sm">
            <div className="absolute -top-1.5 -left-1 w-3 h-3 bg-[#f79522] rounded-full shadow-[0_0_10px_#f79522] animate-ping" />
          </div>

          {/* Robot Head Chassis */}
          <div
            className={`w-[88px] h-[74px] rounded-[26px] bg-gradient-to-br from-slate-800 to-slate-950 border-2 border-teal-400/50 shadow-[0_0_25px_rgba(111,200,183,0.35)] flex items-center justify-center overflow-hidden transition-all duration-300 ${
              animation === 'dancing' || animation === 'bounce' ? 'animate-bounce' : animation === 'working' ? 'animate-pulse' : ''
            }`}
          >
            {/* OLED Visor Screen */}
            <div className="w-[72px] h-[56px] rounded-[18px] bg-[#030508] shadow-inner flex items-center justify-center gap-3 relative">
              {/* Eyes */}
              {expression === 'blink' && (
                <>
                  <div className="w-3.5 h-0.5 bg-teal-400 rounded-full" />
                  <div className="w-3.5 h-0.5 bg-teal-400 rounded-full" />
                </>
              )}

              {expression === 'happy' && (
                <>
                  <div className="w-3.5 h-3 bg-teal-400 rounded-t-full shadow-[0_0_15px_#6fc8b7]" />
                  <div className="w-3.5 h-3 bg-teal-400 rounded-t-full shadow-[0_0_15px_#6fc8b7]" />
                  <div className="absolute bottom-2 left-2 w-2.5 h-1 bg-rose-500/60 rounded-full blur-[1px]" />
                  <div className="absolute bottom-2 right-2 w-2.5 h-1 bg-rose-500/60 rounded-full blur-[1px]" />
                </>
              )}

              {expression === 'panic' && (
                <>
                  <div className="w-4 h-4 bg-red-500 rounded-full shadow-[0_0_18px_#ef4444] animate-ping" />
                  <div className="w-4 h-4 bg-red-500 rounded-full shadow-[0_0_18px_#ef4444] animate-ping" />
                </>
              )}

              {expression === 'music' && (
                <>
                  <div className="w-3.5 h-4 bg-sky-300 rounded-full shadow-[0_0_15px_#97b8e1]" />
                  <div className="w-3.5 h-4 bg-sky-300 rounded-full shadow-[0_0_15px_#97b8e1]" />
                </>
              )}

              {expression === 'jealous' && (
                <>
                  <div className="w-4 h-2 bg-amber-400 rounded-sm -rotate-12 shadow-[0_0_12px_#f59e0b]" />
                  <div className="w-4 h-2 bg-amber-400 rounded-sm rotate-12 shadow-[0_0_12px_#f59e0b]" />
                </>
              )}

              {expression === 'love' && (
                <>
                  <div className="text-rose-500 text-sm shadow-[0_0_15px_#f43f5e] animate-pulse">❤️</div>
                  <div className="text-rose-500 text-sm shadow-[0_0_15px_#f43f5e] animate-pulse">❤️</div>
                </>
              )}
            </div>
          </div>

          {/* Thruster Pod */}
          <div className="relative w-8 h-3 bg-slate-800 rounded-md -mt-1 border border-teal-500/40">
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2 bg-[radial-gradient(ellipse_at_center,#6fc8b7_0%,transparent_80%)] rounded-full animate-ping" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes floatAnim {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
      `}</style>
    </div>
  );
}
