import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Monitor, DollarSign, User, Pencil, Check, X, Zap, Clock, Hourglass, Bell } from 'lucide-react';
import { SessionRecord } from '../types';

interface ScreenCardProps {
  id: string;
  name: string;
  onRename: (newName: string) => void;
  onSessionComplete: (record: SessionRecord) => void;
}

type SessionType = 'OPEN' | 'FIXED';

interface SavedState {
  isActive: boolean;
  startTime: number | null;
  hourlyRate: string;
  customerName: string;
  sessionType: SessionType;
  fixedMinutes: string;
  isTimeUp: boolean;
}

const ScreenCard: React.FC<ScreenCardProps> = ({ id, name, onRename, onSessionComplete }) => {
  const storageKey = `screen_state_${id}`;

  // State
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hourlyRate, setHourlyRate] = useState<string>('50');
  const [customerName, setCustomerName] = useState('');
  
  // New State for Fixed Time
  const [sessionType, setSessionType] = useState<SessionType>('OPEN');
  const [fixedMinutes, setFixedMinutes] = useState<string>('60');
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(name);

  const timerRef = useRef<number | null>(null);
  const alarmPlayedRef = useRef(false);

  // Sound Effect Helpers
  const playTone = (type: 'start' | 'stop' | 'alarm') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;

      if (type === 'start') {
        // Sci-fi Power Up
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        osc.start();
        osc.stop(now + 0.5);
      } else if (type === 'stop') {
        // Power Down
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        osc.start();
        osc.stop(now + 0.3);
      } else if (type === 'alarm') {
        // Alarm Siren
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.1);
        osc.frequency.linearRampToValueAtTime(440, now + 0.2);
        osc.frequency.linearRampToValueAtTime(880, now + 0.3);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        osc.start();
        osc.stop(now + 0.5);
      }
      
      // Clean up context after sound plays to prevent reaching browser limit
      setTimeout(() => {
        ctx.close();
      }, 600);
      
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  // Browser Notification Helper
  const sendNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`Time's Up!`, {
          body: `Session on ${name} has finished.`,
          icon: '/vite.svg'
        });
      } catch (e) {
        console.error("Notification failed", e);
      }
    }
  };

  // Load state
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: SavedState = JSON.parse(saved);
        setHourlyRate(parsed.hourlyRate);
        setCustomerName(parsed.customerName);
        setSessionType(parsed.sessionType || 'OPEN');
        setFixedMinutes(parsed.fixedMinutes || '60');
        
        if (parsed.isActive && parsed.startTime) {
          setStartTime(parsed.startTime);
          setIsActive(true);
          setIsTimeUp(parsed.isTimeUp || false);
          
          const now = Date.now();
          setElapsedSeconds(Math.floor((now - parsed.startTime) / 1000));
        }
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
  }, [id, storageKey]);

  // Save state
  useEffect(() => {
    const stateToSave: SavedState = {
      isActive,
      startTime,
      hourlyRate,
      customerName,
      sessionType,
      fixedMinutes,
      isTimeUp
    };
    localStorage.setItem(storageKey, JSON.stringify(stateToSave));
  }, [isActive, startTime, hourlyRate, customerName, sessionType, fixedMinutes, isTimeUp, storageKey]);

  useEffect(() => {
    setTempName(name);
  }, [name]);

  // Format Helpers
  const formatTime = (totalSeconds: number) => {
    const isNegative = totalSeconds < 0;
    const absSeconds = Math.abs(totalSeconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const seconds = absSeconds % 60;
    
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return isNegative ? `-${timeStr}` : timeStr;
  };

  // Calculations
  const limitSeconds = parseInt(fixedMinutes) * 60;
  
  const displayTime = React.useMemo(() => {
    if (sessionType === 'OPEN') return elapsedSeconds;
    // In Fixed mode, show remaining time
    return limitSeconds - elapsedSeconds;
  }, [sessionType, elapsedSeconds, limitSeconds]);

  const currentCost = React.useMemo(() => {
    const rate = parseFloat(hourlyRate) || 0;
    const hours = elapsedSeconds / 3600;
    return (hours * rate).toFixed(2);
  }, [elapsedSeconds, hourlyRate]);

  // Edit Handlers
  const handleSaveName = () => {
    if (tempName.trim()) onRename(tempName.trim());
    else setTempName(name);
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setTempName(name);
    setIsEditingName(false);
  };

  // Session Control
  const handleStart = () => {
    if (!hourlyRate) {
      alert('Enter Hourly Rate');
      return;
    }
    
    if (sessionType === 'FIXED') {
      if (!fixedMinutes || parseInt(fixedMinutes) <= 0) {
        alert('Please enter valid minutes for fixed session');
        return;
      }
      
      // Safely request notification permission
      if ('Notification' in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          Notification.requestPermission().catch(err => console.error("Notification permission request failed", err));
        }
      }
    }

    playTone('start');
    const now = Date.now();
    setStartTime(now);
    setIsActive(true);
    setElapsedSeconds(0);
    setIsTimeUp(false);
    alarmPlayedRef.current = false;
    setIsEditingName(false);
  };

  const handleStop = () => {
    playTone('stop');
    if (startTime) {
      const endTime = Date.now();
      const finalDuration = Math.floor((endTime - startTime) / 1000);
      const finalCost = (finalDuration / 3600) * (parseFloat(hourlyRate) || 0);

      const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);

      const record: SessionRecord = {
        id: uniqueId,
        screenId: id,
        screenName: name,
        startTime,
        endTime,
        durationSeconds: finalDuration,
        totalCost: finalCost,
        hourlyRate: parseFloat(hourlyRate),
      };

      onSessionComplete(record);
    }

    setIsActive(false);
    setStartTime(null);
    setElapsedSeconds(0);
    setCustomerName('');
    setIsTimeUp(false);
  };

  // Timer Interval
  useEffect(() => {
    if (isActive && startTime) {
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        const newElapsed = Math.floor((now - startTime) / 1000);
        setElapsedSeconds(newElapsed);

        // Check Fixed Time Limits
        if (sessionType === 'FIXED') {
          const limit = parseInt(fixedMinutes) * 60;
          if (newElapsed >= limit) {
            if (!isTimeUp) {
              setIsTimeUp(true);
            }
            // Play alarm only once when crossing the threshold
            if (!alarmPlayedRef.current) {
              playTone('alarm');
              sendNotification();
              alarmPlayedRef.current = true;
            }
          }
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, startTime, sessionType, fixedMinutes, isTimeUp]); // Added isTimeUp dependency to ensure state updates correctly

  // Visuals for ring
  // For Fixed: Scale 0 to 1 based on time remaining.
  // For Open: Just spin or seconds.
  const progressPercent = sessionType === 'FIXED' 
    ? Math.min(Math.max(elapsedSeconds / limitSeconds, 0), 1)
    : (elapsedSeconds % 60) / 60;

  const radius = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = sessionType === 'FIXED'
    ? circumference - (1 - progressPercent) * circumference // Fill up as time passes
    : circumference - progressPercent * circumference;

  const cardBorderClass = isTimeUp 
    ? 'border-red-500 shadow-[0_0_50px_-5px_rgba(239,68,68,0.6)] animate-pulse' 
    : isActive 
      ? 'border-cyan-500 shadow-[0_0_30px_-5px_rgba(6,182,212,0.4)]' 
      : 'border-white/10 hover:border-white/20';
      
  const cardBgClass = isTimeUp
    ? 'bg-red-950/40'
    : isActive 
      ? 'bg-black/60' 
      : 'bg-black/40';

  return (
    <div className={`relative flex flex-col overflow-hidden transition-all duration-300 group backdrop-blur-xl border ${cardBorderClass} ${cardBgClass} ${isActive ? 'z-10 scale-[1.02]' : ''}`}>
      
      {/* Decorative corners */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l transition-colors ${isActive ? (isTimeUp ? 'border-red-500' : 'border-cyan-400') : 'border-white/20'}`}></div>
      <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r transition-colors ${isActive ? (isTimeUp ? 'border-red-500' : 'border-cyan-400') : 'border-white/20'}`}></div>
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l transition-colors ${isActive ? (isTimeUp ? 'border-red-500' : 'border-cyan-400') : 'border-white/20'}`}></div>
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r transition-colors ${isActive ? (isTimeUp ? 'border-red-500' : 'border-cyan-400') : 'border-white/20'}`}></div>

      {/* Header */}
      <div className={`px-5 py-4 flex items-center justify-between border-b ${isActive ? (isTimeUp ? 'border-red-500/30 bg-red-950/30' : 'border-cyan-500/30 bg-cyan-950/20') : 'border-white/5 bg-white/[0.02]'}`}>
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-8 h-8 flex items-center justify-center transition-colors border ${isActive ? (isTimeUp ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400') : 'bg-white/5 border-white/10 text-slate-500'}`}>
            <Monitor className="w-4 h-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-1">
                <input 
                  type="text" 
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="bg-black border border-fuchsia-500 text-fuchsia-400 text-sm px-2 py-1 w-full focus:outline-none font-tech"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <button onClick={handleSaveName} className="text-green-400 hover:bg-green-400/20 p-1"><Check className="w-4 h-4" /></button>
                <button onClick={handleCancelEdit} className="text-red-400 hover:bg-red-400/20 p-1"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group/edit">
                <h2 className={`text-lg font-bold font-tech tracking-wider uppercase truncate ${isActive ? (isTimeUp ? 'text-red-500 neon-glow' : 'text-cyan-400 neon-glow') : 'text-slate-300'}`}>{name}</h2>
                {!isActive && (
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="opacity-0 group-hover/edit:opacity-100 transition-opacity text-slate-500 hover:text-fuchsia-400"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-1.5 h-1.5 ${isActive ? (isTimeUp ? 'bg-red-500 animate-bounce' : 'bg-cyan-400 animate-pulse') : 'bg-slate-600'}`}></span>
              <span className={`text-[10px] font-mono uppercase tracking-widest ${isActive ? (isTimeUp ? 'text-red-500 font-bold' : 'text-cyan-400') : 'text-slate-500'}`}>
                {isActive ? (isTimeUp ? 'TIME EXPIRED' : 'ACTIVE') : 'STANDBY'}
              </span>
            </div>
          </div>
        </div>
        
        {isActive && (
          <div className={`flex items-center gap-1 ${isTimeUp ? 'text-red-500' : 'text-fuchsia-500'} animate-pulse`}>
            {isTimeUp ? <Bell className="w-4 h-4 fill-current animate-ping" /> : <Zap className="w-3 h-3 fill-current" />}
            <span className="text-[10px] font-bold font-tech">{isTimeUp ? 'ALARM' : 'LIVE'}</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-5 flex-1 flex flex-col gap-5 relative">
        {/* Scanline BG effect if active */}
        {isActive && <div className={`absolute inset-0 z-0 pointer-events-none bg-[length:100%_4px,6px_100%] opacity-20 ${isTimeUp ? 'bg-[linear-gradient(rgba(50,0,0,0)_50%,rgba(50,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.1),rgba(255,0,0,0.05))]' : 'bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]'}`}></div>}

        {/* Mode Switcher (Only when not active) */}
        {!isActive && (
          <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 relative z-10">
            <button 
              onClick={() => setSessionType('OPEN')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-[10px] font-tech uppercase tracking-wider transition-all ${sessionType === 'OPEN' ? 'bg-cyan-950/50 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Clock className="w-3 h-3" />
              Open
            </button>
            <button 
              onClick={() => setSessionType('FIXED')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-[10px] font-tech uppercase tracking-wider transition-all ${sessionType === 'FIXED' ? 'bg-fuchsia-950/50 text-fuchsia-400 border border-fuchsia-500/30' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Hourglass className="w-3 h-3" />
              Fixed
            </button>
          </div>
        )}

        {/* Fixed Duration Input (Only when not active and Fixed mode) */}
        {!isActive && sessionType === 'FIXED' && (
          <div className="relative z-10 animate-in fade-in slide-in-from-top-1">
             <div className="flex items-center border border-fuchsia-500/50 bg-fuchsia-950/10 px-3 py-2 rounded-lg">
                <span className="text-[10px] text-fuchsia-400 font-tech uppercase mr-2">Time (Min)</span>
                <input 
                  type="number"
                  value={fixedMinutes}
                  onChange={(e) => setFixedMinutes(e.target.value)}
                  className="bg-transparent text-right w-full text-white font-mono focus:outline-none"
                  placeholder="60"
                />
             </div>
          </div>
        )}

        {/* Timer Box */}
        <div className={`relative p-6 flex flex-col items-center justify-center border transition-all z-10 ${
          isActive 
            ? (isTimeUp ? 'bg-red-950/20 border-red-500' : 'bg-black/80 border-cyan-500/30') 
            : 'bg-white/[0.02] border-white/5'
        }`}>
          {/* Visual Timer Ring & Label */}
          <div className="flex items-center gap-2 mb-2">
             <div className="relative w-4 h-4 flex items-center justify-center">
               <svg className="w-full h-full transform -rotate-90">
                 <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-slate-800" />
                 <circle 
                   cx="8" 
                   cy="8" 
                   r="6" 
                   stroke="currentColor" 
                   strokeWidth="2" 
                   fill="transparent" 
                   strokeDasharray={2 * Math.PI * 6}
                   strokeDashoffset={strokeDashoffset}
                   strokeLinecap="butt"
                   className={`transition-all duration-1000 ease-linear ${
                     isActive 
                       ? (isTimeUp ? 'text-red-500' : (sessionType === 'FIXED' ? 'text-fuchsia-500' : 'text-cyan-400')) 
                       : 'text-slate-600'
                   }`} 
                 />
               </svg>
            </div>
            <span className={`text-[10px] uppercase tracking-[0.2em] font-tech ${isTimeUp ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
              {sessionType === 'FIXED' ? 'Remaining' : 'Duration'}
            </span>
          </div>

          <div className={`text-5xl font-tech font-bold tracking-widest tabular-nums transition-all ${
            isActive 
              ? (isTimeUp ? 'text-red-500 neon-glow animate-pulse' : (displayTime < 300 && sessionType === 'FIXED' ? 'text-yellow-500' : 'text-cyan-400 neon-glow')) 
              : 'text-slate-700'
          }`}>
            {formatTime(displayTime)}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="group/input relative">
            <label className="block text-[10px] text-slate-500 mb-1 font-tech uppercase tracking-wider">Hourly Rate</label>
            <div className="flex items-center border-b border-slate-700 group-focus-within/input:border-fuchsia-500 transition-colors bg-black/40 px-2 py-1">
              <input
                type="number"
                disabled={isActive}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full bg-transparent text-lg font-bold font-mono text-white placeholder-slate-700 focus:outline-none disabled:opacity-50 disabled:text-slate-500"
                placeholder="00"
              />
              <span className="text-[10px] text-fuchsia-500 font-bold ml-1">EGP</span>
            </div>
          </div>

          <div className={`transition-colors ${isActive ? 'opacity-100' : 'opacity-60'}`}>
            <label className="block text-[10px] text-slate-500 mb-1 font-tech uppercase tracking-wider">Current Cost</label>
            <div className="flex items-center justify-between border-b border-slate-700 bg-black/40 px-2 py-1">
              <span className={`text-lg font-bold font-mono ${isActive ? 'text-fuchsia-400 drop-shadow-[0_0_5px_rgba(232,121,249,0.8)]' : 'text-slate-500'}`}>
                {currentCost}
              </span>
              <DollarSign className={`w-3 h-3 ${isActive ? 'text-fuchsia-500' : 'text-slate-700'}`} />
            </div>
          </div>
        </div>

        {/* Customer Name */}
        <div className="relative group/input z-10">
          <input
            type="text"
            disabled={isActive}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full bg-black/30 border border-white/10 py-3 px-4 text-xs font-mono text-cyan-300 placeholder-slate-700 focus:outline-none focus:border-cyan-500/50 focus:bg-cyan-950/10 transition-all disabled:opacity-50"
            placeholder="PLAYER NAME..."
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <User className="w-3 h-3 text-slate-700 group-focus-within/input:text-cyan-500" />
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto pt-2 z-10">
          {!isActive ? (
            <button
              onClick={handleStart}
              className={`group relative w-full overflow-hidden border p-3.5 transition-all active:scale-[0.99] ${
                sessionType === 'FIXED' 
                  ? 'bg-fuchsia-950/20 border-fuchsia-500/50 hover:bg-fuchsia-500/10 hover:border-fuchsia-400 hover:shadow-[0_0_20px_rgba(232,121,249,0.2)]'
                  : 'bg-cyan-950/20 border-cyan-500/50 hover:bg-cyan-500/10 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]'
              }`}
            >
              <div className={`relative z-10 flex items-center justify-center gap-2 font-bold font-tech tracking-widest uppercase ${
                sessionType === 'FIXED' ? 'text-fuchsia-400' : 'text-cyan-400'
              }`}>
                {sessionType === 'FIXED' ? <Hourglass className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{sessionType === 'FIXED' ? 'Start Timer' : 'Initialize'}</span>
              </div>
              {/* Button Glitch Effect Overlay */}
              <div className={`absolute inset-0 translate-y-full transition-transform duration-300 group-hover:translate-y-0 ${
                sessionType === 'FIXED' ? 'bg-fuchsia-400/10' : 'bg-cyan-400/10'
              }`}></div>
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="group relative w-full overflow-hidden border border-red-500/50 bg-red-950/20 p-3.5 transition-all hover:bg-red-500/10 hover:border-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] active:scale-[0.99]"
            >
              <div className="flex items-center justify-center gap-2 font-bold text-red-500 font-tech tracking-widest uppercase group-hover:text-red-400 transition-colors">
                <Square className="w-4 h-4 fill-current" />
                <span>Terminate</span>
              </div>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ScreenCard;