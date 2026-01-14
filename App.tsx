
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Howl } from 'howler';
import confetti from 'canvas-confetti';
import { 
  Users, Gift, Play, RotateCcw, Download, Volume2, VolumeX, History, 
  Settings, X, Music, Upload, Trash2, AlertTriangle, Info, Database, 
  BarChart3, PieChart, CheckCircle2, FileJson, Headphones, Speaker, 
  PlayCircle, StopCircle, RefreshCw, Sparkles, Image as ImageIcon,
  UserCheck
} from 'lucide-react';
import { AppState, Employee, Prize, Winner, Settings as AppSettings } from './types';
import { SOUNDS, DEFAULT_FALLING_ICONS } from './constants';
import * as ExcelService from './services/excelService';
import * as GeminiService from './services/geminiService';
import FileUpload from './components/FileUpload';
import SlotMachine from './components/SlotMachine';
import FallingIcons from './components/FallingIcons';

interface ModalConfig {
  isOpen: boolean;
  type: 'confirm' | 'alert';
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const App: React.FC = () => {
  // State
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [currentPrize, setCurrentPrize] = useState<Prize | null>(null);
  const [winner, setWinner] = useState<Employee | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings & { bgMusicEnabled: boolean, fallingIconsEnabled: boolean }>({
    soundEnabled: true,
    demoMode: false,
    confettiEnabled: true,
    bgMusicEnabled: true,
    fallingIconsEnabled: true,
  });
  
  const [modal, setModal] = useState<ModalConfig>({ isOpen: false, type: 'alert', title: '', message: '' });
  const [customSounds, setCustomSounds] = useState({ 
    spin: SOUNDS.SPIN, 
    win: SOUNDS.WIN, 
    click: SOUNDS.CLICK, 
    bg: SOUNDS.BG_MUSIC 
  });
  const [fallingIcons, setFallingIcons] = useState<string[]>(DEFAULT_FALLING_ICONS);
  
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string>("");
  const [lastWinId, setLastWinId] = useState<string | null>(null);

  // Sounds refs
  const spinSound = useRef<Howl | null>(null);
  const winSound = useRef<Howl | null>(null);
  const clickSound = useRef<Howl | null>(null);
  const bgMusic = useRef<Howl | null>(null);

  useEffect(() => {
    spinSound.current?.unload();
    winSound.current?.unload();
    clickSound.current?.unload();
    bgMusic.current?.unload();

    spinSound.current = new Howl({ src: [customSounds.spin], loop: true, volume: 0.7 });
    winSound.current = new Howl({ src: [customSounds.win], volume: 0.9 });
    clickSound.current = new Howl({ src: [customSounds.click], volume: 0.4 });
    bgMusic.current = new Howl({ src: [customSounds.bg], loop: true, volume: 0.25, html5: true });

    return () => {
      spinSound.current?.unload();
      winSound.current?.unload();
      clickSound.current?.unload();
      bgMusic.current?.unload();
    };
  }, [customSounds]);

  useEffect(() => {
    if (settings.bgMusicEnabled && appState !== AppState.SETUP && appState !== AppState.SPINNING) {
      if (!bgMusic.current?.playing()) bgMusic.current?.play();
      bgMusic.current?.volume(0.25);
    } else if (appState === AppState.SETUP && settings.bgMusicEnabled) {
       bgMusic.current?.volume(0.1);
    } else {
      bgMusic.current?.pause();
    }
  }, [settings.bgMusicEnabled, appState]);

  const playSound = (type: 'spin' | 'win' | 'click') => {
    if (!settings.soundEnabled) return;
    if (type === 'spin') spinSound.current?.play();
    if (type === 'win') winSound.current?.play();
    if (type === 'click') clickSound.current?.play();
  };

  const stopSound = (type: 'spin') => {
    if (type === 'spin') spinSound.current?.stop();
  };

  const handleAudioUpload = (type: keyof typeof customSounds, file: File) => {
    const url = URL.createObjectURL(file);
    setCustomSounds(prev => ({ ...prev, [type]: url }));
    showAlert("Thành công", `Đã cập nhật âm thanh ${type.toUpperCase()} tùy chỉnh.`);
  };

  const handleIconUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setFallingIcons(prev => [...prev, url]);
  };

