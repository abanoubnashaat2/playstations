import React, { useState, useEffect } from 'react';
import { Gamepad2, History, Trash2, AlertTriangle, Plus } from 'lucide-react';
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
      { id: '1', name: 'شاشة 1' },
      { id: '2', name: 'شاشة 2' },
      { id: '3', name: 'شاشة 3' }
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
      name: `شاشة ${screens.length + 1}`
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
      message: 'هل أنت متأكد من حذف هذا السجل؟ سيتم خصم قيمته من الإجمالي.'
    });
  };

  const requestResetRevenue = () => {
    setConfirmState({
      isOpen: true,
      type: 'delete_all',
      message: 'هل أنت متأكد من تصفير العداد اليومي؟ سيتم حذف جميع السجلات.'
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
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 relative">
      
      {/* Navbar / Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white leading-none">مدير البلايستيشن</h1>
              <p className="text-xs text-slate-400 mt-1">نظام إدارة الوقت والحسابات</p>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-slate-800 rounded-xl px-6 py-2 border border-slate-700">
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-400">إجمالي إيراد اليوم</span>
              <div className="text-2xl font-bold text-green-400">{totalRevenue.toFixed(2)} ج.م</div>
            </div>
            <div className="h-8 w-px bg-slate-700"></div>
            <button 
              onClick={requestResetRevenue}
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg transition-colors flex items-center gap-2"
              title="تصفير العداد اليومي"
            >
              <Trash2 className="w-5 h-5" />
              <span className="text-xs font-bold hidden md:inline">تصفير الكل</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Screen Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
            className="flex flex-col items-center justify-center gap-4 min-h-[400px] rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/30 text-slate-600 hover:bg-slate-900 hover:border-blue-500/50 hover:text-blue-500 transition-all duration-300 group"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-800 group-hover:bg-blue-500/10 flex items-center justify-center transition-colors">
              <Plus className="w-8 h-8" />
            </div>
            <span className="font-bold text-lg">إضافة شاشة جديدة</span>
          </button>
        </div>

        {/* History Section */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white">سجل الجلسات المكتملة</h3>
            </div>
            <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-700">
              عدد الجلسات: {sessionHistory.length}
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">الشاشة</th>
                  <th className="px-6 py-3 font-medium">وقت البدء</th>
                  <th className="px-6 py-3 font-medium">المدة</th>
                  <th className="px-6 py-3 font-medium">سعر الساعة</th>
                  <th className="px-6 py-3 font-medium text-left">الحساب</th>
                  <th className="px-6 py-3 font-medium text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sessionHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      لا توجد جلسات مكتملة اليوم
                    </td>
                  </tr>
                ) : (
                  sessionHistory.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-sm font-bold border border-blue-900/50">
                          {session.screenName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {new Date(session.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-mono">
                        {formatDuration(session.durationSeconds)}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {session.hourlyRate}
                      </td>
                      <td className="px-6 py-4 text-left font-bold text-green-400">
                        {session.totalCost.toFixed(2)} ج.م
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => requestDeleteSession(session.id)}
                          className="text-slate-500 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-all"
                          title="حذف هذا السجل"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-amber-500">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="text-xl font-bold text-white">تأكيد الإجراء</h3>
            </div>
            
            <p className="text-slate-300 mb-8 leading-relaxed">
              {confirmState.message}
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={executeConfirmAction}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-red-900/20"
              >
                تأكيد الحذف
              </button>
              <button 
                onClick={closeConfirm}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold transition-colors border border-slate-700"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;