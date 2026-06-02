/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Wifi, 
  Settings, 
  Bell, 
  Search, 
  CheckCircle, 
  BookOpen, 
  Layers, 
  Radio, 
  Users, 
  Download, 
  Send, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  Compass, 
  Play, 
  Pause, 
  X, 
  ChevronRight, 
  PanelLeftClose, 
  User, 
  Sparkles,
  School,
  Activity,
  CloudLightning,
  FileCheck2,
  MessageSquare,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { MeshFile, ActiveTransfer, PeerNode } from './types';
import { INITIAL_FILES, INITIAL_TRANSFERS, INITIAL_PEERS } from './data';

import LibraryTab from './components/LibraryTab';
import MeshMarketTab from './components/MeshMarketTab';
import MeshDropTab from './components/MeshDropTab';
import PeersTab from './components/PeersTab';
import ChatTab from './components/ChatTab';
import SyncNoteTab from './components/SyncNoteTab';
import { SQLiteEngine, SQLiteUser } from './components/SQLiteDB';

export default function App() {
  // --- Global LMS Authentication state ---
  const [activeUser, setActiveUser] = useState<SQLiteUser | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupDept, setSignupDept] = useState('CS & Engineering Dept');

  // --- Persistent States ---
  const [files, setFiles] = useState<MeshFile[]>(INITIAL_FILES);
  const [transfers, setTransfers] = useState<ActiveTransfer[]>(INITIAL_TRANSFERS);
  const [peers, setPeers] = useState<PeerNode[]>(INITIAL_PEERS);
  const [currentTab, setCurrentTab] = useState<'home' | 'library' | 'market' | 'meshdrop' | 'peers' | 'chat' | 'syncnote'>('home');
  
  // --- Simulated Actions & Settings State ---
  const [pausedIds, setPausedIds] = useState<string[]>([]);
  const [syncedFilesMap, setSyncedFilesMap] = useState<Record<string, 'syncing' | 'synced' | 'none'>>({});
  const [unitProgress, setUnitProgress] = useState(75); // Distributed Systems
  const [completedUnits, setCompletedUnits] = useState(12);
  const [showSettings, setShowSettings] = useState(false);
  const [txPower, setTxPower] = useState<'low' | 'balanced' | 'high'>('high');
  const [bleEnabled, setBleEnabled] = useState(true);
  const [customToasts, setCustomToasts] = useState<{ id: string; msg: string; type: 'success' | 'info' | 'warn' }[]>([]);

  // Bootstrap and sync activeUser
  useEffect(() => {
    SQLiteEngine.bootstrap();
    const syncUser = () => {
      const user = SQLiteEngine.getActiveUser();
      setActiveUser(user);
    };
    syncUser();
    window.addEventListener('sqlite_query_log_updated', syncUser);
    return () => {
      window.removeEventListener('sqlite_query_log_updated', syncUser);
    };
  }, []);

  // --- Dynamic Dashboard States ---
  const [dashboardTopology, setDashboardTopology] = useState({
    recentConsensusProgress: 64,
    recentConsensusStatus: 'Downloading from classmate'
  });

  // --- Toast Trigger Helper ---
  const showToast = (msg: string, type: 'success' | 'info' | 'warn' = 'success') => {
    const id = Math.random().toString();
    setCustomToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setCustomToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // --- Student LMS Authentication Actions ---
  const handleGlobalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginEmail.includes('@')) {
      showToast("Please enter a valid school email address", "warn");
      return;
    }
    if (!loginPassword) {
      showToast("Password cannot be empty", "warn");
      return;
    }

    const matchedUser = SQLiteEngine.loginUser(loginEmail.trim(), loginPassword);
    if (matchedUser) {
      showToast(`Welcome back, ${matchedUser.username}! Academic credentials downloaded.`, "success");
      setLoginEmail('');
      setLoginPassword('');
    } else {
      showToast("No classmate found with this email & password. Register instead!", "warn");
    }
  };

  const handleGlobalSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim()) {
      showToast("Full student name cannot be empty", "warn");
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      showToast("Please enter a valid school email address", "warn");
      return;
    }
    if (!signupPassword || signupPassword.length < 4) {
      showToast("Password/PIN must be at least 4 characters long", "warn");
      return;
    }

    const firstWord = signupName.trim().split(' ')[0];
    const secondWord = signupName.trim().split(' ')[1] || '';
    const badge = (secondWord ? (firstWord.charAt(0) + secondWord.charAt(0)) : firstWord.substring(0, 2)).toUpperCase();
    const phoneOrNode = 'LMS-' + Math.floor(Math.random() * 8999 + 1000);
    const colors = ['#0ea5e9', '#ec4899', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6'];
    const randomColor = colors[Math.random() * colors.length | 0];

    try {
      const registered = SQLiteEngine.registerUser(
        signupName.trim(),
        phoneOrNode,
        badge,
        randomColor,
        signupEmail.trim().toLowerCase(),
        signupPassword,
        signupDept
      );
      showToast(`Account registered for ${registered.username}! Local DB synced.`, "success");
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
    } catch (err: any) {
      showToast("Registration failed: ID/School email already registered!", "warn");
    }
  };

  // --- Transfer Simulation Engine ---
  // Increments transfers that are not paused and fires complete handlers
  useEffect(() => {
    const interval = setInterval(() => {
      setTransfers(prevTransfers => {
        const updated: ActiveTransfer[] = [];
        
        prevTransfers.forEach(transfer => {
          if (pausedIds.includes(transfer.id)) {
            updated.push(transfer);
            return;
          }

          const increment = Math.floor(Math.random() * 5) + 3; // 3-7% progress increases
          const nextProgress = Math.min(100, transfer.progress + increment);

          if (nextProgress === 100) {
            // Completed!
            showToast(`Downloaded study file: "${transfer.name}"!`, 'success');
            
            // Map the file from 'remote' or 'transferring' to 'offline' (fully synced!)
            setFiles(currentFiles => {
              return currentFiles.map(file => {
                // If it matched the active transfer name, activate it offline
                if (file.name === transfer.name) {
                  return {
                    ...file,
                    status: 'offline'
                  };
                }
                return file;
              });
            });

            // Set pull sync state
            setSyncedFilesMap(prev => ({
              ...prev,
              [transfer.fileId]: 'synced'
            }));
          } else {
            // Tweak metrics
            const parsedMBLeft = parseFloat(transfer.sizeLeft);
            const nextMBLeft = isNaN(parsedMBLeft) 
              ? 'Finalizing' 
              : `${Math.max(0.1, Number((parsedMBLeft - (increment * 0.15)).toFixed(1)))} MB left`;

            updated.push({
              ...transfer,
              progress: nextProgress,
              sizeLeft: nextProgress >= 93 ? 'Finalizing' : nextMBLeft
            });
          }
        });

        return updated;
      });

      // Synchronously mock recent transfers panel on the Home Tab
      setDashboardTopology(prev => {
        if (prev.recentConsensusProgress >= 100) return prev;
        const next = Math.min(100, prev.recentConsensusProgress + 3);
        return {
          recentConsensusProgress: next,
          recentConsensusStatus: next === 100 ? 'Completed' : 'Downloading from classmate'
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [pausedIds]);

  // --- Handlers ---
  const handleCancelTransfer = (id: string) => {
    setTransfers(prev => prev.filter(t => t.id !== id));
    showToast('Synchronization canceled', 'warn');
  };

  const handleTogglePause = (id: string) => {
    setPausedIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleGetFile = (file: MeshFile) => {
    // Check if ya already syncing
    if (transfers.some(t => t.name === file.name)) {
      showToast('This study file is already downloading', 'info');
      return;
    }

    const newTransfer: ActiveTransfer = {
      id: Math.random().toString(),
      fileId: file.id,
      name: file.name,
      type: file.type,
      direction: 'incoming',
      progress: 0,
      speed: '14.2 MB/s',
      eta: 'Analyzing queue',
      peerName: "Alexander's iPad",
      sizeLeft: file.size
    };

    setTransfers(prev => [...prev, newTransfer]);
    setSyncedFilesMap(prev => ({
      ...prev,
      [file.id]: 'syncing'
    }));

    showToast(`Requesting packets for "${file.name}"`, 'info');
  };

  const handleUploadFile = (name: string, type: string, size: string) => {
    const newTransfer: ActiveTransfer = {
      id: Math.random().toString(),
      fileId: Math.random().toString(),
      name,
      type: type as any,
      direction: 'outgoing',
      progress: 0,
      speed: '11.4 MB/s',
      eta: 'Preparing share',
      peerName: 'Your Device',
      sizeLeft: 'Sharing with classmates...'
    };

    setTransfers(prev => [...prev, newTransfer]);
    showToast(`Now sharing "${name}" with classmates nearby!`, 'success');
  };

  const handleTogglePeerStatus = (id: string) => {
    setPeers(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'active' ? 'inactive' : 'active';
        showToast(`Connection to ${p.name} set to ${nextStatus === 'active' ? 'CONNECTED' : 'DISCONNECTED'}`, 'info');
        return {
          ...p,
          status: nextStatus
        };
      }
      return p;
    }));
  };

  const handleAddCustomPeer = (name: string, isLocal: boolean, sharedCount: number) => {
    const newPeer: PeerNode = {
      id: Math.random().toString(),
      name,
      status: 'active',
      signalStrength: 3,
      latencyMs: 24,
      isLocal,
      sharedFilesCount: sharedCount
    };

    setPeers(prev => [...prev, newPeer]);
    showToast(`Connected to classmate device "${name}"!`, 'success');
  };

  // Increases syllabus Distributed Systems course units
  const handleIncreaseUnit = () => {
    if (completedUnits >= 16) {
      showToast('You have mastered all syllabus items!', 'success');
      return;
    }
    const nextCompleted = completedUnits + 1;
    setCompletedUnits(nextCompleted);
    setUnitProgress(Math.round((nextCompleted / 16) * 100));
    showToast(`Completed unit ${nextCompleted}/16: Topic Mastered!`, 'success');
  };

  const handleRunFullDiagnostics = () => {
    showToast('Checking signal and offline files connection...', 'info');
    setTimeout(() => {
      showToast('All nearby classmate files verified successfully!', 'success');
    }, 1200);
  };

  const handleOfflineDirectOptimize = () => {
    setDashboardTopology({
      recentConsensusProgress: 100,
      recentConsensusStatus: 'Completed'
    });
    showToast('Direct high-speed connection enabled!', 'success');
  };

  const handleMainReset = () => {
    setFiles(INITIAL_FILES);
    setTransfers(INITIAL_TRANSFERS);
    setPeers(INITIAL_PEERS);
    setPausedIds([]);
    setSyncedFilesMap({});
    setCurrentTab('home');
    setUnitProgress(75);
    setCompletedUnits(12);
    setDashboardTopology({
      recentConsensusProgress: 64,
      recentConsensusStatus: 'Downloading from classmate'
    });
    SQLiteEngine.resetDatabase();
    showToast('Restored default classroom files and SQLite DB!', 'warn');
    setShowSettings(false);
  };

  if (!activeUser) {
    return (
      <div className="bg-[#030712] min-h-screen text-[#cbd5e1] font-sans relative mesh-pattern flex flex-col justify-center items-center px-4 py-12 select-none overflow-hidden">
        {/* Futuristic premium aesthetic flares */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full opacity-40 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-505 opacity-10 rounded-full blur-[135px] pointer-events-none" />

        {/* Banner with signal design element */}
        <div className="max-w-md w-full text-center mb-8 animate-fade-in relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-sky-950/35 border border-sky-500/25 font-mono text-[9px] font-bold text-sky-450 rounded-full mb-4 uppercase tracking-widest shadow-sm select-none">
            <Radio className="w-3.5 h-3.5 text-sky-40 animate-pulse" /> School ClassMesh local portal
          </div>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="bg-gradient-to-tr from-sky-500 to-indigo-600 p-2.5 rounded-2xl text-white shadow-xl shadow-sky-500/15">
              <Network className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="font-display font-black text-3xl text-white tracking-tight leading-none">
              Mesh<span className="accent-gradient-text font-black">Learn</span>
            </h1>
          </div>
          <p className="text-xs text-slate-450 max-w-sm mx-auto leading-relaxed mt-3.5 font-medium">
            Standard offline network gateway. Register with your school credentials below to access and decrypt your classmate Mesh classroom channels.
          </p>
        </div>

        {/* Credentials Form Box */}
        <div className="bg-[#090f1e]/90 border border-slate-800/80 rounded-3xl p-7 shadow-2xl w-full max-w-sm relative overflow-hidden backdrop-blur-xl cyber-glow">
          {/* Card subtle flare effect */}
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Form Tabs Switcher */}
          <div className="grid grid-cols-2 gap-1 bg-slate-950/85 border border-slate-800/50 p-1.5 rounded-xl select-none font-bold text-[10px] uppercase mb-6">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`py-2 rounded-lg transition-all duration-300 font-bold uppercase tracking-wide cursor-pointer text-center ${authMode === 'login' ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`py-2 rounded-lg transition-all duration-300 font-bold uppercase tracking-wide cursor-pointer text-center ${authMode === 'signup' ? 'bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Sign Up
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleGlobalLogin} className="space-y-4.5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-sky-400 uppercase font-bold tracking-widest pl-1">
                  School Email
                </label>
                <input 
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. alex.j@university.edu"
                  className="w-full bg-slate-950/90 border border-slate-800 hover:border-slate-700 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-sky-400 uppercase font-bold tracking-widest pl-1">
                  Password
                </label>
                <input 
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/90 border border-slate-800 hover:border-slate-700 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none transition-all duration-200"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 font-extrabold text-white py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-sky-500/10 active:scale-[0.98] transition-all cursor-pointer mt-5"
              >
                Access Class Mesh <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleGlobalSignup} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-sky-400 uppercase font-bold tracking-widest pl-1">
                  Full Student Name
                </label>
                <input 
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full bg-slate-950/90 border border-slate-800 hover:border-slate-700 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-sky-400 uppercase font-bold tracking-widest pl-1">
                  School Email
                </label>
                <input 
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full bg-slate-950/90 border border-slate-800 hover:border-slate-700 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-sky-400 uppercase font-bold tracking-widest pl-1">
                  Password / Student PIN
                </label>
                <input 
                  type="password"
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/90 border border-slate-800 hover:border-slate-700 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-sky-400 uppercase font-bold tracking-widest pl-1">
                  Academic Discipline / Major
                </label>
                <select
                  value={signupDept}
                  onChange={(e) => setSignupDept(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-805 hover:border-slate-700 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer transition-all duration-200"
                >
                  <option value="CS & Engineering Dept">CS & Engineering Dept</option>
                  <option value="Pre-Med Division">Pre-Med Division</option>
                  <option value="Mathematics Division">Mathematics Division</option>
                  <option value="Electrical Engineering Dept">Electrical Engineering Dept</option>
                  <option value="Business & Economics School">Business & Economics School</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 font-extrabold text-white py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/10 active:scale-[0.98] transition-all cursor-pointer mt-4"
              >
                Register Portal ID <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Profiles Shortcuts Box */}
          <div className="mt-5 pt-4 border-t border-[#16213e] space-y-2">
            <h4 className="text-[10px] uppercase font-bold font-mono text-slate-500 tracking-wider">
              Quick Test Profiles (Pre-recorded):
            </h4>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('alex.j@university.edu');
                  setLoginPassword('password123');
                  setAuthMode('login');
                  showToast("Filled Alex's credentials. Click Enter to access!", "info");
                }}
                className="flex items-center justify-between p-2 bg-[#0a142c]/50 hover:bg-[#112046]/50 border border-[#1b2a52] hover:border-sky-500/40 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center font-bold text-[9px] font-mono animate-fade-in">
                    AJ
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-[10px] leading-tight select-none">Alex Johnson (CS)</p>
                  </div>
                </div>
                <span className="text-[9px] text-[#38bdf8] font-mono group-hover:underline">1-click fill</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginEmail('sarah.m@university.edu');
                  setLoginPassword('password456');
                  setAuthMode('login');
                  showToast("Filled Sarah's credentials. Click Enter to access!", "info");
                }}
                className="flex items-center justify-between p-2 bg-[#0a142c]/50 hover:bg-[#112046]/50 border border-[#1b2a52] hover:border-sky-500/40 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#ec4899] text-white flex items-center justify-center font-bold text-[9px] font-mono animate-fade-in">
                    SM
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-[10px] leading-tight select-none">Sarah Miller (Pre-Med)</p>
                  </div>
                </div>
                <span className="text-[9px] text-[#38bdf8] font-mono group-hover:underline">1-click fill</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Overlay Toaster notifications list for Login view */}
        <div className="fixed bottom-6 right-6 space-y-2 z-[200] max-w-sm pointer-events-none select-none">
          <AnimatePresence>
            {customToasts.map(toast => (
              <motion.div 
                key={toast.id}
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`p-4 rounded-2xl shadow-2xl flex items-start gap-2.5 border text-xs leading-relaxed backdrop-blur-md ${
                  toast.type === 'success' 
                    ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800' 
                    : toast.type === 'warn'
                    ? 'bg-amber-950/90 text-amber-200 border-amber-800'
                    : 'bg-slate-900/90 border-[#1e294b] text-sky-200'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {toast.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : toast.type === 'warn' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-sky-400" />
                  )}
                </div>
                <div>
                  <p className="font-bold uppercase tracking-widest text-[9px] text-[#38bdf8] mb-0.5 font-mono">Mesh Beacon</p>
                  <p className="font-sans font-medium text-slate-100">{toast.msg}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#070b16] min-h-screen text-[#cbd5e1] font-sans relative mesh-pattern">
      
      {/* Top Banner indicating local SQLite / BLE Mesh Signal Strength */}
      <div className="w-full bg-[#0a0f1d] text-slate-300 px-6 py-2.5 flex justify-between items-center sticky top-0 z-[100] border-b border-[#1e294b] shadow-sm text-xs md:text-sm">
        <div className="flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="flex items-center gap-1.5 font-bold tracking-tight text-white uppercase text-[10px] font-mono select-none">
            <Radio className="w-3.5 h-3.5 text-sky-400" />
            Ad-Hoc Network: {peers.filter(p => p.status === 'active').length} peer nodes online
          </span>
        </div>
        <div className="flex items-center gap-4 select-none">
          <div className="flex items-center gap-1 opacity-90 text-[10px] font-mono">
            <Wifi className="w-3.5 h-3.5 text-[#0ea5e9]" />
            <span className="font-bold text-slate-400">SIGNAL FIELD:</span>
            <div className="flex gap-0.5 items-end h-3 ml-1 select-none">
              <div className="w-1 h-1.5 bg-[#0ea5e9] rounded-full animate-bounce" />
              <div className="w-1 h-2 bg-[#0ea5e9] rounded-full" />
              <div className="w-1 h-3 bg-[#0ea5e9] rounded-full" />
              <div className="w-1 h-3.5 bg-slate-700 rounded-full opacity-35" />
            </div>
          </div>
        </div>
      </div>

      {/* Header Panel */}
      <header className="flex justify-between items-center px-6 py-4 w-full bg-[#0d1425]/85 backdrop-blur-md sticky top-[37px] z-40 border-b border-[#1e294d] shadow-lg">
        <div className="flex items-center gap-3 select-none">
          <div className="bg-[#0ea5e9] p-2 rounded-xl text-white shadow-lg shadow-sky-500/10">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-lg text-white tracking-tight leading-none">MeshLearn</h1>
            <p className="text-[9px] font-mono font-bold text-sky-400 tracking-widest uppercase mt-1">OFFLINE LOCAL EXCHANGE</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Diagnostic status trigger button */}
          <button 
            onClick={handleRunFullDiagnostics}
            className="p-2 text-slate-400 hover:text-[#0ea5e9] hover:bg-[#151f38] rounded-xl transition-all font-mono text-[10px] uppercase font-bold tracking-wider hidden md:flex items-center gap-1 border border-transparent hover:border-[#1e294d] cursor-pointer"
            title="Diagnose Connection"
          >
            <Activity className="w-4 h-4 text-emerald-400" /> check_signal
          </button>

          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-slate-400 hover:text-[#0ea5e9] hover:bg-[#151f38] rounded-xl transition-colors border border-transparent hover:border-[#1e294d] cursor-pointer"
            title="Mesh Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-[#16223f] mx-1 hidden md:block select-none" />

          {/* User Profile */}
          {activeUser && (
            <div className="flex items-center gap-2">
              <div 
                style={{ backgroundColor: activeUser.avatar_color || '#0ea5e9' }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold text-xs border border-white/10 shadow-md font-mono select-none"
                title={`${activeUser.username} (${activeUser.academic_unit})`}
              >
                {activeUser.badge || 'G'}
              </div>
              <div className="hidden lg:block text-left mr-1 select-none">
                <p className="text-xs font-bold text-white leading-none truncate max-w-[100px]">{activeUser.username}</p>
                <p className="text-[9px] text-[#38bdf8] font-mono leading-none mt-1">{activeUser.phone_or_node}</p>
              </div>
              <button
                onClick={() => {
                  SQLiteEngine.logoutUser();
                  showToast("Signed out. Credentials locked.", "info");
                }}
                className="p-1 px-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-300 hover:text-red-200 border border-red-950/30 hover:border-red-500/30 font-bold font-mono text-[9px] rounded-lg transition-all cursor-pointer"
                title="Sign Out Student Portal Session"
              >
                LOGOUT
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace Frame container */}
      <div className="max-w-6xl mx-auto px-6 py-8 flex gap-8">
        
        {/* Desktop Sidebar Navigation Panel */}
        <aside className="w-60 shrink-0 hidden md:flex flex-col bg-[#0a0f1d] border border-[#1e294b] rounded-3xl h-auto pb-5 sticky top-28 shadow-2xl overflow-hidden py-5 select-none animate-fade-in">
          <p className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest px-5 mb-4">STUDY MENU</p>
          
          <div className="flex flex-col flex-1 gap-1">
            <button 
              onClick={() => setCurrentTab('home')}
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-bold leading-none transition-all border-l-4 cursor-pointer ${
                currentTab === 'home' 
                  ? 'border-l-[#0ea5e9] text-white bg-white/5 font-bold shadow-inner' 
                  : 'border-l-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-4 h-4" /> Home Dashboard
            </button>

            <button 
              onClick={() => setCurrentTab('library')}
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-bold leading-none transition-all border-l-4 cursor-pointer ${
                currentTab === 'library' 
                  ? 'border-l-[#0ea5e9] text-white bg-white/5 font-bold shadow-inner' 
                  : 'border-l-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Mesh LMS Portal
            </button>

            <button 
              onClick={() => setCurrentTab('market')}
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-bold leading-none transition-all border-l-4 cursor-pointer ${
                currentTab === 'market' 
                   ? 'border-l-[#0ea5e9] text-white bg-white/5 font-bold shadow-inner' 
                  : 'border-l-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="w-4 h-4" /> Epidemic Gossip Alert
            </button>

            <button 
              onClick={() => setCurrentTab('meshdrop')}
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-bold leading-none transition-all border-l-4 cursor-pointer ${
                currentTab === 'meshdrop' 
                  ? 'border-l-[#0ea5e9] text-white bg-white/5 font-bold shadow-inner' 
                  : 'border-l-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Send className="w-4 h-4 fill-current" /> MeshDrop File Sync
            </button>

            <button 
              onClick={() => setCurrentTab('syncnote')}
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-bold leading-none transition-all border-l-4 cursor-pointer ${
                currentTab === 'syncnote' 
                  ? 'border-l-[#0ea5e9] text-white bg-white/5 font-bold shadow-inner' 
                  : 'border-l-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-4 h-4 text-sky-400" /> SyncNote Editor
            </button>

            <button 
              onClick={() => setCurrentTab('chat')}
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-bold leading-none transition-all border-l-4 cursor-pointer ${
                currentTab === 'chat' 
                  ? 'border-l-[#0ea5e9] text-white bg-white/5 font-bold shadow-inner' 
                  : 'border-l-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Classroom Chat
            </button>

            <button 
              onClick={() => setCurrentTab('peers')}
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-bold leading-none transition-all border-l-4 cursor-pointer ${
                currentTab === 'peers' 
                  ? 'border-l-[#0ea5e9] text-white bg-white/5 font-bold shadow-inner' 
                  : 'border-l-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" /> Classmates Nearby
            </button>
          </div>

          <div className="mt-auto border-t border-slate-800/80 pt-4 px-5 select-none">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
              <span>DATABASE:</span>
              <span className="text-[#0ea5e9] font-bold">OFFLINE STORAGE</span>
            </div>
          </div>
        </aside>

        {/* Core Tab Canvas Panel */}
        <main className="flex-1 pb-32">
          
          {/* Active Tab rendering */}
          {currentTab === 'home' && (
            <div className="space-y-8 animate-fade-in text-slate-200">
              
              {/* Ready to sync Header Jumbotron */}
              <section>
                <div className="bg-gradient-to-br from-[#0a0f1d] via-[#0d162c] to-[#040713] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border border-sky-950/80 cyber-glow">
                  {/* Glowing neon background effects */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-sky-500/10 via-indigo-600/5 to-transparent rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 max-w-md">
                    <div className="bg-slate-950/60 text-[#38bdf8] border border-sky-500/30 uppercase tracking-widest text-[9px] font-mono font-bold px-3 py-1.5 rounded-xl inline-flex items-center gap-2 mb-4.5 shadow-sm">
                      <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" /> Zero Internet Connection Required
                    </div>
                    <h2 className="font-display font-black text-2xl text-white tracking-tight mb-2.5">
                      Ready to study offline?
                    </h2>
                    <p className="text-slate-350 text-xs leading-relaxed font-medium mb-6">
                      Discover and download study guides, slides, and class notes shared by classmates sitting in the same classroom, all without using any mobile data.
                    </p>
                    <button 
                      onClick={() => setCurrentTab('market')}
                      className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-505 text-white font-extrabold px-6 py-3.5 rounded-xl flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-sky-505/10 text-xs uppercase tracking-wider cursor-pointer"
                    >
                      <Compass className="w-4 h-4 text-sky-100 fill-sky-200" /> Discover Nearby
                    </button>
                  </div>
                </div>
              </section>

              {/* Stats & Mini Transfers column */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* School course learning progress item */}
                <div className="bg-[#0b1120] p-6 rounded-2xl border border-slate-800 hover:border-sky-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between cyber-glow">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] font-bold text-sky-400 tracking-widest uppercase font-mono pl-0.5">Academic Track Progress</span>
                      <h3 className="font-display font-extrabold text-lg text-white tracking-tight mt-1.5">Distributed Systems</h3>
                    </div>
                    <div className="bg-slate-950/80 border border-slate-800/80 p-2.5 rounded-xl text-sky-450 shadow-inner">
                      <School className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2 pl-0.5">
                      <span className="text-xs font-bold text-slate-450">{unitProgress}% Complete</span>
                      <span className="text-xs font-mono font-extrabold text-[#38bdf8]">{completedUnits}/16 units</span>
                    </div>
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden relative border border-slate-800 p-0.5">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-sky-400 to-[#5046e6] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${unitProgress}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <button 
                      onClick={handleIncreaseUnit}
                      className="mt-5 w-full bg-slate-950/80 hover:bg-slate-900 text-sky-400 hover:text-sky-300 border border-slate-800 hover:border-sky-500/50 font-extrabold py-3 text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      Master Syllabus Unit
                    </button>
                  </div>
                </div>

                {/* Recent transfers list panel */}
                <div className="bg-[#0b1120] p-6 rounded-2xl border border-slate-800 hover:border-sky-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between cyber-glow">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-display font-extrabold text-base text-white tracking-tight">Recent Transfers</h3>
                      <span className="text-[10px] bg-slate-950/80 text-[#38bdf8] border border-sky-800/40 px-3 py-1 rounded-full font-bold uppercase select-none tracking-widest font-mono shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-450 inline-block mr-1.5 animate-pulse" />
                        Live
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Consensus static complete log */}
                      <div className="flex items-center gap-3 p-2 bg-slate-950/40 rounded-xl border border-slate-900/50">
                        <div className="w-9 h-9 rounded-lg bg-teal-950/30 border border-teal-900/40 flex items-center justify-center flex-shrink-0">
                          <FileCheck2 className="w-5 h-5 text-emerald-450" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate font-mono">p2p_history_notes.pdf</p>
                          <p className="text-[10px] text-slate-400 font-medium">Completed • 4.2 MB • classroom sharing</p>
                        </div>
                        <CheckCircle className="w-4 h-4 text-emerald-400 justify-end flex-shrink-0" />
                      </div>

                      {/* Mesh topology real-time synchronized percentage progress */}
                      <div className="flex items-center gap-3 p-2 bg-slate-950/40 rounded-xl border border-slate-900/50">
                        <div className="w-9 h-9 rounded-lg bg-sky-950/30 border border-sky-900/40 flex items-center justify-center flex-shrink-0">
                          <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate font-mono">geometry_tutorial.mp4</p>
                          <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                            {dashboardTopology.recentConsensusProgress}% • {dashboardTopology.recentConsensusStatus}
                          </p>
                        </div>
                        
                        {dashboardTopology.recentConsensusProgress < 100 ? (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-700 border-t-[#0ea5e9] animate-spin mr-0.5" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-[#38bdf8]" />
                        )}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleOfflineDirectOptimize}
                    className="mt-4 text-xs font-bold text-[#38bdf8] flex items-center gap-1 hover:translate-x-1.5 hover:text-sky-300 transition-all select-none self-start font-mono"
                  >
                    View full history <ChevronRight className="w-3.5 h-3.5 text-sky-400" />
                  </button>
                </div>
              </div>

              {/* Quick Actions / System Tools */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-5 h-5 text-sky-400" />
                  <h3 className="font-display font-bold text-base text-white">Network Tools</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => {
                      setCurrentTab('meshdrop');
                      showToast('Broadcast Beacon engaged!', 'info');
                    }}
                    className="bg-[#0a0f1d] p-5 rounded-2xl border border-[#1e294b] hover:border-[#38bdf8] text-left transition-colors group flex flex-col justify-between h-36 cursor-pointer"
                  >
                    <div className="w-9 h-9 mb-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center group-hover:bg-[#0ea5e9] group-hover:text-white transition-colors border border-[#1e294b] shadow-sm">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase font-mono tracking-wide">Ask Classmates</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Let classmates nearby know what files you are looking for.</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => showToast('Backup saved successfully!', 'success')}
                    className="bg-[#0a0f1d] p-5 rounded-2xl border border-[#1e294b] hover:border-[#38bdf8] text-left transition-colors group flex flex-col justify-between h-36 cursor-pointer"
                  >
                    <div className="w-9 h-9 mb-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center group-hover:bg-[#0ea5e9] group-hover:text-white transition-colors border border-[#1e294b] shadow-sm">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase font-mono tracking-wide">Save a Copy</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Create a safe secure backup of all downloaded study files.</p>
                    </div>
                  </button>
                </div>
              </section>
            </div>
          )}

          {currentTab === 'library' && (
            <LibraryTab 
              files={files} 
              onGetFile={handleGetFile}
              activeUser={activeUser}
            />
          )}

          {currentTab === 'market' && (
            <MeshMarketTab 
              trendingFiles={files.filter(f => !f.coverUrl)} 
              onPullPacket={handleGetFile}
              syncedFilesMap={syncedFilesMap}
            />
          )}

          {currentTab === 'meshdrop' && (
            <MeshDropTab 
              transfers={transfers}
              peers={peers}
              onCancelTransfer={handleCancelTransfer}
              onUploadFile={handleUploadFile}
              showToast={showToast}
            />
          )}

          {currentTab === 'syncnote' && (
            <SyncNoteTab 
              showToast={showToast}
              activeUser={activeUser}
            />
          )}

          {currentTab === 'chat' && (
            <ChatTab 
              peers={peers}
              showToast={showToast}
            />
          )}

          {currentTab === 'peers' && (
            <PeersTab 
              peers={peers}
              onTogglePeerStatus={handleTogglePeerStatus}
              onAddCustomPeer={handleAddCustomPeer}
            />
          )}
        </main>
      </div>

      {/* Modern Phone Navigation Bar at Bottom for mobile */}
      <nav className="fixed bottom-0 left-0 w-full z-[120] flex justify-around items-center px-4 pb-6 pt-3 bg-[#0a0f1d]/95 backdrop-blur-xl border-t border-[#1e294b] md:hidden shadow-lg select-none">
        <button 
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            currentTab === 'home' ? 'text-sky-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase mt-1">Home</span>
        </button>

        <button 
          onClick={() => setCurrentTab('library')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            currentTab === 'library' ? 'text-sky-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase mt-1">Library</span>
        </button>

        <button 
          onClick={() => setCurrentTab('market')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            currentTab === 'market' ? 'text-sky-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase mt-1">Market</span>
        </button>

        <button 
          onClick={() => setCurrentTab('chat')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            currentTab === 'chat' ? 'text-sky-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase mt-1">Chat</span>
        </button>

        <button 
          onClick={() => setCurrentTab('meshdrop')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            currentTab === 'meshdrop' ? 'text-sky-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Send className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase mt-1">MeshDrop</span>
        </button>
      </nav>

      {/* Absolute Dynamic Overlay Toaster notifications list */}
      <div className="fixed bottom-24 right-6 space-y-2 z-[200] max-w-sm pointer-events-none select-none">
        <AnimatePresence>
          {customToasts.map(toast => (
            <motion.div 
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-4 rounded-2xl shadow-2xl flex items-start gap-2.5 border text-xs leading-relaxed backdrop-blur-md ${
                toast.type === 'success' 
                  ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800' 
                  : toast.type === 'warn'
                  ? 'bg-amber-950/90 text-amber-200 border-amber-800'
                  : 'bg-slate-900/90 border-[#1e294b] text-sky-200'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {toast.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : toast.type === 'warn' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-sky-400" />
                )}
              </div>
              <div>
                <p className="font-bold uppercase tracking-widest text-[9px] text-[#38bdf8] mb-0.5 font-mono">Mesh Beacon</p>
                <p className="font-sans font-medium text-slate-100">{toast.msg}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Visual Settings slideout modal drawer */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[150] flex items-center justify-end">
            {/* Dark blur backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            {/* Panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative w-full max-w-sm bg-[#0a0f1d] h-full shadow-2xl border-l border-[#1e294b] p-6 flex flex-col justify-between overflow-y-auto z-10"
            >
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-1.5 font-bold font-display text-white uppercase text-sm">
                    <Settings className="w-5 h-5 text-sky-400 animate-spin" />
                    Mesh Configuration
                  </div>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Bluetooth switch toggle */}
                  <div className="flex items-center justify-between p-4 bg-[#11192e] border border-[#1e294b] rounded-2xl select-none">
                    <div className="pr-2">
                      <h4 className="font-bold text-xs text-white">Bluetooth Study Share</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Allow classmates to find your shared study folders.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setBleEnabled(!bleEnabled);
                        showToast(bleEnabled ? 'Transmitter disabled' : 'Transmitter active', 'warn');
                      }}
                      className={`w-12 h-6 rounded-full p-1 transition-all shrink-0 ${
                        bleEnabled ? 'bg-sky-500 text-right' : 'bg-slate-700 text-left'
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-md inline-block transform" />
                    </button>
                  </div>

                  {/* Transmit Power select buttons */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Signal Strength Range</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['low', 'balanced', 'high'] as const).map(power => (
                        <button
                          key={power}
                          onClick={() => {
                            setTxPower(power);
                            showToast(`Set sharing signal strength range to ${power.toUpperCase()}`, 'info');
                          }}
                          className={`py-2 text-[10px] rounded-xl font-bold uppercase transition-all border cursor-pointer ${
                            txPower === power 
                              ? 'bg-sky-500 text-white border-sky-500 shadow-sm shadow-sky-500/10' 
                              : 'bg-slate-900 text-slate-300 border-[#1e294b] hover:bg-[#16223f]'
                          }`}
                        >
                          {power}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SQLite Database states readout list */}
                  <div className="p-4 bg-slate-950/80 border border-[#1e294b] rounded-2xl text-[10px] font-mono text-slate-300 space-y-2.5">
                    <p className="text-slate-500 font-bold uppercase tracking-wider select-none border-b border-[#1e294b] pb-1.5">OFFLINE STORAGE STATS</p>
                    <div className="flex justify-between">
                      <span>Offline Folder:</span>
                      <span className="text-sky-400 font-bold">meshlearn_storage</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Study lists:</span>
                      <span className="text-sky-400">documents, study packages, classmates</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Connected classmates:</span>
                      <span>{files.length} files, {peers.filter(p => p.status === 'active').length} classmates active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset handlers */}
              <div className="border-[#1e294b] pt-6 mt-6">
                <button 
                  onClick={handleMainReset}
                  className="w-full bg-red-950/45 hover:bg-red-900/40 text-red-400 border border-red-900/40 text-xs font-bold py-3 rounded-xl transition-all uppercase tracking-wider select-none cursor-pointer"
                >
                  Factory Local Database Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