  const removeIcon = (index: number) => {
    setFallingIcons(prev => prev.filter((_, i) => i !== index));
    playSound('click');
  };

  const resetAudio = (type: keyof typeof customSounds) => {
    let original = "";
    if (type === 'bg') original = SOUNDS.BG_MUSIC;
    if (type === 'spin') original = SOUNDS.SPIN;
    if (type === 'win') original = SOUNDS.WIN;
    if (type === 'click') original = SOUNDS.CLICK;
    setCustomSounds(prev => ({ ...prev, [type]: original }));
    showAlert("Reset", "Đã quay về âm thanh mặc định.");
  };

  const startSpin = () => {
    if (!currentPrize) return showAlert("Cảnh báo", "Vui lòng chọn Giải thưởng Insight cần trao!");
    const eligible = employees.filter(emp => !winners.find(w => w.employee.id === emp.id));
    if (eligible.length === 0) return showAlert("Hết dữ liệu", "Tất cả các node dữ liệu đã được gán giải!");
    if (currentPrize.quantity <= 0 && !settings.demoMode) return showAlert("Hết giải", "Giải thưởng này đã đạt ngưỡng giới hạn!");

    setAppState(AppState.SPINNING);
    bgMusic.current?.fade(0.1, 0, 500);
    playSound('spin');

    const duration = 12000 + Math.random() * 5000;

    setTimeout(() => {
      stopSound('spin');
      playSound('win');
      
      const winnerIndex = Math.floor(Math.random() * eligible.length);
      const selectedWinner = eligible[winnerIndex];
      const winId = Date.now().toString();

      setWinner(selectedWinner);
      setLastWinId(winId);
      setAppState(AppState.WINNER);
      triggerFireworks(); // Chạy hiệu ứng pháo hoa mới

      setAiLoading(true);
      GeminiService.generateCongratulation(selectedWinner, currentPrize.name)
        .then(msg => {
            setAiMessage(msg);
            setAiLoading(false);
            setWinners(prev => prev.map(w => w.id === winId ? { ...w, aiMessage: msg } : w));
        });

      if (!settings.demoMode) {
        setPrizes(prev => prev.map(p => p.id === currentPrize.id ? { ...p, quantity: p.quantity - 1 } : p));
        const prizeSnapshot = { ...currentPrize, quantity: currentPrize.quantity - 1 };
        setCurrentPrize(prizeSnapshot);
        setWinners(prev => [{ id: winId, employee: selectedWinner, prize: prizeSnapshot, timestamp: new Date().toISOString(), aiMessage: "" }, ...prev]);
      }
    }, duration);
  };

