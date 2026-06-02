import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Mic, 
  Send, 
  Plus, 
  ChevronLeft, 
  User, 
  UserCheck, 
  Play, 
  Pause, 
  WifiOff, 
  CheckCheck, 
  Smile, 
  Paperclip,
  Radio,
  Users,
  Check,
  Database,
  Search,
  Terminal,
  Trash2,
  X,
  Code,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SQLiteEngine, SQLiteUser, SQLiteGroup, SQLiteMessage, SQLLogEntry } from './SQLiteDB';

interface ChatTabProps {
  peers: any[];
  showToast: (msg: string, type?: 'success' | 'info' | 'warn') => void;
}

export default function ChatTab({ peers, showToast }: ChatTabProps) {
  // --- Initialize and Synchronize with SQLite Local DB Engine ---
  useEffect(() => {
    SQLiteEngine.bootstrap();
    syncLocalState();
    
    // Listen for custom SQLite transaction updates to refresh UI live
    const handleSqlUpdate = () => {
      syncLocalState();
    };
    window.addEventListener('sqlite_query_log_updated', handleSqlUpdate);
    return () => {
      window.removeEventListener('sqlite_query_log_updated', handleSqlUpdate);
    };
  }, []);

  const [activeUser, setActiveUser] = useState<SQLiteUser | null>(null);
  const [groups, setGroups] = useState<SQLiteGroup[]>([]);
  const [messages, setMessages] = useState<SQLiteMessage[]>([]);
  const [sqlLogs, setSqlLogs] = useState<SQLLogEntry[]>([]);
  
  // --- UI Layout and Form State ---
  const [activeGroupId, setActiveGroupId] = useState<string>('g-classroom');
  const [searchQuery, setSearchQuery] = useState('');
  const [threadSearch, setThreadSearch] = useState('');
  
  // Mobile column view ('list' vs 'chat')
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  
  // Registration Dialog Form State
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPhone, setRegisterPhone] = useState('LMS-' + Math.floor(Math.random() * 8999 + 1000));
  const [registerColor, setRegisterColor] = useState('#0ea5e9');
  const [showRegModal, setShowRegModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [lmsEmail, setLmsEmail] = useState('');
  const [lmsPassword, setLmsPassword] = useState('');
  const [registerAcademicUnit, setRegisterAcademicUnit] = useState('Computer Science Dept');
  
  // Group Creator Form State
  const [showGroupCreator, setShowGroupCreator] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('MessageSquare');
  
  // Interactive SQLite Terminal Console Drawer State
  const [showTerminal, setShowTerminal] = useState(false);
  const [customSQL, setCustomSQL] = useState('');
  const [terminalResult, setTerminalResult] = useState<any[] | null>(null);
  const [terminalError, setTerminalError] = useState<string | null>(null);

  // Chat input and voice recording state
  const [inputVal, setInputVal] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<Record<string, number>>({});
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playbackIntervalRef = useRef<Record<string, NodeJS.Timeout>>({});
  const audioContextRef = useRef<AudioContext | null>(null);

  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];

  const syncLocalState = () => {
    const user = SQLiteEngine.getActiveUser();
    const allGroups = SQLiteEngine.getGroups();
    const currentMsgs = SQLiteEngine.getMessages(activeGroupId || 'g-classroom');
    const logs = SQLiteEngine.getLogs();

    setActiveUser(user);
    setGroups(allGroups);
    setMessages(currentMsgs);
    setSqlLogs(logs);
  };

  // Switch Active Chat thread room
  const handleSelectGroup = (groupId: string) => {
    setActiveGroupId(groupId);
    setMobileView('chat');
    
    // Fetch newly activated group messages
    setTimeout(() => {
      const msgs = SQLiteEngine.getMessages(groupId);
      setMessages(msgs);
      scrollToBottom();
    }, 50);
  };

  // --- Autoscroll on messages changed ---
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeGroupId]);

  // --- REGISTRATION / AUTH SUBMISSION ---
  const handleUserRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerUsername.trim()) {
      showToast("Full Name cannot be empty", "warn");
      return;
    }
    if (!lmsEmail.trim() || !lmsEmail.includes('@')) {
      showToast("Please enter a valid school email address", "warn");
      return;
    }
    if (!lmsPassword || lmsPassword.length < 4) {
      showToast("Password must be at least 4 characters long", "warn");
      return;
    }

    const firstWord = registerUsername.trim().split(' ')[0];
    const secondWord = registerUsername.trim().split(' ')[1] || '';
    const badge = (firstWord.charAt(0) + (secondWord ? secondWord.charAt(0) : firstWord.charAt(1) || '')).toUpperCase();
    
    const registered = SQLiteEngine.registerUser(
      registerUsername.trim(), 
      registerPhone, 
      badge, 
      registerColor, 
      lmsEmail.trim().toLowerCase(), 
      lmsPassword, 
      registerAcademicUnit
    );
    
    showToast(`Registered successfully as ${registered.username}! Academic profile verified with SQLite.`, "success");
    setShowRegModal(false);
    syncLocalState();
  };

  const handleUserLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lmsEmail.trim() || !lmsEmail.includes('@')) {
      showToast("Please enter a valid school email", "warn");
      return;
    }
    if (!lmsPassword) {
      showToast("Password cannot be empty", "warn");
      return;
    }

    const matchedUser = SQLiteEngine.loginUser(lmsEmail.trim(), lmsPassword);
    if (matchedUser) {
      showToast(`Welcome back, ${matchedUser.username}! Session recovered from SQLite.`, "success");
      setShowRegModal(false);
      
      // Reset credentials fields
      setLmsEmail('');
      setLmsPassword('');
      syncLocalState();
    } else {
      showToast("Invalid email or password. Check transaction logs for auth warnings!", "warn");
    }
  };

  const handleUserLogout = () => {
    SQLiteEngine.logoutUser();
    showToast("Signed out. Credentials locked.", "info");
    syncLocalState();
  };

  // --- GROUP CREATOR SUBMISSION ---
  const handleCreateStudyCircle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      showToast("Group Name is required", "warn");
      return;
    }
    const creatorId = activeUser?.id || 'u-self';
    const groupCreated = SQLiteEngine.createGroup(newGroupName.trim(), newGroupDesc.trim(), newGroupIcon, creatorId);
    
    showToast(`Study Group "${groupCreated.name}" registered in SQLite!`, "success");
    setNewGroupName('');
    setNewGroupDesc('');
    setShowGroupCreator(false);
    setActiveGroupId(groupCreated.id);
    syncLocalState();
  };

  // --- CHAT TRANSMISSION ---
  const handleSendText = () => {
    if (!inputVal.trim()) return;
    const author = activeUser || { id: 'u-self', username: 'You', badge: 'Y' };
    
    const textMsg = SQLiteEngine.insertMessage(
      activeGroupId,
      author.id,
      author.username,
      author.badge,
      inputVal.trim(),
      undefined,
      undefined
    );

    setInputVal('');
    syncLocalState();

    // Trigger local direct hop simulation delivering status markers to SQLite
    setTimeout(() => {
      SQLiteEngine.updateMessageStatus(textMsg.id, 'delivered');
      syncLocalState();
    }, 700);

    setTimeout(() => {
      SQLiteEngine.updateMessageStatus(textMsg.id, 'read');
      syncLocalState();
    }, 1500);

    // Auto smart bot reply simulator to queries
    triggerDirectSmartReply(textMsg.text || '');
  };

  // --- VOICE NOTE RECORDER AND PERSISTENCE ---
  const startVoiceRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    recordIntervalRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);
    showToast("BLE Mesh Bridge: Recording local audio frame...", "info");
  };

  const stopAndSubmitVoice = () => {
    if (!isRecording) return;
    setIsRecording(false);
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
    }

    const duration = recordingSeconds === 0 ? 3 : Math.min(60, recordingSeconds);
    const author = activeUser || { id: 'u-self', username: 'You', badge: 'Y' };

    // Emit live voice metadata packets storing directly inside SQLite storage column
    const voiceMsg = SQLiteEngine.insertMessage(
      activeGroupId,
      author.id,
      author.username,
      author.badge,
      undefined,
      `voice-note-${Math.random().toString(36).substr(2, 5)}`,
      duration
    );

    syncLocalState();
    showToast(`Voice Note persisted as SQLite Blob metadata (${duration}s)`, "success");

    setTimeout(() => {
      SQLiteEngine.updateMessageStatus(voiceMsg.id, 'delivered');
      syncLocalState();
    }, 800);

    setTimeout(() => {
      SQLiteEngine.updateMessageStatus(voiceMsg.id, 'read');
      syncLocalState();
    }, 1600);

    // Reply specifically to audio packets
    setTimeout(() => {
      const responseText = "🔊 Voice transmission routed cleanly. Received 16kbps offline code stream!";
      const responseMsg = SQLiteEngine.insertMessage(
        activeGroupId,
        'p-node-entry',
        "Alexander's iPad",
        "A",
        responseText
      );
      syncLocalState();
      showToast("Alexander's iPad: Received dynamic reply", "info");
    }, 2500);
  };

  const cancelVoiceRecording = () => {
    setIsRecording(false);
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
    }
    showToast("Voice packet discarded", "warn");
  };

  // --- SMART REPLY ENGINE ---
  const triggerDirectSmartReply = (query: string) => {
    const uc = query.toUpperCase();
    let reply = "I am on it! Syncing study folder items nearby.";
    let replierId = 'p-112';
    let replierName = "Sarah's iPhone";
    let replierBadge = 'S';

    if (uc.includes('CALCULUS') || uc.includes('INTEGRAL') || uc.includes('DERIVATIVE')) {
      reply = "Check the Calculus Study group! Sarah has chapter notes compiled nicely.";
    } else if (uc.includes('DISTRIBUTED') || uc.includes('SQLITE') || uc.includes('DATABASE')) {
      reply = "The ad-hoc SQLite tables are persistent! We can sync folders completely offline without internet.";
      replierId = 'p-node-entry';
      replierName = "Alexander's iPad";
      replierBadge = 'A';
    } else if (uc.includes('GROUP') || uc.includes('CREATE') || uc.includes('JOIN')) {
      reply = "You can tap the top '+' icon on Telegram UI to create a brand new Study Circle channels instantly!";
      replierId = 'p-beta';
      replierName = "Liam's MacBook";
      replierBadge = 'L';
    } else if (uc.includes('HELLO') || uc.includes('HEY') || uc.includes('HI')) {
      reply = `Hello! Glad to see your local peer node online on this group! Let's conquer the study material.`;
    }

    setTimeout(() => {
      SQLiteEngine.insertMessage(activeGroupId, replierId, replierName, replierBadge, reply);
      syncLocalState();
      showToast(`${replierName} responded internally`, "info");
    }, 2000);
  };

  // --- CUSTOM SQL CONSOLE EXECUTOR ---
  const executeUserSQL = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSQL.trim()) return;
    
    setTerminalResult(null);
    setTerminalError(null);
    
    try {
      const res = SQLiteEngine.executeCustomSQL(customSQL.trim());
      if (res.success) {
        setTerminalResult(res.data || [{ rows_affected: res.rowsAffected, status: 'success' }]);
        showToast("SQL Query completed successfully!", "success");
      } else {
        setTerminalError(res.error || "Execution failed.");
        showToast("SQL Error encountered", "warn");
      }
    } catch (e: any) {
      setTerminalError(e.message || "Parse Exception occurred.");
      showToast("SQL Parse Error", "warn");
    }
    syncLocalState();
  };

  // --- BRIGHT SYNTH SOUND WAVE AUDIO METADATA PLAYBACK ---
  const playSynthesizedAudio = (msgId: string, durationSec: number) => {
    if (currentlyPlayingId) {
      stopSynthesizedAudio(currentlyPlayingId);
    }

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      setCurrentlyPlayingId(msgId);
      setPlaybackProgress(prev => ({ ...prev, [msgId]: 0 }));

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = msgId.startsWith('user-voice') ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(261.63, ctx.currentTime); // C4 middle C
      osc.frequency.exponentialRampToValueAtTime(392.00, ctx.currentTime + durationSec); // slide to G4

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

      osc.start();
      osc.stop(ctx.currentTime + durationSec);

      let currentVal = 0;
      const interval = setInterval(() => {
        currentVal += 100 / (durationSec * 10);
        if (currentVal >= 100) {
          clearInterval(interval);
          setCurrentlyPlayingId(null);
          setPlaybackProgress(prev => ({ ...prev, [msgId]: 100 }));
        } else {
          setPlaybackProgress(prev => ({ ...prev, [msgId]: currentVal }));
        }
      }, 100);

      playbackIntervalRef.current[msgId] = interval;
    } catch (e) {
      // Audio fallback tracker
      setCurrentlyPlayingId(msgId);
      let currentVal = 0;
      const interval = setInterval(() => {
        currentVal += 100 / (durationSec * 10);
        if (currentVal >= 100) {
          clearInterval(interval);
          setCurrentlyPlayingId(null);
          setPlaybackProgress(prev => ({ ...prev, [msgId]: 100 }));
        } else {
          setPlaybackProgress(prev => ({ ...prev, [msgId]: currentVal }));
        }
      }, 100);
      playbackIntervalRef.current[msgId] = interval;
    }
  };

  const stopSynthesizedAudio = (msgId: string) => {
    if (playbackIntervalRef.current[msgId]) {
      clearInterval(playbackIntervalRef.current[msgId]);
      delete playbackIntervalRef.current[msgId];
    }
    setCurrentlyPlayingId(null);
    setPlaybackProgress(prev => ({ ...prev, [msgId]: 0 }));
  };

  // Render sound bar waves visual elements
  const renderInteractiveSoundBars = (playing: boolean, bars = 14) => {
    return (
      <div className="flex gap-0.5 items-end justify-center h-6 select-none px-2 py-0.5">
        {[...Array(bars)].map((_, idx) => {
          const defaultHeight = 4 + (idx % 3) * 5;
          return (
            <motion.div
              key={idx}
              className={`w-[2.5px] rounded-full ${playing ? 'bg-sky-400' : 'bg-slate-500'}`}
              animate={playing ? {
                height: [defaultHeight, defaultHeight * 2.8, defaultHeight * 0.4, defaultHeight],
              } : {
                height: defaultHeight
              }}
              transition={{
                repeat: Infinity,
                duration: 0.7 + (idx % 3) * 0.2,
                ease: 'easeInOut'
              }}
              style={{ height: defaultHeight }}
            />
          );
        })}
      </div>
    );
  };

  // Filters groups
  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(threadSearch.toLowerCase()) || 
    g.description.toLowerCase().includes(threadSearch.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 h-[640px] bg-[#040815] rounded-3xl border border-slate-800/85 overflow-hidden shadow-2xl relative">
      
      {/* LEFT COLUMN: Telegram Threads List */}
      <div className={`md:col-span-4 flex flex-col bg-[#080d1a] border-r border-slate-900 h-full ${
        mobileView === 'chat' ? 'hidden md:flex' : 'flex'
      }`}>
        
        {/* Telegram Top Profile Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div 
              style={{ backgroundColor: activeUser?.avatar_color || '#0ea5e9' }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-xs border border-white/10 shadow-lg font-mono animate-fade-in"
              title={activeUser?.academic_unit || 'Academic Profile'}
            >
              {activeUser?.badge || 'G'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white truncate max-w-[110px]">{activeUser?.username || 'Guest Student'}</p>
                <div className={`w-1.5 h-1.5 rounded-full ${activeUser ? 'bg-emerald-450' : 'bg-amber-400'} animate-pulse`} />
              </div>
              <p className="text-[9px] text-slate-400 font-medium truncate font-mono max-w-[130px]" title="Department units">
                {activeUser?.academic_unit || activeUser?.phone_or_node || 'LMS - Guest Session'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setAuthMode('login');
                setShowRegModal(true);
              }}
              className="px-2.5 py-1.5 text-[8px] text-slate-300 hover:text-white bg-slate-905 border border-slate-800 hover:border-sky-500/50 rounded-lg transition-all font-bold uppercase tracking-widest cursor-pointer shadow-inner"
              title="Access LMS Student Authorization Gateway"
            >
              {activeUser ? 'LMS Account' : 'Sign In'}
            </button>
            <button 
              onClick={() => setShowGroupCreator(true)}
              className="p-2 text-slate-300 hover:text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-505 rounded-xl transition-all shadow-md cursor-pointer"
              title="Create Course Circle"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Channel Thread Box */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-900/60">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search chapters & circles..."
              value={threadSearch}
              onChange={(e) => setThreadSearch(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-850 focus:border-sky-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none transition-all font-sans font-medium"
            />
          </div>
        </div>

        {/* Threads List viewport scrolling */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-900/40">
          {filteredGroups.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-bold">
              No chat circles matched.
            </div>
          ) : (
            filteredGroups.map(group => {
              const isActive = group.id === activeGroupId;
              return (
                <div 
                  key={group.id}
                  onClick={() => handleSelectGroup(group.id)}
                  className={`p-4 flex items-start gap-3.5 cursor-pointer transition-all duration-200 ${
                    isActive 
                      ? 'bg-slate-950 border-l-4 border-sky-550 text-white' 
                      : 'hover:bg-slate-950/40 text-slate-350'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sky-400 border select-none ${
                    isActive ? 'bg-sky-950/60 border-sky-400/30' : 'bg-slate-950 border-slate-800'
                  }`}>
                    {group.icon === 'BookOpen' ? (
                      <Users className="w-5 h-5" />
                    ) : group.icon === 'Network' ? (
                      <Layers className="w-5 h-5" />
                    ) : (
                      <MessageSquare className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className="text-xs font-bold truncate pr-2 text-white">{group.name}</h4>
                      <span className="text-[9px] font-mono opacity-60">
                        {group.id === 'g-classroom' ? 'Online' : 'Local'}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-400 line-clamp-1 leading-relaxed">
                      {group.description}
                    </p>
                    <div className="flex gap-2 items-center mt-1 text-[8px] font-mono text-slate-550 uppercase font-black tracking-wider">
                      <span className="flex items-center gap-1">
                        <Users className="w-2.5 h-2.5 text-sky-450" /> {group.peer_count} seats
                      </span>
                      {group.is_custom && (
                        <span className="text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 border border-emerald-900/30 rounded font-bold">
                          Created in SQLite
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* SQLite status block */}
        <div className="p-3 bg-slate-950 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono shadow-inner select-none">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Database className="w-4 h-4 text-sky-400" />
            <span className="font-bold">SQLite Node Broker</span>
          </div>
          <button 
            onClick={() => setShowTerminal(!showTerminal)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black text-white hover:text-sky-450 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-sky-500/40 rounded-xl transition-all cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-450 animate-pulse" />
            <span>SQL TERMINAL</span>
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Telegram Active Chat panel */}
      <div className={`md:col-span-8 flex flex-col h-full bg-[#050915] select-text relative ${
        mobileView === 'list' ? 'hidden md:flex' : 'flex'
      }`}>
        
        {/* Chat Thread Header bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-900 flex items-center justify-between shadow-sm select-none">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileView('list')}
              className="p-1 text-slate-405 hover:text-white md:hidden mr-1 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-slate-900 text-sky-400 border border-slate-800 flex items-center justify-center font-mono font-bold">
              {activeGroup?.name.substring(0, 1).toUpperCase() || 'C'}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-sm text-white tracking-tight">{activeGroup?.name || 'Loading Circle'}</h3>
                <span className="flex items-center gap-1 text-[8px] bg-sky-950/80 text-sky-400 border border-sky-900/40 font-bold px-2 py-0.5 rounded-full font-mono">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-sky-400" /> RELAY_OK
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5 font-medium max-w-[240px] md:max-w-none">
                {activeGroup?.description || 'Loading descriptive details...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[9px] font-mono text-[#0ea5e9] bg-sky-950/40 border border-sky-900 px-2 py-0.5 rounded-md">
              RELAY-HOPS: 3
            </span>
          </div>
        </div>

        {/* Offline air wave warning tag */}
        <div className="bg-slate-950 px-5 py-2 flex items-center justify-between text-[9px] font-mono select-none border-b border-[#11192e]">
          <span className="flex items-center gap-1 text-sky-400 font-bold">
            <WifiOff className="w-3.5 h-3.5" /> offline_mode_active
          </span>
          <span className="text-slate-500">Persisted locally in SQLite Table: messages</span>
          <span className="text-slate-500 hidden sm:inline">Hop Index: active</span>
        </div>

        {/* Message Viewport */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#070b16]/40 scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-55 py-12 select-none">
              <MessageSquare className="w-10 h-10 text-slate-500" />
              <p className="text-xs font-bold text-slate-400">Class study circle is empty.</p>
              <p className="text-[10px] text-slate-500">Emit your first offline message below!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isPlaying = currentlyPlayingId === msg.id;
              const progress = playbackProgress[msg.id] || 0;
              const belongsToSelf = msg.is_self === 1;

              return (
                <div 
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${belongsToSelf ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 font-extrabold text-xs flex items-center justify-center select-none shadow-sm font-mono ${
                    belongsToSelf 
                      ? 'bg-sky-500 text-white border border-sky-450' 
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {msg.avatar || 'S'}
                  </div>

                  <div className="space-y-1">
                    <div className={`flex items-center gap-2 text-[9px] text-slate-500 font-bold ${belongsToSelf ? 'justify-end' : ''}`}>
                      <span>{msg.sender_name}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-lg relative ${
                      belongsToSelf 
                        ? 'bg-sky-500 text-white rounded-tr-none' 
                        : 'bg-[#151e36] text-slate-200 border border-[#232f52] rounded-tl-none'
                    }`}>
                      {msg.text && <p className="font-medium whitespace-pre-wrap select-text font-sans">{msg.text}</p>}

                      {msg.voice_url && (
                        <div className="flex items-center gap-3 select-none py-1 min-w-[170px]">
                          {isPlaying ? (
                            <button 
                              onClick={() => stopSynthesizedAudio(msg.id)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                belongsToSelf ? 'bg-white text-sky-600' : 'bg-sky-500 text-white hover:bg-sky-600'
                              }`}
                            >
                              <Pause className="w-3.5 h-3.5 fill-current" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => playSynthesizedAudio(msg.id, msg.duration_sec || 5)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                belongsToSelf ? 'bg-white text-sky-600' : 'bg-sky-500 text-white hover:bg-sky-600'
                              }`}
                            >
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            </button>
                          )}

                          <div className="flex-1">
                            <div className="flex justify-between items-center text-[8px] mb-1 font-mono uppercase font-black opacity-75">
                              <span>Voice Note Packet</span>
                              <span>{msg.duration_sec}s</span>
                            </div>

                            <div className="flex items-center gap-1.5 mb-1.5 h-6">
                              {renderInteractiveSoundBars(isPlaying, 15)}
                            </div>
                            
                            <div className="w-full bg-slate-950 rounded-full h-[3px] overflow-hidden">
                              <div 
                                className={`h-full ${belongsToSelf ? 'bg-white' : 'bg-sky-500'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {belongsToSelf && (
                      <div className="flex justify-end select-none">
                        <span className="flex items-center gap-0.5 text-[8px] text-sky-400 font-bold uppercase tracking-wider font-mono">
                          {msg.status === 'read' ? (
                            <>
                              <CheckCheck className="w-3 h-3 text-sky-400" /> read nearby
                            </>
                          ) : msg.status === 'delivered' ? (
                            <>
                              <CheckCheck className="w-3 h-3 text-slate-500" /> delivered
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3 text-slate-505" /> sent over BLE
                            </>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Telegram Chat Input Bar */}
        <div className="border-t border-slate-900 p-4.5 bg-slate-950/95 shadow-lg relative z-10">
          <AnimatePresence mode="wait">
            {isRecording ? (
              <motion.div 
                key="voice-panel-rec"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex items-center justify-between bg-red-950/20 border border-red-900/40 rounded-2xl p-3 text-red-200 text-xs shadow-inner"
              >
                <div className="flex items-center gap-2.5 font-mono">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-extrabold uppercase text-[10px] tracking-wider text-red-400">Emitting Audio Stream:</span>
                  <span className="font-black text-xs bg-red-650 text-white px-2.5 py-1 rounded-xl">0:{recordingSeconds < 10 ? '0' + recordingSeconds : recordingSeconds}</span>
                </div>

                <div className="flex-1 max-w-[130px] mx-4">
                  {renderInteractiveSoundBars(true, 12)}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={cancelVoiceRecording}
                    className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all"
                  >
                    Discard
                  </button>
                  <button
                    onClick={stopAndSubmitVoice}
                    className="bg-red-650 hover:bg-red-500 text-white font-extrabold px-4.5 py-1.5 rounded-xl flex items-center gap-1.5 text-[10px] cursor-pointer transition-all shadow-md shadow-red-500/10"
                  >
                    <Send className="w-3.5 h-3.5 fill-current" /> Emit Stream
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="text-panel-ipt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2.5"
              >
                <button 
                  onClick={() => showToast("Select lecture material from offline storage file manager to attach to classroom stream.", "info")}
                  className="p-2.5 text-slate-400 hover:text-sky-400 hover:bg-[#15203d]/30 rounded-xl transition-all cursor-pointer"
                  title="Attach Study Pack File"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <button 
                  onClick={() => showToast("Simulated offline graphic-text emoji packet loaded.", "info")}
                  className="p-2.5 text-slate-400 hover:text-sky-400 hover:bg-[#15203d]/30 rounded-xl transition-all cursor-pointer"
                  title="Emoji"
                >
                  <Smile className="w-4 h-4" />
                </button>

                <input 
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                  placeholder={`Send direct mesh data to ${activeGroup?.name || 'circle'}...`}
                  className="flex-1 bg-slate-955 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-505 focus:ring-1 focus:ring-sky-500/20 transition-all font-sans font-semibold shadow-inner"
                />

                {inputVal.trim() === '' ? (
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    className="bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-sky-450 border border-slate-805 p-3 rounded-xl transition-all active:scale-95 flex items-center justify-center shrink-0 cursor-pointer shadow-sm"
                    title="Hold to Stream Offline Voice Note"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendText}
                    className="bg-sky-650 hover:bg-sky-550 text-white p-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-sky-500/15 shrink-0 flex items-center justify-center cursor-pointer"
                  >
                    <Send className="w-4 h-4 fill-current animate-pulse" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FLOATING SUB-PANEL: Live SQLite Engine Console and Query Viewer */}
      <AnimatePresence>
        {showTerminal && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-14 left-4 right-4 bg-[#0a0f1d] border-2 border-[#1e294b] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[280px] z-50 pointer-events-auto"
          >
            {/* Console Header */}
            <div className="bg-[#0e162c] px-4 py-2 flex items-center justify-between border-b border-[#1c2743] select-none">
              <div className="flex items-center gap-1.5 font-mono text-[9px] font-black text-sky-400">
                <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>OFFLINE LOCAL SQLITE ENGINE INSTANCE v3.45.0</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    SQLiteEngine.clearLogs();
                    syncLocalState();
                  }}
                  className="text-[9px] font-bold uppercase border border-[#2e3b5e] bg-[#141b31] px-2 py-0.5 rounded text-slate-350 hover:bg-[#202a4d] transition-colors cursor-pointer"
                >
                  Clear Command Pool
                </button>
                <button 
                  onClick={() => setShowTerminal(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Console Workspace Splits */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden text-[10px] font-mono leading-relaxed">
              
              {/* Transaction Statement Streaming pool */}
              <div className="flex flex-col border-r border-[#1a2542] bg-[#070a14] h-full overflow-hidden">
                <div className="px-3 py-1.5 bg-[#0e162c]/65 border-b border-[#1c2743]/50 text-slate-400 uppercase text-[8px] font-bold">
                  Transaction Audit Logs (Reactive Stream)
                </div>
                <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                  {sqlLogs.length === 0 ? (
                    <div className="text-slate-600 text-center py-6">
                      No queries run. Perform thread changes or type messages to trigger local database queries.
                    </div>
                  ) : (
                    sqlLogs.map(log => (
                      <div key={log.id} className="border-b border-[#11192e] pb-1.5">
                        <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[8px]">
                          <span>{log.timestamp}</span>
                          <span className="text-emerald-500">Rows affected: {log.affected_rows}</span>
                          <span className="text-[#38bdf8] uppercase">TX_COMMIT</span>
                        </div>
                        <p className="text-sky-300 font-bold select-all whitespace-pre-wrap mt-0.5 leading-tight">{log.statement}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Direct query execution console environment */}
              <div className="flex flex-col h-full overflow-hidden bg-slate-950">
                <div className="px-3 py-1.5 bg-[#0e162c]/65 border-b border-[#1c2743]/50 text-slate-400 uppercase text-[8px] font-bold flex justify-between items-center">
                  <span>Interactive SQL Console Playground</span>
                  <span className="text-emerald-400 font-bold text-[8px]">Read/Write Supported</span>
                </div>
                <div className="flex-1 p-3 overflow-y-auto">
                  <form onSubmit={executeUserSQL} className="flex gap-1.5 mb-2.5">
                    <input 
                      type="text"
                      value={customSQL}
                      onChange={(e) => setCustomSQL(e.target.value)}
                      placeholder="SELECT * FROM messages WHERE is_self = 1;"
                      className="flex-1 bg-[#090e1a] border border-[#1d273f] rounded-lg px-2 text-[9px] font-mono text-emerald-400 focus:outline-none placeholder-slate-600 text-xs"
                    />
                    <button 
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 rounded-lg text-[9px] cursor-pointer"
                    >
                      EXECUTE
                    </button>
                  </form>

                  {/* Terminal stdout / dump results panels */}
                  <div className="bg-[#05070d] p-3 border border-[#1b253b] rounded-lg h-[130px] overflow-y-auto">
                     {terminalError && (
                       <p className="text-rose-400 select-all font-bold">SQLITE_ERROR: {terminalError}</p>
                     )}
                     {terminalResult && (
                       <div className="space-y-1 select-all">
                         <p className="text-emerald-400 font-bold border-b border-emerald-950 pb-0.5">
                           -- Query OK. {terminalResult.length} rows returned.
                         </p>
                         <pre className="text-slate-300 text-[8px] select-all leading-relaxed whitespace-pre-wrap">
                           {JSON.stringify(terminalResult, null, 2)}
                         </pre>
                       </div>
                     )}
                     {!terminalResult && !terminalError && (
                       <div className="text-slate-500 space-y-1 select-none">
                         <p className="font-bold">// Tip: Run commands to dump relational tables:</p>
                         <p>1. SELECT * FROM users;</p>
                         <p>2. SELECT * FROM groups;</p>
                         <p>3. SELECT * FROM messages;</p>
                         <p>4. DELETE FROM messages;</p>
                       </div>
                     )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRegModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRegModal(false)}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#0a0f1d] border-2 border-[#1e294b] rounded-3xl overflow-hidden shadow-2xl p-6 z-10"
            >
              <div className="flex justify-between items-center mb-4 select-none">
                <div className="flex items-center gap-1 text-sky-400 font-display font-black text-xs uppercase tracking-widest font-mono">
                  <Shield className="w-4 h-4 text-sky-400 animate-pulse" /> LMS Student Gateway
                </div>
                <button 
                  onClick={() => setShowRegModal(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center py-2 mb-4">
                <div className="w-12 h-12 rounded-full bg-sky-950/50 border border-sky-400/30 flex items-center justify-center mx-auto mb-2 text-[#38bdf8]">
                  <UserCheck className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="font-display font-extrabold text-[#f1f5f9] text-base">
                  {activeUser ? 'LMS Session Active' : (authMode === 'login' ? 'LMS Account Sign In' : 'LMS Student Registration')}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  {activeUser
                    ? `Authenticated as ${activeUser.username} (${activeUser.academic_unit}).`
                    : 'Log in with standard student credentials or sign up normally to verify identity with local SQLite.'}
                </p>
              </div>

              {activeUser ? (
                <div className="space-y-4 text-xs font-sans">
                  <div className="bg-[#070b16] border border-[#1e294b] rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex justify-between border-b border-[#16213e] pb-1.5">
                      <span className="text-slate-500 font-mono">Student Name</span>
                      <span className="font-bold text-white text-right">{activeUser.username}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#16213e] pb-1.5">
                      <span className="text-slate-500 font-mono">School Email</span>
                      <span className="font-bold text-white text-right font-mono text-[11px]">{activeUser.email || 'guest@university.edu'}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#16213e] pb-1.5">
                      <span className="text-slate-500 font-mono">LMS ID</span>
                      <span className="font-bold text-sky-400 text-right font-mono">{activeUser.phone_or_node}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-mono">Academic major</span>
                      <span className="font-bold text-emerald-400 text-right">{activeUser.academic_unit || 'CS & Engineering'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRegModal(false)}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 py-2.5 rounded-xl font-bold border border-[#1e294b] transition-all cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={handleUserLogout}
                      className="flex-1 bg-red-950/40 hover:bg-red-900/40 text-red-200 border border-red-900/30 py-2.5 rounded-xl font-bold transition-all cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={authMode === 'login' ? handleUserLogin : handleUserRegistration} className="space-y-3.5 text-xs font-sans">
                  {/* Mode Selector */}
                  <div className="grid grid-cols-2 gap-1 bg-[#070b16] border border-[#1e294b] p-1 rounded-xl select-none font-bold text-[10px]">
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className={`py-1.5 rounded-lg transition-all ${authMode === 'login' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
                    >
                      LOG IN
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className={`py-1.5 rounded-lg transition-all ${authMode === 'signup' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
                    >
                      SIGN UP
                    </button>
                  </div>

                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-[9px] font-mono text-sky-400 uppercase font-bold tracking-wider mb-1">
                        Full Student Name
                      </label>
                      <input 
                        type="text"
                        required
                        value={registerUsername}
                        onChange={(e) => setRegisterUsername(e.target.value)}
                        placeholder="e.g. Alex Johnson"
                        className="w-full bg-[#070b16] border border-[#1e294b] focus:border-sky-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[9px] font-mono text-sky-400 uppercase font-bold tracking-wider mb-1">
                      School Email / LMS Username
                    </label>
                    <input 
                      type="email"
                      required
                      value={lmsEmail}
                      onChange={(e) => setLmsEmail(e.target.value)}
                      placeholder="e.g. alex.j@university.edu"
                      className="w-full bg-[#070b16] border border-[#1e294b] focus:border-sky-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-sky-400 uppercase font-bold tracking-wider mb-1">
                      Password / Student PIN
                    </label>
                    <input 
                      type="password"
                      required
                      value={lmsPassword}
                      onChange={(e) => setLmsPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#070b16] border border-[#1e294b] focus:border-sky-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>

                  {authMode === 'signup' && (
                    <>
                      <div>
                        <label className="block text-[9px] font-mono text-sky-400 uppercase font-bold tracking-wider mb-1">
                          Academic Discipline / Major
                        </label>
                        <select
                          value={registerAcademicUnit}
                          onChange={(e) => setRegisterAcademicUnit(e.target.value)}
                          className="w-full bg-[#070b16] border border-[#1e294b] focus:border-sky-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        >
                          <option value="CS & Engineering Dept">CS & Engineering Dept</option>
                          <option value="Pre-Med Division">Pre-Med Division</option>
                          <option value="Mathematics Division">Mathematics Division</option>
                          <option value="Electrical Engineering Dept">Electrical Engineering Dept</option>
                          <option value="Business & Economics school">Business & Economics school</option>
                        </select>
                      </div>

                      {/* Favorite Color badge customization */}
                      <div>
                        <label className="block text-[9px] font-mono text-sky-400 uppercase font-bold tracking-wider mb-1">
                          Select Identity Color Motif
                        </label>
                        <div className="flex gap-2 justify-center mt-1">
                          {['#0ea5e9', '#ec4899', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6'].map(color => (
                            <button 
                              type="button"
                              key={color}
                              onClick={() => setRegisterColor(color)}
                              style={{ backgroundColor: color }}
                              className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                                registerColor === color ? 'border-white scale-110' : 'border-transparent'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="pt-2">
                    <button 
                      type="submit"
                      className="w-full bg-sky-600 hover:bg-sky-500 text-white font-extrabold py-2.5 text-xs rounded-xl flex items-center justify-center gap-1 shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <User className="w-4 h-4" /> 
                      {authMode === 'login' ? 'VERIFY LMS PROFILE' : 'CREATE PORTAL ID'}
                    </button>
                  </div>

                  <div className="bg-[#0b101f]/80 rounded-xl p-2.5 border border-[#1c2642] text-[9.5px] text-slate-400 space-y-1">
                    <p className="font-bold text-sky-400 font-mono">Quick Stored Profiles:</p>
                    <p>⚡ <span className="text-slate-350">alex.j@university.edu</span> (pass: <span className="font-mono text-sky-300">password123</span>)</p>
                    <p>⚡ <span className="text-slate-350">sarah.m@university.edu</span> (pass: <span className="font-mono text-sky-300">password456</span>)</p>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SYSTEM MODAL: Create New Study Group Circle */}
      <AnimatePresence>
        {showGroupCreator && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 select-none">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGroupCreator(false)}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#0a0f1d] border-2 border-[#1e294b] rounded-3xl overflow-hidden shadow-2xl p-6 z-10"
            >
              <div className="flex justify-between items-center mb-4 select-none font-mono">
                <div className="flex items-center gap-1.5 text-sky-400 font-display font-black text-xs uppercase tracking-widest">
                  <Sparkles className="w-4 h-4 text-sky-400 animate-spin" /> Group Channel Creator
                </div>
                <button 
                  onClick={() => setShowGroupCreator(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center py-1 mb-4 select-none">
                <h4 className="font-display font-extrabold text-[#f1f5f9] text-base">New Study Circle</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Establish a brand new offline network group. A SQLite transaction `INSERT INTO groups` will persist it!
                </p>
              </div>

              <form onSubmit={handleCreateStudyCircle} className="space-y-4">
                
                {/* Group Name input */}
                <div>
                  <label className="block text-[9px] font-mono text-sky-400 uppercase font-bold tracking-wider mb-1">
                    Study Group Circle Name
                  </label>
                  <input 
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Physics 101 Labs, Biology Quiz"
                    className="w-full bg-[#070b16] border border-[#1e294b] focus:border-sky-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>

                {/* Tagline / Description input */}
                <div>
                  <label className="block text-[9px] font-mono text-sky-400 uppercase font-bold tracking-wider mb-1">
                    Brief Class Tagline
                  </label>
                  <input 
                    type="text"
                    maxLength={100}
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="e.g. Preparing exam worksheets offline together"
                    className="w-full bg-[#070b16] border border-[#1e294b] focus:border-sky-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>

                {/* Visual Category symbol icon pickers */}
                <div>
                  <label className="block text-[9px] font-mono text-sky-400 uppercase font-bold tracking-wider mb-1.5">
                    Symbol Icon motif
                  </label>
                  <div className="flex gap-2 justify-center">
                    {[
                      { key: 'MessageSquare', icon: <MessageSquare className="w-4 h-4" /> },
                      { key: 'BookOpen', icon: <Users className="w-4 h-4" /> },
                      { key: 'Network', icon: <Layers className="w-4 h-4" /> },
                    ].map(item => (
                      <button 
                        type="button"
                        key={item.key}
                        onClick={() => setNewGroupIcon(item.key)}
                        className={`p-2 rounded-xl border-2 transition-all cursor-pointer ${
                          newGroupIcon === item.key 
                            ? 'bg-sky-900 border-sky-400 text-white' 
                            : 'bg-[#090d19] border-[#1e294b] text-slate-400 hover:text-white'
                        }`}
                      >
                        {item.icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white font-extrabold py-2.5 text-xs rounded-xl flex items-center justify-center gap-1 shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Create Circle in SQLite DB
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
