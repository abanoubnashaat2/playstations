import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Monitor, DollarSign, User, Timer, Pencil, Check, X } from 'lucide-react';
import { SessionRecord } from '../types';

interface ScreenCardProps {
  id: string;
  name: string;
  onRename: (newName: string) => void;
  onSessionComplete: (record: SessionRecord) => void;
}

interface SavedState {
  isActive: boolean;
  startTime: number | null;
  hourlyRate: string;
  customerName: string;
}

const ScreenCard: React.FC<ScreenCardProps> = ({ id, name, onRename, onSessionComplete }) => {
  const storageKey = `screen_state_${id}`;

  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hourlyRate, setHourlyRate] = useState<string>('50');
  const [customerName, setCustomerName] = useState('');
  
  // Editing Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(name);

  // Ref for the interval
  const timerRef = useRef<number | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: SavedState = JSON.parse(saved);
        setHourlyRate(parsed.hourlyRate);
        setCustomerName(parsed.customerName);
        if (parsed.isActive && parsed.startTime) {
          setStartTime(parsed.startTime);
          setIsActive(true);
          // Calculate elapsed immediately
          const now = Date.now();
          setElapsedSeconds(Math.floor((now - parsed.startTime) / 1000));
        }
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
  }, [id, storageKey]);

  // Save state to localStorage whenever relevant changes occur
  useEffect(() => {
    const stateToSave: SavedState = {
      isActive,
      startTime,
      hourlyRate,
      customerName
    };
    localStorage.setItem(storageKey, JSON.stringify(stateToSave));
  }, [isActive, startTime, hourlyRate, customerName, storageKey]);

  // Sync temp name if prop changes
  useEffect(() => {
    setTempName(name);
  }, [name]);

  // Format seconds into HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate current cost
  const currentCost = React.useMemo(() => {
    const rate = parseFloat(hourlyRate) || 0;
    const hours = elapsedSeconds / 3600;
    return (hours * rate).toFixed(2);
  }, [elapsedSeconds, hourlyRate]);

  // Handle Name Save
  const handleSaveName = () => {
    if (tempName.trim()) {
      onRename(tempName.trim());
    } else {
      setTempName(name); // Revert if empty
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setTempName(name);
    setIsEditingName(false);
  };

  // Start Session
  const handleStart = () => {
    if (!hourlyRate) {
      alert('الرجاء تحديد سعر الساعة');
      return;
    }
    const now = Date.now();
    setStartTime(now);
    setIsActive(true);
    setElapsedSeconds(0);
    setIsEditingName(false); // Close edit if open
  };

  // Stop Session
  const handleStop = () => {
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
    
    // Explicitly clear specific storage for this screen reset
    // Note: The useEffect will overwrite this with the reset state immediately after, which is fine.
  };

  // Timer Effect
  useEffect(() => {
    if (isActive && startTime) {
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        setElapsedSeconds(Math.floor((now - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, startTime]);

  // Visual Timer Math
  const radius = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((elapsedSeconds % 60) / 60) * circumference;

  return (
    <div className={`relative flex flex-col overflow-hidden rounded-3xl transition-all duration-300 group ${
      isActive 
        ? 'bg-slate-900 ring-2 ring-blue-500 shadow-[0_0_40px_-10px_rgba(59,130,246,0.4)] translate-y-[-2px]' 
        : 'bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600'
    }`}>
      
      {/* Active Indicator Strip */}
      {isActive && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 animate-pulse"></div>
      )}

      {/* Header Section */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-400'}`}>
            <Monitor className="w-5 h-5" />
          </div>
          
          <div className="flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="bg-slate-950 border border-blue-500/50 text-white text-sm rounded px-2 py-1 w-full focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <button onClick={handleSaveName} className="text-green-400 hover:bg-green-400/10 p-1 rounded"><Check className="w-4 h-4" /></button>
                <button onClick={handleCancelEdit} className="text-red-400 hover:bg-red-400/10 p-1 rounded"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group/edit">
                <h2 className="text-lg font-bold text-white leading-tight truncate max-w-[150px]">{name}</h2>
                {!isActive && (
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="opacity-0 group-hover/edit:opacity-100 transition-opacity text-slate-500 hover:text-blue-400"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}></span>
              <span className={`text-xs font-medium ${isActive ? 'text-green-400' : 'text-slate-500'}`}>
                {isActive ? 'جلسة نشطة' : 'جاهز للبدء'}
              </span>
            </div>
          </div>
        </div>
        
        {isActive && (
          <div className="bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded text-xs text-blue-300 font-mono">
            LIVE
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-5 flex-1 flex flex-col gap-5">
        
        {/* Timer Box */}
        <div className={`relative rounded-2xl p-4 flex flex-col items-center justify-center border transition-colors ${
          isActive 
            ? 'bg-slate-950/80 border-blue-500/30' 
            : 'bg-slate-900/50 border-white/5'
        }`}>
          {/* Visual Timer Ring & Label */}
          <div className="flex items-center gap-2 mb-2">
            <div className="relative w-5 h-5 flex items-center justify-center">
               <svg className="w-full h-full transform -rotate-90">
                 <circle cx="10" cy="10" r={radius} stroke="currentColor" strokeWidth="2.5" fill="transparent" className="text-slate-800" />
                 <circle 
                   cx="10" 
                   cy="10" 
                   r={radius} 
                   stroke="currentColor" 
                   strokeWidth="2.5" 
                   fill="transparent" 
                   strokeDasharray={circumference}
                   strokeDashoffset={strokeDashoffset}
                   strokeLinecap="round"
                   className={`transition-all duration-300 ease-in-out ${isActive ? 'text-blue-500' : 'text-slate-600'}`} 
                 />
               </svg>
            </div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              الوقت المستغرق
            </span>
          </div>

          <div className={`text-5xl font-mono font-bold tracking-wider tabular-nums transition-colors ${isActive ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'text-slate-600'}`}>
            {formatTime(elapsedSeconds)}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-colors focus-within:border-blue-500/50 focus-within:bg-slate-900">
            <label className="block text-xs text-slate-500 mb-1.5">سعر الساعة</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                disabled={isActive}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full bg-transparent text-lg font-bold text-white placeholder-slate-600 focus:outline-none disabled:opacity-50"
                placeholder="0"
              />
              <span className="text-xs font-medium text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">ج.م</span>
            </div>
          </div>

          <div className={`rounded-xl p-3 border transition-colors ${
            isActive 
              ? 'bg-blue-900/10 border-blue-500/20' 
              : 'bg-slate-900/50 border-white/5'
          }`}>
            <label className="block text-xs text-slate-500 mb-1.5">التكلفة الحالية</label>
            <div className="flex items-center justify-between">
              <span className={`text-lg font-bold ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                {currentCost}
              </span>
              <DollarSign className={`w-4 h-4 ${isActive ? 'text-blue-500/50' : 'text-slate-700'}`} />
            </div>
          </div>
        </div>

        {/* Customer Name */}
        <div className="relative group/input">
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <User className="w-4 h-4 text-slate-600 group-focus-within/input:text-blue-400 transition-colors" />
          </div>
          <input
            type="text"
            disabled={isActive}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full bg-slate-900/30 border border-white/5 rounded-xl py-3 pr-10 pl-4 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:bg-slate-900 focus:border-blue-500/30 transition-all disabled:opacity-50"
            placeholder="اسم العميل (اختياري)"
          />
        </div>

        {/* Action Button */}
        <div className="mt-auto pt-2">
          {!isActive ? (
            <button
              onClick={handleStart}
              className="group relative w-full overflow-hidden rounded-xl bg-blue-600 p-3.5 transition-all hover:bg-blue-500 active:scale-[0.98]"
            >
              <div className="relative z-10 flex items-center justify-center gap-2 font-bold text-white">
                <Play className="w-5 h-5 fill-white/20" />
                <span>بدء الجلسة</span>
              </div>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-shimmer" />
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="group relative w-full overflow-hidden rounded-xl bg-red-500/10 border border-red-500/50 p-3.5 transition-all hover:bg-red-500 hover:border-red-500 active:scale-[0.98]"
            >
              <div className="flex items-center justify-center gap-2 font-bold text-red-500 group-hover:text-white transition-colors">
                <Square className="w-5 h-5 fill-current" />
                <span>إيقاف وحساب</span>
              </div>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ScreenCard;