  const triggerFireworks = () => {
    if (!settings.confettiEnabled) return;
    
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 60 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // since particles fall down, start a bit higher than random
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#FFC62F', '#FF0000', '#FFFFFF'] });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#006B68', '#FFC62F', '#FFFFFF'] });
    }, 250);
  };

  const showAlert = (title: string, message: string) => {
    setModal({ isOpen: true, type: 'alert', title, message });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, confirmText = "Xác nhận", cancelText = "Hủy") => {
    setModal({ isOpen: true, type: 'confirm', title, message, onConfirm, confirmText, cancelText });
  };

  const handleReroll = (winId: string | null) => {
    if (!winId) return;
    const targetWinner = winners.find(w => w.id === winId);
    showConfirm("Xác nhận Rollback", `Hủy kết quả của ${targetWinner?.employee.name}? Giải thưởng sẽ được hoàn trả lại Database.`, () => executeReroll(winId));
  };

  const executeReroll = (winId: string) => {
    const targetWinner = winners.find(w => w.id === winId);
    if (!targetWinner) return;

    if (!settings.demoMode) {
      setPrizes(prevPrizes => {
        const newPrizes = prevPrizes.map(p => p.id === targetWinner.prize.id ? { ...p, quantity: p.quantity + 1 } : p);
        const restored = newPrizes.find(p => p.id === targetWinner.prize.id);
        if (restored) setCurrentPrize(restored);
        return newPrizes;
      });
    }
    setWinners(prevWinners => prevWinners.filter(w => w.id !== winId));
    if (appState === AppState.WINNER && lastWinId === winId) resetForNext();
    setModal({ ...modal, isOpen: false });
    playSound('click');
  };

  const resetForNext = () => {
    setWinner(null);
    setLastWinId(null);
    setAiMessage("");
    setAppState(AppState.READY);
    if (settings.bgMusicEnabled) bgMusic.current?.fade(0, 0.25, 500);
    playSound('click');
  };

  const renderAudioCardLocal = (title: string, type: keyof typeof customSounds, description: string) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between group hover:border-brand-yellow/30 transition-all">
        <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-black text-brand-yellow uppercase tracking-widest">{title}</span>
            <button onClick={() => resetAudio(type)} className="text-gray-500 hover:text-red-400 p-1"><RotateCcw className="w-3 h-3" /></button>
        </div>
        <p className="text-[9px] text-teal-100/60 leading-tight mb-3">{description}</p>
        <label className="flex items-center justify-center gap-2 p-2 bg-brand-emerald/20 border border-brand-emerald/40 rounded-lg cursor-pointer text-[10px] font-bold text-teal-100 hover:bg-brand-emerald/40 transition">
            <Upload className="w-3 h-3" /> Nạp file
            <input type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleAudioUpload(type, e.target.files[0])} />
        </label>
    </div>
  );

  const renderSetup = () => (
    <div className="relative z-10 max-w-6xl mx-auto w-full animate-fade-in space-y-10 mt-6 pb-20 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-5xl md:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow via-white to-brand-yellow drop-shadow-lg tracking-tight uppercase">
          D&A YEP 2025
        </h1>
        <p className="text-teal-200 text-lg md:text-xl font-light tracking-[0.3em] uppercase opacity-80">Trung tâm Dữ liệu và Phân tích - BIDV</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
            <FileUpload label="Database Cán bộ (Excel)" accept=".xlsx, .xls" onFileSelect={async (f) => {
                const data = await ExcelService.parseEmployees(f);
                setEmployees(data);
                playSound('click');
            }} onDownloadTemplate={() => ExcelService.downloadTemplate('employee')} icon={<Users className="w-10 h-10 text-brand-yellow" />} />
            {employees.length > 0 && (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl animate-fade-in shadow-lg">
                    <CheckCircle2 className="text-green-400 w-5 h-5" />
                    <span className="text-sm font-bold text-green-100 uppercase tracking-widest">Đã nạp {employees.length} Cán bộ thành công</span>
                </div>
            )}
        </div>
        <div className="space-y-4">
            <FileUpload label="Cấu hình Giải thưởng" accept=".xlsx, .xls" onFileSelect={async (f) => {
                const data = await ExcelService.parsePrizes(f);
                setPrizes(data);
                if (data.length > 0) setCurrentPrize(data[0]);
                playSound('click');
            }} onDownloadTemplate={() => ExcelService.downloadTemplate('prize')} icon={<Gift className="w-10 h-10 text-brand-yellow" />} />
            {prizes.length > 0 && (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl animate-fade-in shadow-lg">
                    <CheckCircle2 className="text-green-400 w-5 h-5" />
                    <span className="text-sm font-bold text-green-100 uppercase tracking-widest">Đã nạp {prizes.length} hạng mục giải thành công</span>
                </div>
            )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-8 rounded-[40px] border-brand-yellow/20 shadow-2xl space-y-8">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
                <Music className="w-6 h-6 text-brand-yellow" />
                <h3 className="text-xl font-black uppercase tracking-widest text-white">Âm thanh Sự kiện</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {renderAudioCardLocal("Nhạc nền", "bg", "Sôi động suốt buổi tiệc.")}
                {renderAudioCardLocal("Quay số", "spin", "Kịch tính lúc quay.")}
                {renderAudioCardLocal("Thắng giải", "win", "Vỡ òa cảm xúc.")}
                {renderAudioCardLocal("Nút bấm", "click", "Phản hồi tinh tế.")}
            </div>
        </div>

        <div className="glass-panel p-8 rounded-[40px] border-brand-yellow/20 shadow-2xl space-y-8">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
                <Sparkles className="w-6 h-6 text-brand-yellow" />
                <h3 className="text-xl font-black uppercase tracking-widest text-white">Hiệu ứng rơi</h3>
            </div>
            <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                    {fallingIcons.map((icon, i) => (
                        <div key={i} className="relative group">
                          <img src={icon} className="w-14 h-14 p-2 bg-white/5 border border-white/10 rounded-xl object-contain" />
                          <button onClick={() => removeIcon(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                    ))}
                    <label className="w-14 h-14 flex items-center justify-center bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow rounded-xl cursor-pointer hover:bg-brand-yellow/20 transition-all">
                        <Upload className="w-5 h-5" />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleIconUpload(e.target.files[0])} />
                    </label>
                </div>
                <button onClick={() => setFallingIcons(DEFAULT_FALLING_ICONS)} className="w-full text-xs text-gray-400 hover:text-white transition flex items-center justify-center gap-2">
                  <RotateCcw className="w-3 h-3" /> Khôi phục Hoa mai & Thỏi vàng
                </button>
            </div>
        </div>
      </div>

      {employees.length > 0 && prizes.length > 0 && (
        <div className="flex justify-center pt-6">
          <button onClick={() => setAppState(AppState.READY)} className="group relative px-20 py-8 bg-brand-yellow text-brand-emeraldDark rounded-full font-black text-2xl shadow-[0_0_50px_rgba(255,198,47,0.3)] hover:scale-105 transition-all flex items-center gap-4 active:scale-95">BẮT ĐẦU CHƯƠNG TRÌNH <Play className="w-8 h-8 fill-current" /></button>
        </div>
      )}
    </div>
  );

  const renderGame = () => {
    // Calculate remaining candidates
    const eligibleCount = employees.length - winners.length;

    return (
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 pb-20 relative z-10">
        <div className="glass-panel p-6 rounded-3xl border-brand-yellow/30 shadow-2xl">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="text-brand-yellow font-bold uppercase tracking-widest flex items-center gap-2">
                <PieChart className="w-5 h-5" /> Chọn hạng mục Giải thưởng
              </h3>
              <div className="flex items-center gap-3">
                  <button onClick={() => setShowSettings(true)} className="p-3 bg-white/5 rounded-full text-teal-200 border border-white/5"><Settings className="w-5 h-5" /></button>
                  <button onClick={() => showConfirm("Reset", "Quay về màn hình cấu hình?", () => setAppState(AppState.SETUP))} className="p-3 bg-red-500/10 rounded-full text-red-400 border border-red-500/10"><RotateCcw className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {prizes.map(p => (
                <button key={p.id} disabled={appState === AppState.SPINNING} onClick={() => { setCurrentPrize(p); playSound('click'); }} className={`relative p-5 rounded-2xl border-2 transition-all text-left ${currentPrize?.id === p.id ? 'border-brand-yellow bg-brand-yellow/10' : 'border-white/5 bg-white/5'} ${p.quantity === 0 ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}>
                  <p className="font-bold text-sm leading-tight text-white mb-2">{p.name}</p>
                  <span className="text-xs font-mono text-teal-100 bg-black/20 px-2 py-0.5 rounded">Còn: {p.quantity}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative py-12">
          {/* Candidates Counter Badge */}
          <div className="absolute top-0 right-0 z-20 -mt-2">
             <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                <UserCheck className="w-4 h-4 text-brand-yellow" />
                <span className="text-xs font-mono text-teal-100">
                   Khả dụng: <span className="font-bold text-white">{eligibleCount}</span> / {employees.length}
                </span>
             </div>
          </div>

          <SlotMachine candidates={employees.filter(e => !winners.find(w => w.employee.id === e.id))} isSpinning={appState === AppState.SPINNING} winner={winner} />
          
          {appState === AppState.READY && (
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20">
              <button onClick={startSpin} disabled={!currentPrize || currentPrize.quantity === 0} className="group relative px-20 py-8 bg-gradient-to-b from-brand-yellow to-yellow-600 text-brand-emeraldDark font-display font-black text-3xl md:text-5xl rounded-full shadow-[0_12px_0_#b45309,0_30px_60px_rgba(0,0,0,0.6)] active:shadow-none active:translate-y-2 uppercase tracking-tighter hover:scale-[1.02] transition-transform">
                BẮT ĐẦU QUAY
              </button>
            </div>
          )}
        </div>

        <div className="mt-12 glass-panel rounded-3xl p-8 border-t-4 border-t-brand-yellow relative z-20">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold flex items-center gap-3 text-white">
              <History className="w-7 h-7 text-brand-yellow" /> Danh sách trúng thưởng
            </h3>
            <button onClick={() => ExcelService.exportWinners(winners)} disabled={winners.length === 0} className="px-8 py-3 bg-brand-emerald text-white rounded-xl font-bold hover:bg-brand-emerald/80 transition flex items-center gap-3 shadow-lg">
              <Download className="w-5 h-5" /> Export Excel
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {winners.length === 0 ? (
              <div className="col-span-full text-center py-10 opacity-30 italic text-teal-100">Chưa tìm thấy chủ nhân của các giải thưởng.</div>
            ) :
              winners.map((w) => (
                <div key={w.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-yellow/30 transition-all flex justify-between items-start group">
                   <div className="min-w-0">
                      <p className="text-[10px] text-brand-yellow font-black uppercase mb-1 tracking-widest">{w.prize.name}</p>
                      <p className="text-xl font-bold text-white truncate">{w.employee.name}</p>
                      <p className="text-sm text-teal-300/70 truncate">{w.employee.department}</p>
                   </div>
                   <button onClick={() => handleReroll(w.id)} className="p-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                </div>
              ))
            }
          </div>
        </div>

        {appState === AppState.WINNER && winner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-3xl animate-fade-in">
            {/* Rotating Sunburst Background */}
            <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
               <div className="w-[200vw] h-[200vw] bg-[conic-gradient(from_0deg_at_50%_50%,rgba(255,198,47,0.1)_0deg,transparent_20deg,rgba(255,198,47,0.1)_40deg,transparent_60deg,rgba(255,198,47,0.1)_80deg,transparent_100deg,rgba(255,198,47,0.1)_120deg,transparent_140deg,rgba(255,198,47,0.1)_160deg,transparent_180deg,rgba(255,198,47,0.1)_200deg,transparent_220deg,rgba(255,198,47,0.1)_240deg,transparent_260deg,rgba(255,198,47,0.1)_280deg,transparent_300deg,rgba(255,198,47,0.1)_320deg,transparent_340deg,rgba(255,198,47,0.1)_360deg)] animate-[spin_20s_linear_infinite]" />
            </div>

            <div className="relative z-10 w-full max-w-2xl bg-brand-emeraldDark border-4 border-brand-yellow rounded-[40px] p-6 md:p-8 text-center shadow-[0_0_150px_rgba(255,198,47,0.6),0_0_50px_rgba(255,255,255,0.3)_inset] transform transition-all scale-100 hover:scale-[1.01]">
              <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="bg-gradient-to-r from-brand-yellow via-yellow-200 to-brand-yellow text-brand-emeraldDark font-black px-8 py-2 rounded-full uppercase text-lg md:text-xl animate-bounce tracking-[0.2em] shadow-[0_0_30px_rgba(255,198,47,0.8)] border-2 border-white">
                  WINNER
                </div>
                <div className="space-y-2 w-full">
                  <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-100 to-yellow-300 uppercase drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] filter drop-shadow-[0_0_20px_rgba(255,198,47,0.5)]">
                    {winner.name}
                  </h1>
                  
                  {/* Hiển thị Email để phân biệt trùng tên */}
                  <p className="text-base md:text-lg text-teal-200 font-medium tracking-wide font-mono">
                    {winner.email}
                  </p>

                  <p className="text-lg md:text-xl text-brand-yellow font-bold uppercase tracking-widest mt-1">{winner.department}</p>
                  
                  <div className="py-3 my-3 border-y-2 border-brand-yellow/30 w-full bg-brand-yellow/5">
                      <p className="text-[10px] font-mono text-brand-yellow/70 mb-1 uppercase tracking-widest">Đã trúng giải</p>
                      <div className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight drop-shadow-2xl leading-tight">
                          {currentPrize?.name}
                      </div>
                  </div>

                  <div className="min-h-[80px] bg-black/20 p-4 rounded-3xl italic text-base md:text-lg text-teal-100 max-w-xl mx-auto leading-relaxed border border-brand-yellow/10 shadow-inner">
                     {aiLoading ? (
                        <p className="animate-pulse text-brand-yellow flex items-center justify-center gap-3">
                           <RefreshCw className="animate-spin w-4 h-4" /> AI đang soạn lời chúc...
                        </p>
                     ) : (
                        <div className="relative">
                            <span className="text-2xl text-brand-yellow absolute -top-2 -left-1">"</span>
                            {aiMessage}
                            <span className="text-2xl text-brand-yellow absolute -bottom-4 -right-1">"</span>
                        </div>
                     )}
                  </div>
                  <div className="pt-4 flex flex-col md:flex-row justify-center gap-3">
                    <button onClick={() => handleReroll(lastWinId)} className="px-5 py-2 bg-red-600/20 text-red-400 border border-red-500/50 font-bold text-sm rounded-full hover:bg-red-600 hover:text-white transition active:scale-95">HỦY / QUAY LẠI</button>
                    <button onClick={resetForNext} className="px-8 py-2 bg-gradient-to-r from-brand-yellow to-yellow-400 text-brand-emeraldDark font-black text-lg rounded-full shadow-[0_0_40px_rgba(255,198,47,0.6)] hover:scale-105 transition active:scale-95 border-2 border-white/50">XÁC NHẬN / TIẾP TỤC</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {modal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
            <div className="bg-brand-emeraldDark border-2 border-brand-yellow/30 p-12 rounded-[48px] w-full max-w-lg shadow-2xl text-center">
              <div className="flex flex-col items-center gap-8">
                <div className="space-y-4">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{modal.title}</h2>
                  <p className="text-teal-100 text-lg leading-relaxed">{modal.message}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-5 w-full pt-6">
                  {modal.type === 'confirm' ? (
                    <>
                      <button onClick={() => setModal({ ...modal, isOpen: false })} className="flex-1 py-5 bg-white/5 text-teal-100 font-bold rounded-2xl border border-white/10 uppercase tracking-widest text-sm transition">Hủy</button>
                      <button onClick={modal.onConfirm} className="flex-1 py-5 bg-brand-yellow text-brand-emeraldDark font-black rounded-2xl shadow-xl uppercase tracking-widest text-sm active:scale-95">Xác nhận</button>
                    </>
                  ) : (
                    <button onClick={() => setModal({ ...modal, isOpen: false })} className="w-full py-5 bg-brand-yellow text-brand-emeraldDark font-black rounded-2xl uppercase tracking-widest text-sm active:scale-95">Đã hiểu</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#002e2c] bg-[radial-gradient(circle_at_top,_#006B68_0%,_#002e2c_60%)] text-white p-4 md:p-12 font-sans overflow-x-hidden relative">
      {settings.fallingIconsEnabled && <FallingIcons icons={fallingIcons} />}
      {appState === AppState.SETUP ? renderSetup() : renderGame()}
    </div>
  );
};

export default App;
