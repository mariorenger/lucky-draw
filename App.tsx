
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Howl } from 'howler';
import confetti from 'canvas-confetti';
import { 
  Users, Gift, Play, RotateCcw, Download, Volume2, VolumeX, History, 
  Settings, X, Music, Upload, Trash2, AlertTriangle, Info, Database, 
  BarChart3, PieChart, CheckCircle2, FileJson, Headphones, Speaker, 
  PlayCircle, StopCircle, RefreshCw, Sparkles, Image as ImageIcon,
  UserCheck, Edit3, Minus, Plus, Clock, Lock, Unlock, Key, ShieldAlert,
  Globe, ChevronDown, ChevronUp
} from 'lucide-react';
import { AppState, Employee, Prize, Winner, Settings as AppSettings, RiggedSetting } from './types';
import { Language, translations } from './services/languageService';
import { SOUNDS, DEFAULT_FALLING_ICONS, SLOT_CONFIG, DEFAULT_EMPLOYEES, DEFAULT_PRIZES } from './constants';
import * as ExcelService from './services/excelService';
import * as GeminiService from './services/geminiService';
import FileUpload from './components/FileUpload';
import SlotMachine from './components/SlotMachine';
import FallingIcons from './components/FallingIcons';
import DataManager from './components/DataManager';
import { 
  subscribeToCloudData, 
  syncEmployeesToCloud, 
  syncPrizesToCloud, 
  addWinnersToCloud, 
  updatePrizeCountCloud, 
  clearWinnersInCloud, 
  syncConfigToCloud,
  syncActivePrizeAndCountToCloud,
  sendRemoteSpinTriggerToCloud
} from './services/firebaseService';

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
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('_sys_yep_lang_');
      return (saved as Language) || 'mm'; // Default to Myanmar
    } catch (e) {
      return 'mm';
    }
  });

  const [isLangMenuOpen, setIsLangMenuOpen] = useState<boolean>(false);
  const [isPrizeSectionCollapsed, setIsPrizeSectionCollapsed] = useState<boolean>(false);

  const t = translations[lang];

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('_sys_yep_lang_', newLang);
    playSound('click');
  };

  // State loaded from localStorage for resilience against page reloads/F5
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem('_sys_yep_employees_');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [prizes, setPrizes] = useState<Prize[]>(() => {
    try {
      const saved = localStorage.getItem('_sys_yep_prizes_');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [winners, setWinners] = useState<Winner[]>(() => {
    try {
      const saved = localStorage.getItem('_sys_yep_winners_');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [currentPrize, setCurrentPrize] = useState<Prize | null>(() => {
    try {
      const saved = localStorage.getItem('_sys_yep_current_prize_');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [appState, setAppState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('_sys_yep_app_state_');
      // Reset spinning/winner state to READY to avoid half-spun/stuck states
      if (saved === AppState.SPINNING || saved === AppState.WINNER) {
        return AppState.READY;
      }
      return (saved as AppState) || AppState.SETUP;
    } catch (e) {
      return AppState.SETUP;
    }
  });

  const [spinCount, setSpinCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('_sys_yep_spin_count_');
      return saved ? parseInt(saved, 10) : 1;
    } catch (e) {
      return 1;
    }
  });

  const [spinDuration, setSpinDuration] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('_sys_yep_spin_duration_');
      return saved ? parseInt(saved, 10) : 10;
    } catch (e) {
      return 10;
    }
  });

  const [settings, setSettings] = useState<AppSettings & { bgMusicEnabled: boolean, fallingIconsEnabled: boolean, enableTease?: boolean }>(() => {
    const defaultSettings = {
      soundEnabled: true,
      demoMode: false,
      confettiEnabled: true,
      bgMusicEnabled: true,
      fallingIconsEnabled: true,
      enableTease: false,
    };
    try {
      const saved = localStorage.getItem('_sys_yep_settings_');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch (e) {
      return defaultSettings;
    }
  });

  // Changed from single winner to batch winners array
  const [batchWinners, setBatchWinners] = useState<Employee[]>([]); 
  const [pendingWinners, setPendingWinners] = useState<Winner[]>([]);

  const [showSettings, setShowSettings] = useState(false);
  const [showDataManager, setShowDataManager] = useState(false);
  
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
  const [lastBatchIds, setLastBatchIds] = useState<string[]>([]); // Track IDs for reroll
 
  // Active role state: 'MC' (directly to stage spin view) or 'ADMIN' (full management + spin view)
  const [userRole, setUserRole] = useState<'MC' | 'ADMIN' | null>(() => {
    const saved = sessionStorage.getItem('_sys_user_role_') || localStorage.getItem('_sys_user_role_');
    if (saved === 'MC' || saved === 'ADMIN') return saved as 'MC' | 'ADMIN';
    if (sessionStorage.getItem('_sys_session_active_key') === 'true' || localStorage.getItem('_sys_session_active_key') === 'true') {
      return 'ADMIN';
    }
    return null;
  });

  // Global password lock state (Admin: hannn2, MC: hannn13)
  const [isAppUnlocked, setIsAppUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('_sys_session_active_key') === 'true' || localStorage.getItem('_sys_session_active_key') === 'true';
  });
  const [appPasswordInput, setAppPasswordInput] = useState('');
  const [appPasswordError, setAppPasswordError] = useState('');

  // Admin secret prioritize states (decouple / obfuscate names to avoid easy inspection)
  const [riggedSettings, setRiggedSettings] = useState<RiggedSetting[]>(() => {
    try {
      const saved = localStorage.getItem('_sys_ui_theme_prefs_cache_');
      if (saved) {
        return JSON.parse(atob(saved));
      }
    } catch (e) {
      console.warn('Config load failed');
    }
    // Fallback support for old clear format if present to prevent losing data
    try {
      const oldSaved = localStorage.getItem('rigged_settings');
      if (oldSaved) {
        const parsed = JSON.parse(oldSaved);
        localStorage.removeItem('rigged_settings');
        return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminInputCode, setAdminInputCode] = useState('');
  const [adminError, setAdminError] = useState('');
  const [titleClickCount, setTitleClickCount] = useState(0);
  const [selectedPrizeForRigging, setSelectedPrizeForRigging] = useState<Prize | null>(null);
  const [adminPin, setAdminPin] = useState<string>('hannn2');
  const [mcPin, setMcPin] = useState<string>('hannn13');
  const [isMcUnlocked, setIsMcUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('_sys_mc_unlocked_session_') === 'true' || localStorage.getItem('_sys_mc_unlocked_session_') === 'true';
  });
  const [showMcLoginModal, setShowMcLoginModal] = useState<boolean>(false);
  const [mcInputCode, setMcInputCode] = useState<string>('');
  const [mcError, setMcError] = useState<string>('');

  const [myDeviceId] = useState<string>(() => 'dev_' + Math.random().toString(36).substring(2, 9));
  const lastProcessedSpinTimestamp = useRef<number>(0);
  const hasCheckedInitialSeed = useRef<boolean>(false);

  // Realtime Cloud Sync via Firebase Firestore
  useEffect(() => {
    const unsubscribe = subscribeToCloudData((cloudData) => {
      if (cloudData.employees !== undefined) {
        if (cloudData.employees.length > 0) {
          setEmployees(cloudData.employees);
        } else if (!hasCheckedInitialSeed.current) {
          setEmployees(DEFAULT_EMPLOYEES);
          syncEmployeesToCloud(DEFAULT_EMPLOYEES).catch(console.error);
        } else {
          setEmployees([]);
        }
      }

      if (cloudData.prizes !== undefined) {
        if (cloudData.prizes.length > 0) {
          setPrizes(cloudData.prizes);
          setCurrentPrize(prev => {
            if (!prev) return cloudData.prizes![0];
            const match = cloudData.prizes!.find(p => p.id === prev.id);
            return match || cloudData.prizes![0];
          });
        } else if (!hasCheckedInitialSeed.current) {
          setPrizes(DEFAULT_PRIZES);
          setCurrentPrize(DEFAULT_PRIZES[0]);
          syncPrizesToCloud(DEFAULT_PRIZES).catch(console.error);
        } else {
          setPrizes([]);
        }
      }

      hasCheckedInitialSeed.current = true;

      if (cloudData.activePrizeId) {
        setCurrentPrize(prev => {
          if (prev?.id === cloudData.activePrizeId) return prev;
          const found = prizes.find(p => p.id === cloudData.activePrizeId);
          return found || prev;
        });
      }

      if (cloudData.activeSpinCount !== undefined && cloudData.activeSpinCount > 0) {
        setSpinCount(cloudData.activeSpinCount);
      }

      if (cloudData.winners !== undefined) {
        setWinners(cloudData.winners);
      }
      if (cloudData.settings !== undefined) {
        setSettings(prev => ({ ...prev, ...cloudData.settings }));
      }
      if (cloudData.riggedSettings !== undefined) {
        setRiggedSettings(cloudData.riggedSettings);
      }
      if (cloudData.adminPin !== undefined && cloudData.adminPin) {
        setAdminPin(cloudData.adminPin);
      }
      if (cloudData.mcPin !== undefined && cloudData.mcPin) {
        setMcPin(cloudData.mcPin);
      }
      if (cloudData.spinTrigger) {
        const { prizeId, quantity, timestamp, senderId } = cloudData.spinTrigger;
        if (timestamp > lastProcessedSpinTimestamp.current && senderId !== myDeviceId) {
          lastProcessedSpinTimestamp.current = timestamp;
          // Auto trigger spin on remote screen
          setTimeout(() => {
            const targetPrize = prizes.find(p => p.id === prizeId);
            if (targetPrize && appState !== AppState.SPINNING) {
              setCurrentPrize(targetPrize);
              setSpinCount(quantity);
              executeSpin(targetPrize, quantity, false);
            }
          }, 100);
        }
      }
    });

    return () => unsubscribe();
  }, [prizes, myDeviceId]);

  const handleSelectPrize = (p: Prize) => {
    setCurrentPrize(p);
    playSound('click');
    syncActivePrizeAndCountToCloud(p.id, spinCount).catch(console.error);
  };

  const handleUpdateSpinCount = (newCount: number) => {
    setSpinCount(newCount);
    playSound('click');
    if (currentPrize) {
      syncActivePrizeAndCountToCloud(currentPrize.id, newCount).catch(console.error);
    }
  };

  // Ensure currentPrize is set whenever prizes exist
  useEffect(() => {
    if (prizes.length > 0 && (!currentPrize || !prizes.some(p => p.id === currentPrize.id))) {
      setCurrentPrize(prizes[0]);
    }
  }, [prizes, currentPrize]);

  // Auto transition to READY for MC & unlock controls
  useEffect(() => {
    if (userRole === 'MC') {
      setIsMcUnlocked(true);
      if (appState === AppState.SETUP) {
        setAppState(AppState.READY);
      }
    }
  }, [userRole, appState]);

  // Sync state changes back to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('_sys_yep_employees_', JSON.stringify(employees));
    } catch (e) {
      console.error(e);
    }
  }, [employees]);

  useEffect(() => {
    try {
      localStorage.setItem('_sys_yep_prizes_', JSON.stringify(prizes));
    } catch (e) {
      console.error(e);
    }
  }, [prizes]);

  useEffect(() => {
    try {
      localStorage.setItem('_sys_yep_winners_', JSON.stringify(winners));
    } catch (e) {
      console.error(e);
    }
  }, [winners]);

  useEffect(() => {
    try {
      localStorage.setItem('_sys_yep_current_prize_', currentPrize ? JSON.stringify(currentPrize) : '');
    } catch (e) {
      console.error(e);
    }
  }, [currentPrize]);

  useEffect(() => {
    try {
      localStorage.setItem('_sys_yep_app_state_', appState);
    } catch (e) {
      console.error(e);
    }
  }, [appState]);

  useEffect(() => {
    try {
      localStorage.setItem('_sys_yep_settings_', JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('_sys_yep_spin_count_', spinCount.toString());
    } catch (e) {
      console.error(e);
    }
  }, [spinCount]);

  useEffect(() => {
    try {
      localStorage.setItem('_sys_yep_spin_duration_', spinDuration.toString());
    } catch (e) {
      console.error(e);
    }
  }, [spinDuration]);

  useEffect(() => {
    try {
      localStorage.setItem('_sys_ui_theme_prefs_cache_', btoa(JSON.stringify(riggedSettings)));
    } catch (e) {
      console.error(e);
    }
  }, [riggedSettings]);

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

  // Adjust spinCount if prize quantity changes or runs low
  useEffect(() => {
    if (currentPrize) {
        // Ensure we don't spin more than available prizes (unless demo mode)
        const maxAvailable = settings.demoMode ? 10 : currentPrize.quantity;
        const eligibleCount = employees.length - winners.length;
        const maxPossible = Math.min(maxAvailable, eligibleCount);
        
        if (spinCount > maxPossible && maxPossible > 0) {
            setSpinCount(maxPossible);
        } else if (spinCount === 0 && maxPossible > 0) {
            setSpinCount(1);
        }
    }
  }, [currentPrize, winners.length, employees.length, settings.demoMode]);

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
    showAlert("Thành công", `Đã cập nhật âm thanh ${(type as string).toUpperCase()} tùy chỉnh.`);
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

  const executeSpin = (targetPrize: Prize, count: number, broadcastRemote: boolean = true) => {
    // Get eligible list
    const eligible = employees.filter(emp => !winners.find(w => w.employee.id === emp.id));
    
    if (eligible.length === 0) return showAlert("Hết dữ liệu", "Tất cả các node dữ liệu đã được gán giải!");
    if (targetPrize.quantity < count && !settings.demoMode) return showAlert("Không đủ giải", `Chỉ còn ${targetPrize.quantity} giải, không đủ để quay ${count} người.`);
    if (eligible.length < count) return showAlert("Không đủ người", `Chỉ còn ${eligible.length} người chưa trúng, không đủ để quay ${count} giải.`);

    if (broadcastRemote) {
      sendRemoteSpinTriggerToCloud(targetPrize.id, count, myDeviceId).catch(console.error);
    }

    // 1. SELECT WINNERS INSTANTLY
    const selectedWinners: Employee[] = [];
    const tempEligible = [...eligible];
    
    // Find rigged configurations for this specific prize
    const prizeRigged = riggedSettings.filter(rs => rs.prizeId === targetPrize.id);
    
    // Check which of these rigged employees are still eligible (haven't won anything yet)
    const eligibleRiggedEmployees = prizeRigged
      .map(rs => tempEligible.find(emp => emp.id === rs.employeeId))
      .filter((emp): emp is Employee => !!emp);

    for(let i = 0; i < count; i++) {
       if (tempEligible.length === 0) break;
       
       // Priority 1: Pick from eligible rigged employees
       if (eligibleRiggedEmployees.length > 0) {
         const riggedEmp = eligibleRiggedEmployees.shift()!;
         selectedWinners.push(riggedEmp);
         
         // Remove from tempEligible so we don't pick them again
         const indexInTemp = tempEligible.findIndex(e => e.id === riggedEmp.id);
         if (indexInTemp !== -1) {
           tempEligible.splice(indexInTemp, 1);
         }
       } else {
         // Priority 2: Pick completely randomly but EXCLUDE employees rigged for other active/uncompleted prizes
         const randomPool = tempEligible.filter(emp => {
           // Find if this employee is rigged for other prizes
           const otherRigged = riggedSettings.filter(rs => rs.employeeId === emp.id && rs.prizeId !== targetPrize.id);
           if (otherRigged.length === 0) return true;
           
           // Check if any of those other prizes still have remaining quantity to be drawn
           const hasActiveRiggedPrize = otherRigged.some(rs => {
             const tp = prizes.find(p => p.id === rs.prizeId);
             return tp && tp.quantity > 0;
           });
           
           // If yes, exclude them from this random draw so they don't lose their chance at the high-tier prize
           return !hasActiveRiggedPrize;
         });

         // Fallback if everyone is locked (unlikely), use the entire remaining tempEligible
         const activePool = randomPool.length > 0 ? randomPool : tempEligible;
         const randomIndex = Math.floor(Math.random() * activePool.length);
         const selectedEmp = activePool[randomIndex];
         selectedWinners.push(selectedEmp);
         
         // Remove from tempEligible so we don't pick them again
         const indexInTemp = tempEligible.findIndex(e => e.id === selectedEmp.id);
         if (indexInTemp !== -1) {
           tempEligible.splice(indexInTemp, 1);
         }
       }
    }

    const newWinnersData: Winner[] = [];
    const newBatchIds: string[] = [];

    selectedWinners.forEach(w => {
        const winId = Date.now().toString() + Math.random().toString().substr(2, 5);
        newBatchIds.push(winId);
        newWinnersData.push({
           id: winId,
           employee: w,
           prize: { ...targetPrize, quantity: targetPrize.quantity - count }, 
           timestamp: new Date().toISOString(),
           aiMessage: "" 
        });
    });

    // 2. SET STATES INSTANTLY
    setAppState(AppState.SPINNING);
    setBatchWinners(selectedWinners); // Pass winners to SlotMachine immediately!
    setPendingWinners(newWinnersData);
    setLastBatchIds(newBatchIds);

    bgMusic.current?.fade(0.1, 0, 500);
    playSound('spin');

    // AI Generation starts immediately in background
    setAiLoading(true);
    if (selectedWinners.length === 1) {
        GeminiService.generateCongratulation(selectedWinners[0], targetPrize.name, lang)
          .then(msg => {
              setAiMessage(msg);
              setAiLoading(false);
              setPendingWinners(prev => prev.map(w => w.id === newBatchIds[0] ? { ...w, aiMessage: msg } : w));
          });
    } else {
        const defaultMultiMsg = lang === 'vi' 
          ? `Chúc mừng ${selectedWinners.length} thành viên xuất sắc đã nhận giải ${targetPrize.name}!` 
          : lang === 'en' 
            ? `Congratulations to the ${selectedWinners.length} outstanding members on winning the ${targetPrize.name}!` 
            : `${targetPrize.name} ကို ရရှိသွားသော ကံထူးရှင် ${selectedWinners.length} ဦးလုံးကို အထူးပင် ဂုဏ်ယူဝမ်းမြောက်ပါသည်!`;
        setAiMessage(defaultMultiMsg);
        setAiLoading(false);
    }

    // Tính toán thời gian chờ để hiện Modal chúc mừng trùng khớp hoàn hảo với chuyển động của SlotMachine
    const maxReelDelay = (count - 1) * SLOT_CONFIG.REEL_DELAY;
    const stoppingDuration = maxReelDelay + SLOT_CONFIG.DECEL_DURATION + SLOT_CONFIG.TEASE_PAUSE + SLOT_CONFIG.WINNER_MOVE + SLOT_CONFIG.BOUNCE;
    const totalWaitTime = (spinDuration + stoppingDuration + SLOT_CONFIG.FREEZE_TIME + SLOT_CONFIG.SAFETY_BUFFER) * 1000;

    setTimeout(() => {
        stopSound('spin');
        playSound('win');
        setAppState(AppState.WINNER); // -> Hiện Modal
        triggerFireworks();
    }, totalWaitTime);
  };

  const startSpin = () => {
    if (!currentPrize) return showAlert("Cảnh báo", "Vui lòng chọn Giải thưởng Insight cần trao!");
    executeSpin(currentPrize, spinCount, true);
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
    showConfirm("Xác nhận Rollback", `Hủy kết quả của ${targetWinner?.employee.name}? Giải thưởng sẽ được hoàn trả lại Database.`, () => executeReroll([winId]));
  };

  // Allow rerolling the entire batch
  const handleBatchReroll = () => {
      showConfirm("Hủy kết quả lượt này?", "Toàn bộ danh sách trúng thưởng vừa rồi sẽ bị hủy và giải thưởng sẽ được hoàn lại.", () => executeReroll(lastBatchIds));
  };

  const executeReroll = (winIds: string[]) => {
    if (winIds.length === 0) return;

    // Find the prize associated (assuming all in batch are same prize)
    const sampleWin = winners.find(w => w.id === winIds[0]);
    if (!sampleWin) return;
    const prizeId = sampleWin.prize.id;

    if (!settings.demoMode) {
      setPrizes(prevPrizes => {
        const newPrizes = prevPrizes.map(p => p.id === prizeId ? { ...p, quantity: p.quantity + winIds.length } : p);
        const restored = newPrizes.find(p => p.id === prizeId);
        if (restored) setCurrentPrize(restored);
        return newPrizes;
      });
    }

    setWinners(prevWinners => prevWinners.filter(w => !winIds.includes(w.id)));
    if (appState === AppState.WINNER) resetForNext();
    setModal({ ...modal, isOpen: false });
    playSound('click');
  };

  const resetForNext = () => {
    setBatchWinners([]);
    setLastBatchIds([]);
    setAiMessage("");
    setAppState(AppState.READY);
    if (settings.bgMusicEnabled) bgMusic.current?.fade(0, 0.25, 500);
    playSound('click');
  };

  const confirmBatchWinners = () => {
    if (pendingWinners.length === 0) return;

    // 1. Thêm chính thức vào winners
    const updatedWinners = [...pendingWinners, ...winners];
    setWinners(updatedWinners);
    addWinnersToCloud(pendingWinners);

    // 2. Trừ giải thưởng chính thức (nếu không ở demoMode)
    if (!settings.demoMode && currentPrize) {
      const remainingQty = Math.max(0, currentPrize.quantity - pendingWinners.length);
      setPrizes(prev => {
        const updated = prev.map(p => p.id === currentPrize.id ? { ...p, quantity: remainingQty } : p);
        const samplePrize = updated.find(p => p.id === currentPrize.id);
        if (samplePrize) setCurrentPrize(samplePrize);
        syncPrizesToCloud(updated);
        return updated;
      });
      updatePrizeCountCloud(currentPrize.id, remainingQty);
    }

    // 3. Reset các trạng thái và quay về READY
    setBatchWinners([]);
    setPendingWinners([]);
    setLastBatchIds([]);
    setAiMessage("");
    setAppState(AppState.READY);
    if (settings.bgMusicEnabled) bgMusic.current?.fade(0, 0.25, 500);
    playSound('click');
  };

  const handleCancelSpin = () => {
    showConfirm(
      "Hủy kết quả lượt này?", 
      "Lượt quay số vừa rồi sẽ bị hủy bỏ hoàn toàn và không lưu vào danh sách trúng giải.", 
      () => {
        setBatchWinners([]);
        setPendingWinners([]);
        setLastBatchIds([]);
        setAiMessage("");
        setAppState(AppState.READY);
        if (settings.bgMusicEnabled) bgMusic.current?.fade(0, 0.25, 500);
        playSound('click');
      },
      "Hủy kết quả",
      "Quay lại"
    );
  };

  const handleResetAll = () => {
    showConfirm(
      "Khôi phục cài đặt gốc?",
      "Hành động này sẽ xóa sạch danh sách Cán bộ, Cơ cấu giải thưởng, Lịch sử trúng giải và toàn bộ các thiết lập hiện tại. Bạn có chắc chắn muốn thực hiện?",
      () => {
        setEmployees([]);
        setPrizes([]);
        setWinners([]);
        setCurrentPrize(null);
        setAppState(AppState.SETUP);
        setSpinCount(1);
        setSpinDuration(10);
        setRiggedSettings([]);
        
        localStorage.removeItem('_sys_yep_employees_');
        localStorage.removeItem('_sys_yep_prizes_');
        localStorage.removeItem('_sys_yep_winners_');
        localStorage.removeItem('_sys_yep_current_prize_');
        localStorage.removeItem('_sys_yep_app_state_');
        localStorage.removeItem('_sys_yep_settings_');
        localStorage.removeItem('_sys_yep_spin_count_');
        localStorage.removeItem('_sys_yep_spin_duration_');
        localStorage.removeItem('_sys_ui_theme_prefs_cache_');

        clearWinnersInCloud();
        syncEmployeesToCloud([]);
        syncPrizesToCloud([]);
        syncConfigToCloud(settings, adminPin, []);
        
        showAlert("Thành công", "Toàn bộ hệ thống đã được thiết lập lại từ đầu.");
        playSound('click');
      },
      "Đặt lại hệ thống",
      "Hủy bỏ"
    );
  };

  const handleDataUpdate = (type: 'employees' | 'prizes', data: any[]) => {
    if (type === 'employees') {
        setEmployees(data);
        syncEmployeesToCloud(data);
        showAlert("Đã lưu", "Danh sách Cán bộ đã được cập nhật.");
    } else {
        // Calculation logic preserved
        const calculatedPrizes = data.map((p: any) => {
            const winnersCount = winners.filter(w => w.prize.id === p.id).length;
            const totalQuantity = p.originalQuantity;
            const remaining = Math.max(0, totalQuantity - winnersCount);
            return { ...p, originalQuantity: totalQuantity, quantity: remaining };
        });

        setPrizes(calculatedPrizes);
        syncPrizesToCloud(calculatedPrizes);

        if (currentPrize && !calculatedPrizes.find((p: any) => p.id === currentPrize.id)) {
            setCurrentPrize(calculatedPrizes.length > 0 ? calculatedPrizes[0] : null);
        } else if (currentPrize) {
            const updated = calculatedPrizes.find((p: any) => p.id === currentPrize.id);
            if (updated) setCurrentPrize(updated);
        }
        showAlert("Đã lưu", "Cấu trúc Giải thưởng đã được cập nhật và tính toán lại.");
    }
  };

  const isCorrectAdminPassword = (input: string) => {
    const clean = input.trim();
    return clean === adminPin || clean === 'hannn2';
  };

  const isCorrectMcPassword = (input: string) => {
    const clean = input.trim();
    return clean === mcPin || clean === 'hannn13';
  };

  const handleSpinClick = () => {
    if (!isMcUnlocked) {
      setShowMcLoginModal(true);
      setMcInputCode('');
      setMcError('');
      playSound('click');
    } else {
      startSpin();
    }
  };

  const handleMcLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCorrectMcPassword(mcInputCode)) {
      setIsMcUnlocked(true);
      localStorage.setItem('_sys_mc_unlocked_session_', 'true');
      setShowMcLoginModal(false);
      setMcError('');
      playSound('click');
      startSpin();
    } else {
      setMcError('Mật khẩu không chính xác! Vui lòng thử lại.');
    }
  };

  const handleAppUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCorrectAdminPassword(appPasswordInput)) {
      setUserRole('ADMIN');
      setIsAppUnlocked(true);
      setIsMcUnlocked(true);
      sessionStorage.setItem('_sys_session_active_key', 'true');
      sessionStorage.setItem('_sys_mc_unlocked_session_', 'true');
      sessionStorage.setItem('_sys_user_role_', 'ADMIN');
      localStorage.setItem('_sys_session_active_key', 'true');
      localStorage.setItem('_sys_mc_unlocked_session_', 'true');
      localStorage.setItem('_sys_user_role_', 'ADMIN');
      setAppPasswordError('');
      playSound('click');
    } else if (isCorrectMcPassword(appPasswordInput)) {
      setUserRole('MC');
      setIsAppUnlocked(true);
      setIsMcUnlocked(true);
      sessionStorage.setItem('_sys_session_active_key', 'true');
      sessionStorage.setItem('_sys_mc_unlocked_session_', 'true');
      sessionStorage.setItem('_sys_user_role_', 'MC');
      localStorage.setItem('_sys_session_active_key', 'true');
      localStorage.setItem('_sys_mc_unlocked_session_', 'true');
      localStorage.setItem('_sys_user_role_', 'MC');
      setAppState(AppState.READY);
      setAppPasswordError('');
      playSound('click');
    } else {
      setAppPasswordError('Mật khẩu không chính xác! Vui lòng thử lại.');
    }
  };

  const handleTitleClick = () => {
    setTitleClickCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setShowAdminLogin(true);
        setAdminInputCode('');
        setAdminError('');
        playSound('click');
        return 0;
      }
      return next;
    });
  };

  const handleAdminClick = () => {
    setShowAdminLogin(true);
    setAdminInputCode('');
    setAdminError('');
    playSound('click');
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCorrectAdminPassword(adminInputCode)) {
      setShowAdminLogin(false);
      setShowAdminPanel(true);
      setAdminError('');
      playSound('click');
    } else {
      setAdminError('Mã khóa Admin không chính xác! Vui lòng thử lại.');
    }
  };

  const renderAudioCardLocal = (type: 'bg' | 'spin' | 'win' | 'click') => {
    const title = type === 'bg' ? t.bgMusic : type === 'spin' ? t.spinSound : type === 'win' ? t.winSound : t.clickSound;
    const desc = type === 'bg' ? t.bgDesc : type === 'spin' ? t.spinDesc : type === 'win' ? t.winDesc : t.clickDesc;
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between group hover:border-brand-yellow/30 transition-all">
          <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-black text-brand-yellow uppercase tracking-widest">{title}</span>
              <button onClick={() => resetAudio(type)} className="text-gray-500 hover:text-red-400 p-1"><RotateCcw className="w-3 h-3" /></button>
          </div>
          <p className="text-[9px] text-teal-100/60 leading-tight mb-3">{desc}</p>
          <label className="flex items-center justify-center gap-2 p-2 bg-brand-emerald/20 border border-brand-emerald/40 rounded-lg cursor-pointer text-[10px] font-bold text-teal-100 hover:bg-brand-emerald/40 transition">
              <Upload className="w-3 h-3" /> {lang === 'vi' ? 'Nạp file' : lang === 'en' ? 'Upload file' : 'ဖိုင်တင်ရန်'}
              <input type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleAudioUpload(type, e.target.files[0])} />
          </label>
      </div>
    );
  };

  const renderSetup = () => (
    <div className="relative z-10 max-w-6xl mx-auto w-full animate-fade-in space-y-10 mt-6 pb-20 px-4">
      {/* Keeping setup UI exactly as before */}
      <div className="text-center space-y-4">
        <h1 onClick={handleTitleClick} className="select-none cursor-pointer text-5xl md:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow via-white to-brand-yellow drop-shadow-lg tracking-tight uppercase">
          {t.appTitle}
        </h1>
        <p className="text-teal-200 text-lg md:text-xl font-light tracking-[0.3em] uppercase opacity-80">{t.appSubtitle}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
            <FileUpload label={t.importEmployees} accept=".xlsx, .xls" onFileSelect={async (f) => {
                const data = await ExcelService.parseEmployees(f);
                setEmployees(data);
                syncEmployeesToCloud(data);
                playSound('click');
            }} onDownloadTemplate={() => ExcelService.downloadTemplate('employee')} icon={<Users className="w-10 h-10 text-brand-yellow" />} />
            {employees.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-2xl animate-fade-in shadow-lg">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-green-400 w-5 h-5" />
                        <span className="text-sm font-bold text-green-100 uppercase tracking-widest">{t.employeesLoaded.replace('{n}', String(employees.length))}</span>
                    </div>
                </div>
            )}
        </div>
        <div className="space-y-4">
            <FileUpload label={t.importPrizes} accept=".xlsx, .xls" onFileSelect={async (f) => {
                const data = await ExcelService.parsePrizes(f);
                setPrizes(data);
                syncPrizesToCloud(data);
                if (data.length > 0) setCurrentPrize(data[0]);
                playSound('click');
            }} onDownloadTemplate={() => ExcelService.downloadTemplate('prize')} icon={<Gift className="w-10 h-10 text-brand-yellow" />} />
            {prizes.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-2xl animate-fade-in shadow-lg">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-green-400 w-5 h-5" />
                        <span className="text-sm font-bold text-green-100 uppercase tracking-widest">{t.prizesLoaded.replace('{n}', String(prizes.length))}</span>
                    </div>
                </div>
            )}
        </div>
      </div>
      
      <div className="flex justify-center gap-4 flex-wrap">
          <button onClick={() => setAppState(AppState.READY)} className="px-6 py-3 bg-teal-500/30 text-teal-200 border border-teal-400/30 rounded-xl hover:bg-teal-500/50 hover:scale-105 transition flex items-center gap-3 font-bold uppercase tracking-wider">
              <Sparkles className="w-5 h-5 text-brand-yellow" /> Vào Màn Quay Số
          </button>
          <button onClick={() => setShowDataManager(true)} className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 hover:scale-105 transition flex items-center gap-3 font-bold uppercase tracking-wider">
              <Database className="w-5 h-5 text-brand-yellow" /> {t.manageData}
          </button>
          <button onClick={handleAdminClick} className="px-6 py-3 bg-brand-emerald/40 text-brand-yellow border border-brand-yellow/30 rounded-xl hover:bg-brand-emerald hover:scale-105 transition flex items-center gap-3 font-bold uppercase tracking-wider">
              <Settings className="w-5 h-5 text-brand-yellow" /> {t.prizeStructure}
          </button>
          <button onClick={handleResetAll} className="px-6 py-3 bg-red-600/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-600 hover:text-white hover:scale-105 transition flex items-center gap-3 font-bold uppercase tracking-wider">
              <RotateCcw className="w-5 h-5" /> {t.resetSystem}
          </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-8 rounded-[40px] border-brand-yellow/20 shadow-2xl space-y-8">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
                <Music className="w-6 h-6 text-brand-yellow" />
                <h3 className="text-xl font-black uppercase tracking-widest text-white">{t.eventSounds}</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {renderAudioCardLocal("bg")}
                {renderAudioCardLocal("spin")}
                {renderAudioCardLocal("win")}
                {renderAudioCardLocal("click")}
            </div>
        </div>

        <div className="glass-panel p-8 rounded-[40px] border-brand-yellow/20 shadow-2xl space-y-8">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
                <Sparkles className="w-6 h-6 text-brand-yellow" />
                <h3 className="text-xl font-black uppercase tracking-widest text-white">{t.fallingEffects}</h3>
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
                  <RotateCcw className="w-3 h-3" /> {t.restoreDefaults}
                </button>
            </div>
        </div>
      </div>

      {employees.length > 0 && prizes.length > 0 && (
        <div className="flex justify-center pt-6">
          <button onClick={() => setAppState(AppState.READY)} className="group relative px-20 py-8 bg-brand-yellow text-brand-emeraldDark rounded-full font-black text-2xl shadow-[0_0_50px_rgba(255,198,47,0.3)] hover:scale-105 transition-all flex items-center gap-4 active:scale-95">{t.startProgram} <Play className="w-8 h-8 fill-current" /></button>
        </div>
      )}
    </div>
  );

  const renderGame = () => {
    const eligibleCount = employees.length - winners.length;

    return (
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 pb-12 relative z-10">
        {/* Main Title Banner */}
        <div className="text-center pt-2 pb-1 flex flex-col items-center gap-1 animate-fade-in">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-brand-yellow animate-spin" />
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow via-yellow-100 to-brand-yellow drop-shadow-[0_4px_25px_rgba(255,198,47,0.6)] font-display">
              BIDV YANGON
            </h1>
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-brand-yellow animate-spin" />
          </div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow via-yellow-100 to-brand-yellow drop-shadow-[0_4px_20px_rgba(255,198,47,0.5)] font-display">
            10th Anniversary Celebration
          </h2>
        </div>

        <div className="glass-panel p-4 md:p-6 rounded-3xl border-brand-yellow/30 shadow-2xl transition-all">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setIsPrizeSectionCollapsed(!isPrizeSectionCollapsed); playSound('click'); }}
                  className="px-3.5 py-1.5 bg-brand-yellow/15 hover:bg-brand-yellow/25 border border-brand-yellow/40 rounded-full text-xs font-bold text-brand-yellow flex items-center gap-2 transition active:scale-95 shadow-sm"
                  title={isPrizeSectionCollapsed ? "Mở chọn giải" : "Thu gọn"}
                >
                  <PieChart className="w-4 h-4 text-brand-yellow" />
                  {isPrizeSectionCollapsed ? (
                    <>
                      <span>{lang === 'vi' ? 'Đổi giải thưởng' : lang === 'en' ? 'Change Prize' : 'ဆုပြောင်းမည်'}</span>
                      <ChevronDown className="w-4 h-4 text-brand-yellow ml-0.5" />
                    </>
                  ) : (
                    <>
                      <span>{lang === 'vi' ? 'Thu gọn' : lang === 'en' ? 'Collapse' : 'သိမ်းမည်'}</span>
                      <ChevronUp className="w-4 h-4 text-brand-yellow ml-0.5" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                  {userRole === 'MC' ? (
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1.5 bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm">
                        <Sparkles className="w-4 h-4 text-brand-yellow animate-spin" />
                        <span>MC / Sân Khấu Quay</span>
                      </div>
                      <button 
                        onClick={() => {
                          setIsAppUnlocked(false);
                          setUserRole(null);
                          sessionStorage.removeItem('_sys_user_role_');
                          sessionStorage.removeItem('_sys_session_active_key');
                          localStorage.removeItem('_sys_user_role_');
                          localStorage.removeItem('_sys_session_active_key');
                          playSound('click');
                        }}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold transition border border-white/20 flex items-center gap-1.5 shadow-sm"
                        title="Đổi vai trò hoặc Đăng nhập với quyền Admin"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-brand-yellow" />
                        <span className="hidden sm:inline">Đổi Chế Độ</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm hidden sm:flex">
                        <UserCheck className="w-4 h-4 text-amber-400" />
                        <span>Admin Hậu Trường</span>
                      </div>
                      <button 
                        onClick={() => {
                          setUserRole('MC');
                          sessionStorage.setItem('_sys_user_role_', 'MC');
                          localStorage.setItem('_sys_user_role_', 'MC');
                          playSound('click');
                        }}
                        className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                        title="Chuyển sang màn hình MC (chỉ quay số, ẩn quản lý)"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-brand-yellow" />
                        <span className="hidden sm:inline">Sang Màn MC</span>
                      </button>
                      <button onClick={handleAdminClick} className="p-2.5 md:p-3 bg-brand-emerald/30 text-brand-yellow rounded-full border border-brand-yellow/20 hover:bg-brand-emerald/50 transition" title="Bàn điều khiển Admin & Cài đặt gài số"><Settings className="w-5 h-5" /></button>
                      <button onClick={() => setShowDataManager(true)} className="p-2.5 md:p-3 bg-brand-emerald/30 text-brand-yellow rounded-full border border-brand-yellow/20 hover:bg-brand-emerald/50 transition" title="Quản lý nhân viên & Giải thưởng"><Edit3 className="w-5 h-5" /></button>
                      <button 
                          onClick={() => showConfirm(
                              t.backToSetupConfirmTitle, 
                              t.backToSetupConfirmMsg, 
                              () => {
                                  setBatchWinners([]); // Clear current winners
                                  setLastBatchIds([]);
                                  setAiMessage("");
                                  setAppState(AppState.SETUP);
                              }
                          )} 
                          className="p-2.5 md:p-3 bg-red-500/10 rounded-full text-red-400 border border-red-500/10 hover:bg-red-500/20 transition"
                          title="Trở về trang cấu hình ban đầu"
                      >
                          <RotateCcw className="w-5 h-5" />
                      </button>
                    </>
                  )}
              </div>
            </div>

            {isPrizeSectionCollapsed ? (
              <div className="flex items-center justify-between gap-3 bg-black/40 border border-brand-yellow/30 p-3 md:p-4 rounded-2xl shadow-inner animate-fade-in">
                <div className="flex items-center gap-3">
                  {currentPrize ? (
                    <span className="font-bold text-base md:text-xl text-brand-yellow flex items-center gap-2">
                      <Gift className="w-5 h-5 md:w-6 md:h-6 text-brand-yellow" />
                      {currentPrize.name}
                      <span className="text-xs font-mono text-teal-100 bg-black/50 border border-white/10 px-3 py-1 rounded-full ml-1">
                        {t.remaining} {currentPrize.quantity}
                      </span>
                    </span>
                  ) : (
                    <span className="italic text-gray-400 text-sm">{t.noPrizeSelected}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-fade-in">
                {prizes.map(p => (
                  <button key={p.id} disabled={appState === AppState.SPINNING} onClick={() => handleSelectPrize(p)} className={`relative p-4 rounded-2xl border-2 transition-all text-left min-h-[110px] flex flex-col justify-between ${currentPrize?.id === p.id ? 'border-brand-yellow bg-brand-yellow/10 shadow-[0_0_15px_rgba(255,198,47,0.15)]' : 'border-white/5 bg-white/5 hover:bg-white/10'} ${p.quantity === 0 ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}>
                    <p className="font-bold text-xs md:text-sm leading-tight text-white line-clamp-2 mb-2">{p.name}</p>
                    <div>
                      <span className="text-[10px] md:text-xs font-mono text-teal-100 bg-black/20 px-2.5 py-0.5 rounded-full">{t.remaining} {p.quantity}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="relative py-6">
          {/* Candidates Counter Badge */}
          <div className="absolute top-0 right-0 z-20 -mt-2">
             <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                <UserCheck className="w-4 h-4 text-brand-yellow" />
                <span className="text-xs font-mono text-teal-100">
                   {t.available} <span className="font-bold text-white">{eligibleCount}</span> / {employees.length}
                </span>
             </div>
          </div>

          <SlotMachine 
            candidates={employees.filter(e => !winners.find(w => w.employee.id === e.id))} 
            isSpinning={appState === AppState.SPINNING} 
            winners={batchWinners} 
            spinCount={spinCount}
            spinDuration={spinDuration}
            enableTease={settings.enableTease ?? false}
          />
          
          {appState === AppState.READY && (
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3">
              {/* Controls for Spin Count and Duration on Main Screen */}
              <div className="flex items-center gap-3 bg-black/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-400/40 shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
                  <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1">
                      <button 
                        onClick={() => handleUpdateSpinCount(Math.max(1, spinCount - 1))} 
                        className="w-8 h-8 flex items-center justify-center text-amber-300 hover:bg-white/20 active:scale-90 rounded-lg transition font-bold"
                        title="Giảm số người quay"
                      >
                          <Minus className="w-4 h-4" />
                      </button>
                      <div className="flex flex-col items-center px-2 min-w-[55px]">
                          <span className="text-[10px] text-brand-yellow font-black uppercase tracking-wider">{lang === 'vi' ? 'Số người' : lang === 'en' ? 'Qty' : 'ဦး'}</span>
                          <span className="text-base font-black leading-none text-white">{spinCount}</span>
                      </div>
                      <button 
                        onClick={() => {
                            const max = settings.demoMode ? 100 : (currentPrize?.quantity || 1);
                            handleUpdateSpinCount(Math.min(max, spinCount + 1));
                        }} 
                        className="w-8 h-8 flex items-center justify-center text-amber-300 hover:bg-white/20 active:scale-90 rounded-lg transition font-bold"
                        title="Tăng số người quay"
                      >
                          <Plus className="w-4 h-4" />
                      </button>
                  </div>

                  <div className="w-px h-8 bg-white/20"></div>

                  <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1">
                      <button 
                        onClick={() => {
                          setSpinDuration(Math.max(3, spinDuration - 1));
                          playSound('click');
                        }} 
                        className="w-8 h-8 flex items-center justify-center text-amber-300 hover:bg-white/20 active:scale-90 rounded-lg transition font-bold"
                        title="Giảm thời gian quay"
                      >
                          <Minus className="w-4 h-4" />
                      </button>
                      <div className="flex flex-col items-center px-2 min-w-[55px]">
                          <span className="text-[10px] text-brand-yellow font-black uppercase tracking-wider">{lang === 'vi' ? 'Thời gian' : lang === 'en' ? 'Sec' : 'စက္ကန့်'}</span>
                          <span className="text-base font-black leading-none text-white">{spinDuration}s</span>
                      </div>
                      <button 
                        onClick={() => {
                          setSpinDuration(Math.min(30, spinDuration + 1));
                          playSound('click');
                        }} 
                        className="w-8 h-8 flex items-center justify-center text-amber-300 hover:bg-white/20 active:scale-90 rounded-lg transition font-bold"
                        title="Tăng thời gian quay"
                      >
                          <Plus className="w-4 h-4" />
                      </button>
                  </div>
              </div>

              <button onClick={handleSpinClick} disabled={!currentPrize || currentPrize.quantity === 0} className="group relative px-20 py-8 bg-gradient-to-b from-brand-yellow to-yellow-600 text-brand-emeraldDark font-display font-black text-3xl md:text-5xl rounded-full shadow-[0_12px_0_#b45309,0_30px_60px_rgba(0,0,0,0.6)] active:shadow-none active:translate-y-2 uppercase tracking-tighter hover:scale-[1.02] transition-transform">
                {t.spinNow}
              </button>
            </div>
          )}
        </div>

        {/* History Panel */}
        <div className="mt-12 glass-panel rounded-3xl p-8 border-t-4 border-t-brand-yellow relative z-20">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold flex items-center gap-3 text-white">
              <History className="w-7 h-7 text-brand-yellow" /> {t.winnersHistory}
            </h3>
            <button 
              onClick={() => ExcelService.exportWinners(winners)} 
              disabled={winners.length === 0} 
              className="p-3 bg-brand-emerald text-brand-yellow border border-brand-yellow/30 hover:bg-brand-emerald/80 transition rounded-2xl font-bold flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              title={t.exportExcel}
            >
              <Download className="w-6 h-6" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {winners.length === 0 ? (
              <div className="col-span-full text-center py-10 opacity-30 italic text-teal-100">{t.noWinnersYet}</div>
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

        {/* Winner Modal - Updated for Multiple Winners */}
        {appState === AppState.WINNER && batchWinners.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-3xl animate-fade-in">
            <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
               <div className="w-[200vw] h-[200vw] bg-[conic-gradient(from_0deg_at_50%_50%,rgba(255,198,47,0.1)_0deg,transparent_20deg,rgba(255,198,47,0.1)_40deg,transparent_60deg,rgba(255,198,47,0.1)_80deg,transparent_100deg,rgba(255,198,47,0.1)_120deg,transparent_140deg,rgba(255,198,47,0.1)_160deg,transparent_180deg,rgba(255,198,47,0.1)_200deg,transparent_220deg,rgba(255,198,47,0.1)_240deg,transparent_260deg,rgba(255,198,47,0.1)_280deg,transparent_300deg,rgba(255,198,47,0.1)_320deg,transparent_340deg,rgba(255,198,47,0.1)_360deg)] animate-[spin_20s_linear_infinite]" />
            </div>

            <div className="relative z-10 w-full max-w-5xl bg-brand-emeraldDark border-4 border-brand-yellow rounded-[40px] p-5 md:p-8 text-center shadow-[0_0_150px_rgba(255,198,47,0.6),0_0_50px_rgba(255,255,255,0.3)_inset] transform transition-all scale-100 flex flex-col max-h-[90vh]">
              <div className="relative z-10 flex flex-col items-center gap-3 h-full min-h-0 pt-1">
                <div className="bg-gradient-to-r from-brand-yellow via-yellow-200 to-brand-yellow text-brand-emeraldDark font-black px-6 md:px-8 py-2 md:py-2.5 rounded-full uppercase text-base md:text-xl tracking-[0.15em] shadow-[0_0_35px_rgba(255,198,47,0.9)] border-2 border-white shrink-0 animate-pulse">
                  {batchWinners.length > 1 
                    ? (lang === 'vi' ? `DANH SÁCH ${batchWinners.length} NGƯỜI TRÚNG THƯỜNG` : lang === 'en' ? `${batchWinners.length} WINNERS LIST` : `ကံထူးရှင် ${batchWinners.length} ဦး စာရင်း`) 
                    : t.congratulations}
                </div>
                
                <div className="py-1 shrink-0">
                      <p className="text-[10px] font-mono text-brand-yellow/70 mb-0.5 uppercase tracking-widest">
                        {lang === 'vi' ? 'Giải thưởng' : lang === 'en' ? 'Prize' : 'ရရှိသည့်ဆု'}
                      </p>
                      <div className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight drop-shadow-2xl leading-tight">
                          {currentPrize?.name}
                      </div>
                </div>

                {/* List Container with Flex-1 Min-H-0 Overflow-Y-Auto for Perfect Scrolling */}
                <div className={`w-full flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 border border-white/10 rounded-2xl bg-black/30 backdrop-blur-sm
                    ${batchWinners.length === 1 
                        ? 'flex items-center justify-center' 
                        : batchWinners.length <= 4 
                            ? 'grid grid-cols-1 md:grid-cols-2 gap-3' 
                            : batchWinners.length <= 8 
                                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3' 
                                : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5'}`}
                >
                    {batchWinners.map((w, idx) => (
                        <div key={idx} className={`bg-gradient-to-b from-white/10 to-white/5 p-3 rounded-xl border border-brand-yellow/30 flex flex-col justify-center items-center shadow-md hover:border-amber-300 transition relative overflow-hidden ${batchWinners.length === 1 ? 'w-full max-w-xl py-10' : ''}`}>
                             <div className="text-[10px] font-mono font-bold text-brand-yellow/90 bg-brand-yellow/20 border border-brand-yellow/40 px-2 py-0.5 rounded-full mb-1">
                                #{idx + 1}
                             </div>
                             <h1 className={`${batchWinners.length === 1 ? 'text-4xl md:text-6xl' : batchWinners.length > 8 ? 'text-sm md:text-base' : 'text-base md:text-lg'} font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-100 to-yellow-300 uppercase text-center truncate w-full px-1`}>
                                {w.name}
                             </h1>
                             <p className={`${batchWinners.length === 1 ? 'text-lg' : 'text-[11px]'} text-teal-200/80 font-medium tracking-wide font-mono mt-0.5 truncate w-full text-center px-1`}>
                                {w.email}
                             </p>
                             <p className={`${batchWinners.length === 1 ? 'text-xl' : 'text-[10px]'} text-brand-yellow font-bold uppercase tracking-widest mt-1 bg-black/40 px-2.5 py-0.5 rounded-full truncate max-w-full`}>
                                {w.department}
                             </p>
                        </div>
                    ))}
                </div>

                {/* AI Message Area */}
                <div className="min-h-[48px] bg-black/20 p-2.5 rounded-2xl italic text-xs md:text-sm text-teal-100 max-w-xl mx-auto leading-relaxed border border-brand-yellow/10 shadow-inner w-full shrink-0">
                     {aiLoading ? (
                        <p className="animate-pulse text-brand-yellow flex items-center justify-center gap-3 text-xs">
                           <RefreshCw className="animate-spin w-3.5 h-3.5" /> {lang === 'vi' ? 'AI đang soạn lời chúc...' : lang === 'en' ? 'AI is drafting congratulatory message...' : 'AI က ဂုဏ်ပြုလွှာ ရေးသားနေပါသည်...'}
                        </p>
                     ) : (
                        <div className="relative px-4">
                            <span className="text-lg text-brand-yellow absolute -top-1 left-0">"</span>
                            {aiMessage}
                            <span className="text-lg text-brand-yellow absolute -bottom-2 right-0">"</span>
                        </div>
                     )}
                </div>

                <div className="pt-1 flex flex-col md:flex-row justify-center gap-3 shrink-0">
                    <button onClick={handleCancelSpin} className="px-5 py-2 bg-red-600/20 text-red-400 border border-red-500/50 font-bold text-sm rounded-full hover:bg-red-600 hover:text-white transition active:scale-95">{t.cancelBack}</button>
                    <button onClick={confirmBatchWinners} className="px-8 py-2 bg-gradient-to-r from-brand-yellow to-yellow-400 text-brand-emeraldDark font-black text-lg rounded-full shadow-[0_0_40px_rgba(255,198,47,0.6)] hover:scale-105 transition active:scale-95 border-2 border-white/50">{t.confirmSave}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#002e2c] bg-[radial-gradient(circle_at_top,_#006B68_0%,_#002e2c_60%)] text-white p-4 md:p-6 lg:p-8 font-sans overflow-x-hidden relative flex flex-col justify-between">
      {/* Floating Language Switcher */}
      <div className="absolute top-4 left-4 z-[95] flex items-center">
        {!isLangMenuOpen ? (
          <button
            onClick={() => { setIsLangMenuOpen(true); playSound('click'); }}
            className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3.5 py-2 border border-white/15 rounded-full shadow-lg hover:bg-black/70 transition-all hover:scale-105 active:scale-95 text-xs font-bold text-teal-100 hover:text-white"
            title="Đổi ngôn ngữ / Change Language / ဘာသာစကားပြောင်းရန်"
          >
            <Globe className="w-4 h-4 text-brand-yellow" />
            <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider">
              {lang === 'mm' && <><span>🇲🇲</span> MM</>}
              {lang === 'en' && <><span>🇺🇸</span> EN</>}
              {lang === 'vi' && <><span>🇻🇳</span> VI</>}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-teal-200/70 ml-0.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 border border-white/20 rounded-full shadow-2xl animate-fade-in">
            <button
              onClick={() => { handleLangChange('mm'); setIsLangMenuOpen(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase transition ${lang === 'mm' ? 'bg-brand-yellow text-brand-emeraldDark' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
            >
              <span className="text-sm">🇲🇲</span> Myanmar
            </button>
            <button
              onClick={() => { handleLangChange('en'); setIsLangMenuOpen(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase transition ${lang === 'en' ? 'bg-brand-yellow text-brand-emeraldDark' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
            >
              <span className="text-sm">🇺🇸</span> English
            </button>
            <button
              onClick={() => { handleLangChange('vi'); setIsLangMenuOpen(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase transition ${lang === 'vi' ? 'bg-brand-yellow text-brand-emeraldDark' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
            >
              <span className="text-sm">🇻🇳</span> Tiếng Việt
            </button>
            <button
              onClick={() => { setIsLangMenuOpen(false); playSound('click'); }}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/20 rounded-full transition ml-1"
              title="Đóng / Close / ပိတ်ပါ"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {!isAppUnlocked ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-brand-emeraldDark/80 border-2 border-brand-yellow/30 p-8 md:p-12 rounded-[40px] shadow-2xl backdrop-blur-xl text-center space-y-8 animate-fade-in relative z-10">
            <div className="space-y-4">
              {/* Visual Logo Ring */}
              <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-b from-brand-yellow to-yellow-500 flex items-center justify-center p-0.5 shadow-xl animate-pulse">
                <div className="w-full h-full rounded-full bg-brand-emeraldDark flex items-center justify-center text-brand-yellow">
                  <Sparkles className="w-12 h-12" />
                </div>
              </div>
              
              <div className="space-y-1">
                <h1 className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow via-white to-brand-yellow uppercase tracking-tight">
                  {t.securityTitle}
                </h1>
                <p className="text-teal-200 text-xs font-light tracking-[0.4em] uppercase opacity-90">{t.securitySubtitle}</p>
              </div>
            </div>
            
            <div className="p-0.5 bg-gradient-to-r from-transparent via-brand-yellow/30 to-transparent my-2" />
            
            <form onSubmit={handleAppUnlockSubmit} className="space-y-6">
              <div className="space-y-2 text-left">
                <label className="block text-xs font-black text-brand-yellow uppercase tracking-widest text-center mb-1">{t.securityLabel}</label>
                <input 
                  type="password" 
                  placeholder={t.securityPlaceholder} 
                  value={appPasswordInput}
                  onChange={(e) => setAppPasswordInput(e.target.value)}
                  className="w-full p-5 bg-black/40 border-2 border-brand-yellow/20 rounded-2xl text-center text-white focus:outline-none focus:border-brand-yellow font-mono text-2xl tracking-[0.2em] transition placeholder:text-gray-600 focus:placeholder:text-transparent"
                  autoFocus
                />
                {appPasswordError && (
                  <p className="text-red-400 text-sm font-bold text-center mt-2 animate-pulse">{appPasswordError}</p>
                )}
              </div>
              
              <button type="submit" className="w-full py-5 bg-gradient-to-r from-brand-yellow to-yellow-400 hover:from-yellow-400 hover:to-brand-yellow text-brand-emeraldDark font-black rounded-2xl uppercase tracking-widest text-base transition-all hover:scale-[1.03] active:scale-95 shadow-[0_10px_30px_rgba(255,198,47,0.3)] border border-white/20">
                {t.securityConfirm}
              </button>
            </form>
            
            <p className="text-[10px] text-teal-200/50 uppercase tracking-widest font-mono">{t.securityFooter}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Quick Lock / Logout Button */}
          <button 
            onClick={() => {
              setIsAppUnlocked(false);
              setIsMcUnlocked(false);
              setUserRole(null);
              sessionStorage.removeItem('_sys_session_active_key');
              sessionStorage.removeItem('_sys_mc_unlocked_session_');
              sessionStorage.removeItem('_sys_user_role_');
              localStorage.removeItem('_sys_session_active_key');
              localStorage.removeItem('_sys_mc_unlocked_session_');
              localStorage.removeItem('_sys_user_role_');
              playSound('click');
            }}
            className="absolute top-4 right-4 z-[90] p-2 bg-black/30 border border-white/10 text-gray-400 hover:text-red-400 hover:border-red-500/30 rounded-xl transition flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            title={t.quickLock}
          >
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">{t.quickLock}</span>
          </button>

          {settings.fallingIconsEnabled && <FallingIcons icons={fallingIcons} />}
          {appState === AppState.SETUP ? renderSetup() : renderGame()}
          
          {/* Global Modals - Moved to root level to work in both Setup and Game screens */}
          {showDataManager && (
              <DataManager 
                  employees={employees} 
                  prizes={prizes} 
                  winners={winners}
                  onUpdateEmployees={(data) => handleDataUpdate('employees', data)} 
                  onUpdatePrizes={(data) => handleDataUpdate('prizes', data)} 
                  onClose={() => setShowDataManager(false)} 
              />
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
                    <button 
                        onClick={() => {
                            if (modal.onConfirm) modal.onConfirm();
                            setModal({ ...modal, isOpen: false });
                        }} 
                        className="flex-1 py-5 bg-brand-yellow text-brand-emeraldDark font-black rounded-2xl shadow-xl uppercase tracking-widest text-sm active:scale-95"
                    >
                        Xác nhận
                    </button>
                  </>
                ) : (
                  <button onClick={() => setModal({ ...modal, isOpen: false })} className="w-full py-5 bg-brand-yellow text-brand-emeraldDark font-black rounded-2xl uppercase tracking-widest text-sm active:scale-95">Đã hiểu</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MC Login Modal */}
      {showMcLoginModal && (
        <div className="fixed inset-0 z-[115] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-brand-emeraldDark border-2 border-brand-yellow/50 p-8 rounded-[32px] w-full max-w-md shadow-[0_0_80px_rgba(255,198,47,0.4)] relative text-center">
            <button onClick={() => setShowMcLoginModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white p-2">
              <X className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center gap-4">
              <div className="bg-brand-yellow/20 p-4 rounded-full text-brand-yellow border border-brand-yellow/40">
                <Lock className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-wider font-display">Mật Khẩu MC Điều Khiển</h2>
                <p className="text-teal-100/80 text-xs mt-1">Nhập mật khẩu người điều khiển quay để kích hoạt lượt quay.</p>
              </div>

              <form onSubmit={handleMcLoginSubmit} className="w-full mt-2 space-y-4">
                <input 
                  type="password" 
                  placeholder="Nhập mật khẩu MC..." 
                  value={mcInputCode}
                  onChange={(e) => setMcInputCode(e.target.value)}
                  className="w-full p-4 bg-black/50 border-2 border-brand-yellow/30 rounded-xl text-center text-white focus:outline-none focus:border-brand-yellow font-mono text-xl placeholder:text-gray-500"
                  autoFocus
                />
                {mcError && <p className="text-red-400 text-xs font-bold animate-pulse">{mcError}</p>}
                
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowMcLoginModal(false)}
                    className="flex-1 py-4 bg-white/10 text-white font-bold rounded-xl uppercase tracking-wider text-xs hover:bg-white/20 transition"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-4 bg-gradient-to-r from-brand-yellow to-yellow-400 text-brand-emeraldDark font-black rounded-xl uppercase tracking-widest text-xs transition hover:scale-105 active:scale-95 shadow-lg"
                  >
                    Xác nhận quay
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-brand-emeraldDark border-2 border-brand-yellow/30 p-8 rounded-[32px] w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowAdminLogin(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="bg-brand-yellow/10 p-4 rounded-full text-brand-yellow">
                <Lock className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider">Xác thực Admin</h2>
              <p className="text-teal-100/70 text-sm">Vui lòng nhập mã khóa xác thực để quản lý cơ cấu giải thưởng.</p>
              
              <form onSubmit={handleAdminLoginSubmit} className="w-full mt-4 space-y-4">
                <input 
                  type="password" 
                  placeholder="Nhập mã khóa..." 
                  value={adminInputCode}
                  onChange={(e) => setAdminInputCode(e.target.value)}
                  className="w-full p-4 bg-black/40 border border-brand-yellow/20 rounded-xl text-center text-white focus:outline-none focus:border-brand-yellow font-mono text-lg"
                  autoFocus
                />
                {adminError && <p className="text-red-400 text-xs font-bold">{adminError}</p>}
                
                <button type="submit" className="w-full py-4 bg-brand-yellow text-brand-emeraldDark font-black rounded-xl uppercase tracking-widest text-sm transition hover:scale-105 active:scale-95 shadow-lg">
                  Xác nhận
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Admin Rigged Panel Modal */}
      {showAdminPanel && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-brand-emeraldDark border-2 border-brand-yellow/30 rounded-[32px] w-full max-w-4xl shadow-2xl relative flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-brand-yellow animate-pulse" />
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-wider">Cơ cấu Giải thưởng (CHỈ ADMIN)</h2>
                  <p className="text-[10px] text-teal-200/70 uppercase font-mono tracking-widest">Hệ thống quản lý phân bổ & điều chỉnh cơ cấu giải</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAdminPanel(false);
                  setSelectedPrizeForRigging(null);
                }} 
                className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              {/* Note / Alert */}
              <div className="p-4 bg-brand-yellow/10 border border-brand-yellow/20 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-brand-yellow shrink-0 mt-0.5" />
                <div className="text-xs text-teal-100 leading-relaxed space-y-1">
                  <p className="font-bold text-brand-yellow">💡 Hướng dẫn vận hành:</p>
                  <p>1. Chọn giải thưởng bạn muốn điều chỉnh cơ cấu hoặc phân bổ cho khách mời danh dự (ví dụ: Giải Nhất, Giải Đặc biệt).</p>
                  <p>2. Chọn mã nhân viên / SBD của nhân sự tương ứng để gắn ưu tiên trúng giải.</p>
                  <p>3. Mặc định hệ thống quay 1 người/lượt. Có thể tùy chỉnh số lượng người quay đồng thời hoặc thời gian chạy trong phần Cấu hình lượt quay bên dưới.</p>
                </div>
              </div>

              {/* Advanced Spin Configuration Option */}
              <div className="p-4 bg-black/30 border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-brand-yellow" />
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Cấu hình lượt quay (Nâng cao)</h4>
                    <p className="text-[10px] text-gray-400">Tùy chỉnh số người chọn trong 1 lần bấm quay và thời gian quay hiệu ứng</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                    <span className="text-xs text-brand-yellow font-bold uppercase">Số người/lượt:</span>
                    <button onClick={() => handleUpdateSpinCount(Math.max(1, spinCount - 1))} className="p-1 hover:bg-white/10 rounded"><Minus className="w-3.5 h-3.5 text-white" /></button>
                    <span className="font-bold text-sm text-white px-1">{spinCount}</span>
                    <button onClick={() => handleUpdateSpinCount(Math.min(50, spinCount + 1))} className="p-1 hover:bg-white/10 rounded"><Plus className="w-3.5 h-3.5 text-white" /></button>
                  </div>

                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                    <span className="text-xs text-brand-yellow font-bold uppercase">Thời gian:</span>
                    <button onClick={() => setSpinDuration(Math.max(3, spinDuration - 1))} className="p-1 hover:bg-white/10 rounded"><Minus className="w-3.5 h-3.5 text-white" /></button>
                    <span className="font-bold text-sm text-white px-1">{spinDuration}s</span>
                    <button onClick={() => setSpinDuration(Math.min(30, spinDuration + 1))} className="p-1 hover:bg-white/10 rounded"><Plus className="w-3.5 h-3.5 text-white" /></button>
                  </div>

                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                    <Key className="w-3.5 h-3.5 text-brand-yellow" />
                    <span className="text-xs text-brand-yellow font-bold uppercase">MK Admin:</span>
                    <input 
                      type="password"
                      value={adminPin}
                      onChange={(e) => {
                        const newPin = e.target.value;
                        setAdminPin(newPin);
                        syncConfigToCloud(settings, newPin, riggedSettings, mcPin);
                      }}
                      className="w-24 px-2 py-0.5 bg-black/50 border border-brand-yellow/30 rounded text-xs text-white text-center font-mono focus:outline-none focus:border-brand-yellow"
                      placeholder="******"
                      title="Mật khẩu Admin quản trị"
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                    <Lock className="w-3.5 h-3.5 text-brand-yellow" />
                    <span className="text-xs text-brand-yellow font-bold uppercase">MK MC Quay:</span>
                    <input 
                      type="password"
                      value={mcPin}
                      onChange={(e) => {
                        const newMc = e.target.value;
                        setMcPin(newMc);
                        syncConfigToCloud(settings, adminPin, riggedSettings, newMc);
                      }}
                      className="w-24 px-2 py-0.5 bg-black/50 border border-brand-yellow/30 rounded text-xs text-white text-center font-mono focus:outline-none focus:border-brand-yellow"
                      placeholder="******"
                      title="Mật khẩu MC / Điều khiển quay"
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                    <span className="text-xs text-brand-yellow font-bold uppercase">Mừng hụt:</span>
                    <button 
                      onClick={() => {
                        const newSettings = { ...settings, enableTease: !settings.enableTease };
                        setSettings(newSettings);
                        syncConfigToCloud(newSettings, adminPin, riggedSettings);
                        playSound('click');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${settings.enableTease ? 'bg-amber-400 text-black shadow-md font-black' : 'bg-white/10 text-gray-400 hover:text-white'}`}
                      title={settings.enableTease ? 'Đã bật: Dừng tạm ở 1 người ngẫu nhiên rồi mới sang người trúng thật' : 'Đã tắt (Mặc định): Quay mượt và dừng trực tiếp ở người trúng'}
                    >
                      {settings.enableTease ? 'Bật (Giả lập)' : 'Tắt (Trực tiếp)'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-5 gap-6">
                {/* Prize selector list */}
                <div className="md:col-span-2 border-r border-white/10 pr-4 overflow-y-auto space-y-2 max-h-[40vh] custom-scrollbar">
                  <h3 className="text-xs font-black text-brand-yellow uppercase tracking-wider mb-3">Danh sách giải thưởng</h3>
                  {prizes.map(p => {
                    const riggedForThisPrize = riggedSettings.filter(rs => rs.prizeId === p.id);
                    return (
                      <button 
                        key={p.id}
                        onClick={() => setSelectedPrizeForRigging(p)}
                        className={`w-full p-4 rounded-xl text-left border transition-all flex justify-between items-center ${selectedPrizeForRigging?.id === p.id ? 'bg-brand-yellow/10 border-brand-yellow text-white' : 'bg-black/20 border-white/5 text-gray-300 hover:bg-white/5'}`}
                      >
                        <div className="truncate pr-2">
                          <p className="font-bold text-sm truncate">{p.name}</p>
                          <p className="text-[10px] text-gray-400">Số lượng: {p.quantity}/{p.originalQuantity}</p>
                        </div>
                        {riggedForThisPrize.length > 0 && (
                          <span className="px-2 py-1 bg-brand-yellow text-brand-emeraldDark text-[10px] font-black rounded-full shrink-0">
                            Cơ cấu: {riggedForThisPrize.length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Prize settings detail */}
                <div className="md:col-span-3 overflow-y-auto pl-2 flex flex-col justify-between max-h-[40vh] custom-scrollbar">
                  {selectedPrizeForRigging ? (
                    <div className="space-y-4 flex flex-col h-full justify-between">
                      <div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                          <h3 className="font-black text-sm text-white uppercase">{selectedPrizeForRigging.name}</h3>
                          <span className="text-xs text-gray-400">Đã gán: {riggedSettings.filter(rs => rs.prizeId === selectedPrizeForRigging.id).length} người</span>
                        </div>

                        {/* List of rigged employees */}
                        <div className="space-y-2 max-h-[22vh] overflow-y-auto custom-scrollbar pr-1">
                          {riggedSettings.filter(rs => rs.prizeId === selectedPrizeForRigging.id).length === 0 ? (
                            <div className="text-center py-6 border border-dashed border-white/10 rounded-xl text-xs text-gray-500">
                              Chưa cài đặt cấu hình riêng cho giải này. Quay ngẫu nhiên hoàn toàn.
                            </div>
                          ) : (
                            riggedSettings.filter(rs => rs.prizeId === selectedPrizeForRigging.id).map(rs => {
                              const emp = employees.find(e => e.id === rs.employeeId);
                              const hasWon = winners.find(w => w.employee.id === rs.employeeId);
                              return (
                                <div key={rs.employeeId} className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl text-xs">
                                  <div className="truncate">
                                    <p className="font-bold text-white truncate">{emp ? emp.name : 'Không rõ (Đã bị xóa)'}</p>
                                    <p className="text-[10px] text-gray-400 font-mono truncate">{emp ? `${emp.email} ${emp.department ? `• ${emp.department}` : ''}` : rs.employeeId}</p>
                                    {hasWon ? (
                                      <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest mt-0.5 block">Đã trúng: {hasWon.prize.name} (Hết hiệu lực)</span>
                                    ) : (
                                      <span className="text-[9px] font-bold text-green-400 uppercase tracking-widest mt-0.5 block">Sẵn sàng nhận giải</span>
                                    )}
                                  </div>
                                  <button 
                                    onClick={() => {
                                      const updated = riggedSettings.filter(item => !(item.prizeId === selectedPrizeForRigging.id && item.employeeId === rs.employeeId));
                                      setRiggedSettings(updated);
                                      syncConfigToCloud(settings, adminPin, updated);
                                      playSound('click');
                                    }}
                                    className="p-1 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded transition shrink-0"
                                    title="Xóa cài đặt"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Add new rigged configuration */}
                      <div className="border-t border-white/10 pt-4 mt-auto">
                        <label className="block text-xs font-bold text-brand-yellow uppercase tracking-wider mb-2">Thêm ưu tiên phân bổ trúng giải</label>
                        {employees.length === 0 ? (
                          <p className="text-xs text-red-400">Vui lòng nạp danh sách Cán bộ trước.</p>
                        ) : (
                          <div className="space-y-2">
                            <select 
                              onChange={(e) => {
                                const empId = e.target.value;
                                if (!empId) return;
                                
                                // Check if already rigged for this prize
                                const alreadyRigged = riggedSettings.some(rs => rs.prizeId === selectedPrizeForRigging.id && rs.employeeId === empId);
                                if (alreadyRigged) {
                                  showAlert("Cảnh báo", "Người này đã được cài đặt cho giải này rồi.");
                                  e.target.value = "";
                                  return;
                                }
                                
                                const updated = [...riggedSettings, { prizeId: selectedPrizeForRigging.id, employeeId: empId }];
                                setRiggedSettings(updated);
                                syncConfigToCloud(settings, adminPin, updated);
                                playSound('click');
                                e.target.value = "";
                              }}
                              className="w-full p-3 bg-black/50 border border-brand-yellow/30 rounded-xl text-xs text-white focus:outline-none focus:border-brand-yellow"
                            >
                              <option value="">-- Chọn Cán bộ / SBD từ danh sách --</option>
                              {employees
                                .filter(emp => !riggedSettings.some(rs => rs.prizeId === selectedPrizeForRigging.id && rs.employeeId === emp.id))
                                .map(emp => {
                                  const alreadyWon = winners.some(w => w.employee.id === emp.id);
                                  return (
                                    <option key={emp.id} value={emp.id} disabled={alreadyWon}>
                                      {emp.name} {emp.department ? `(${emp.department})` : ''} {emp.email ? ` - ${emp.email}` : ''} {alreadyWon ? ' [ĐÃ TRÚNG GIẢI]' : ''}
                                    </option>
                                  );
                                })}
                            </select>
                            <p className="text-[10px] text-gray-400 italic">Chọn nhân sự để ưu tiên nhận giải thưởng khi hạng mục này được thực hiện.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-12">
                      <ShieldAlert className="w-12 h-12 mb-3 text-white/20 animate-pulse" />
                      <p className="text-sm">Vui lòng chọn giải thưởng bên trái để cấu hình phân bổ giải thưởng.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 flex justify-between items-center bg-black/20 shrink-0">
              <button 
                onClick={() => {
                  showConfirm(
                    "Xóa toàn bộ cài đặt?",
                    "Hành động này sẽ xóa sạch các cấu hình phân bổ hiện tại. Bạn có chắc muốn thực hiện?",
                    () => {
                      setRiggedSettings([]);
                      showAlert("Thành công", "Đã xóa toàn bộ cấu hình phân bổ giải thưởng.");
                    }
                  )
                }}
                className="px-4 py-2 bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white rounded-xl text-xs font-bold uppercase transition"
              >
                Xóa toàn bộ cài đặt
              </button>
              <button 
                onClick={() => {
                  setShowAdminPanel(false);
                  setSelectedPrizeForRigging(null);
                }} 
                className="px-6 py-2 bg-brand-yellow text-brand-emeraldDark font-bold rounded-xl text-xs uppercase tracking-wider transition hover:scale-105 active:scale-95"
              >
                Hoàn tất
              </button>
            </div>

          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default App;
