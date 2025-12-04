import React, { useState, useEffect } from 'react';
import { Gamepad2, History, Trash2, AlertTriangle, Plus, Zap } from 'lucide-react';
import ScreenCard from './components/ScreenCard';
import { SessionRecord, Screen } from './types';

interface ConfirmationState {
  isOpen: boolean;
  type: 'delete_one' | 'delete_all' | null;
  targetId?: string;
  message: string;
}

const App: React.FC = () => {
  // Initialize state from localStorage if available, else default
  const [screens, setScreens] = useState<Screen[]>(() => {
    const saved = localStorage.getItem('ps_screens');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'STATION 01' },
      { id: '2', name: 'STATION 02' },
      { id: '3', name: 'STATION 03' }
    ];
  });

  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>(() => {
    const saved = localStorage.getItem('ps_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [confirmState, setConfirmState] = useState<ConfirmationState>({
    isOpen: false,
    type: null,
    message: ''
  });

  // Persist Screens
  useEffect(() => {
    localStorage.setItem('ps_screens', JSON.stringify(screens));
  }, [screens]);

  // Persist History
  useEffect(() => {
    localStorage.setItem('ps_history', JSON.stringify(sessionHistory));
  }, [sessionHistory]);
  
  const handleSessionComplete = (record: SessionRecord) => {
    setSessionHistory(prev => [record, ...prev]);
  };

  const handleAddScreen = () => {
    const newId = Date.now().toString();
    const newScreen: Screen = {
      id: newId,
      name: `STATION ${String(screens.length + 1).padStart(2, '0')}`
    };
    setScreens(prev => [...prev, newScreen]);
  };

  const handleRenameScreen = (id: string, newName: string) => {
    setScreens(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
  };

  const totalRevenue = sessionHistory.reduce((acc, curr) => acc + curr.totalCost, 0);

  // Helper to format time for history
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}س ${mins}د`;
  };

  // --- Modal Handlers ---

  const requestDeleteSession = (sessionId: string) => {
    setConfirmState({
      isOpen: true,
      type: 'delete_one',
      targetId: sessionId,
      message: 'هل أنت متأكد من حذف هذا السجل؟'
    });
  };

  const requestResetRevenue = () => {
    setConfirmState({
      isOpen: true,
      type: 'delete_all',
      message: 'WARNING: System reset initiated. All records will be wiped.'
    });
  };

  const closeConfirm = () => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  const executeConfirmAction = () => {
    if (confirmState.type === 'delete_one' && confirmState.targetId) {
      setSessionHistory(prev => prev.filter(s => s.id !== confirmState.targetId));
    } else if (confirmState.type === 'delete_all') {
      setSessionHistory([]);
    }
    closeConfirm();
  };

  return (
    <div className="min-h-screen text-slate-200 pb-20 relative overflow-x-hidden">
      
      {/* Navbar / Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-fuchsia-500/30 sticky top-0 z-10 shadow-[0_0_20px_rgba(192,38,211,0.2)]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-fuchsia-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-12 h-12 bg-black rounded-lg flex items-center justify-center border border-white/10">
                <Gamepad2 className="w-7 h-7 text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 tracking-wider uppercase font-tech neon-glow">
                CYBER PS
              </h1>
              <p className="text-[10px] text-fuchsia-400/70 tracking-[0.2em] uppercase">System Online v2.0</p>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-black/60 rounded-none border-x border-fuchsia-500/30 px-6 py-2 skew-x-[-12deg]">
            <div className="flex flex-col items-end skew-x-[12deg]">
              <span className="text-[10px] text-cyan-500 uppercase tracking-widest">Daily Revenue</span>
              <div className="text-2xl font-bold text-fuchsia-400 font-tech drop-shadow-[0_0_5px_rgba(232,121,249,0.8)]">
                {totalRevenue.toFixed(2)} <span className="text-sm">EGP</span>
              </div>
            </div>
            <div className="h-8 w-px bg-fuchsia-500/30 skew-x-[12deg]"></div>
            <button 
              onClick={requestResetRevenue}
              className="skew-x-[12deg] text-red-500 hover:text-red-400 hover:bg-red-500/10 p-2 transition-all flex items-center gap-2 group"
              title="تصفير العداد اليومي"
            >
              <Trash2 className="w-5 h-5 group-hover:animate-pulse" />
              <span className="text-xs font-bold hidden md:inline uppercase tracking-widest">Reset</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Screen Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {screens.map((screen) => (
            <ScreenCard 
              key={screen.id} 
              id={screen.id} 
              name={screen.name}
              onRename={(newName) => handleRenameScreen(screen.id, newName)}
              onSessionComplete={handleSessionComplete} 
            />
          ))}

          {/* Add Screen Button */}
          <button 
            onClick={handleAddScreen}
            className="flex flex-col items-center justify-center gap-4 min-h-[420px] rounded-sm border border-dashed border-cyan-500/30 bg-black/20 hover:bg-cyan-900/10 hover:border-cyan-400 transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
            <div className="w-16 h-16 rounded-full border border-cyan-500/30 bg-black group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] flex items-center justify-center transition-all z-10">
              <Plus className="w-8 h-8 text-cyan-600 group-hover:text-cyan-400" />
            </div>
            <span className="font-bold text-lg text-cyan-700 group-hover:text-cyan-400 tracking-widest font-tech z-10">ADD TERMINAL</span>
          </button>
        </div>

        {/* History Section */}
        <div className="relative border border-fuchsia-500/30 bg-black/80 backdrop-blur-xl rounded-sm overflow-hidden shadow-[0_0_30px_-10px_rgba(192,38,211,0.2)]">
          {/* Decorative bar */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-cyan-500"></div>

          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-fuchsia-500" />
              <h3 className="font-bold text-white tracking-wider uppercase font-tech">Session Logs</h3>
            </div>
            <span className="text-xs text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 px-3 py-1 font-mono">
              ENTRIES: {sessionHistory.length}
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-white/[0.03] text-cyan-500/70 text-xs uppercase tracking-wider font-tech">
                <tr>
                  <th className="px-6 py-4 font-medium">TERMINAL</th>
                  <th className="px-6 py-4 font-medium">START TIME</th>
                  <th className="px-6 py-4 font-medium">DURATION</th>
                  <th className="px-6 py-4 font-medium">RATE</th>
                  <th className="px-6 py-4 font-medium text-left">TOTAL</th>
                  <th className="px-6 py-4 font-medium text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 font-mono text-sm">
                {sessionHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-tech">
                      NO DATA AVAILABLE
                    </td>
                  </tr>
                ) : (
                  sessionHistory.map((session) => (
                    <tr key={session.id} className="hover:bg-cyan-500/5 transition-colors group border-l-2 border-transparent hover:border-cyan-400">
                      <td className="px-6 py-4">
                        <span className="text-white font-bold">
                          {session.screenName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(session.startTime).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {formatDuration(session.durationSeconds)}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {session.hourlyRate}
                      </td>
                      <td className="px-6 py-4 text-left font-bold text-fuchsia-400 drop-shadow-[0_0_8px_rgba(192,38,211,0.4)]">
                        {session.totalCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => requestDeleteSession(session.id)}
                          className="text-slate-600 hover:text-red-500 transition-colors opacity-50 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Custom Confirmation Modal */}
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-black border border-red-500/50 p-1 max-w-sm w-full shadow-[0_0_50px_rgba(220,38,38,0.2)]">
            <div className="bg-slate-950 p-6 relative overflow-hidden">
               {/* Scanline overlay */}
               <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,6px_100%]"></div>
               
               <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4 text-red-500">
                  <AlertTriangle className="w-8 h-8 animate-pulse" />
                  <h3 className="text-xl font-bold font-tech uppercase tracking-widest">System Alert</h3>
                </div>
                
                <p className="text-slate-300 mb-8 leading-relaxed font-mono text-sm border-l-2 border-red-900/50 pl-4">
                  {confirmState.message}
                </p>
                
                <div className="flex gap-3 font-tech uppercase tracking-wider">
                  <button 
                    onClick={executeConfirmAction}
                    className="flex-1 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-600 py-3 font-bold transition-all duration-300"
                  >
                    Confirm
                  </button>
                  <button 
                    onClick={closeConfirm}
                    className="flex-1 bg-transparent hover:bg-white/10 text-slate-400 py-3 font-bold transition-colors border border-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;