import React, { useState, useEffect } from 'react';
import { Radio, Download, Users, RefreshCw, Sparkles, Check, FileCheck, Shield, Disc, Network, Megaphone, AlarmClock, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MeshFile } from '../types';
import PeerMap from './PeerMap';
import { INITIAL_PEERS } from '../data';
import { SQLiteEngine, SQLiteCrowdnetAlert } from './SQLiteDB';

interface MeshMarketTabProps {
  trendingFiles: MeshFile[];
  onPullPacket: (file: MeshFile) => void;
  syncedFilesMap: Record<string, 'syncing' | 'synced' | 'none'>;
}

export default function MeshMarketTab({
  trendingFiles,
  onPullPacket,
  syncedFilesMap
}: MeshMarketTabProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgressText, setScanProgressText] = useState('Standby');
  const [localPeers, setLocalPeers] = useState(INITIAL_PEERS);
  const [discoveredCount, setDiscoveredCount] = useState(12);

  // CrowdNet states
  const [alerts, setAlerts] = useState<SQLiteCrowdnetAlert[]>([]);
  const [newNoticeText, setNewNoticeText] = useState('');
  const [noticeMinutesTTL, setNoticeMinutesTTL] = useState(240);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = () => {
    const loaded = SQLiteEngine.getCrowdnetAlerts();
    setAlerts(loaded);
  };

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeText.trim()) return;

    SQLiteEngine.insertCrowdnetAlert(newNoticeText, 'u-self', 'You', noticeMinutesTTL);
    setNewNoticeText('');
    loadAlerts();
  };

  const startDiscoveryScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgressText('Scanning nearby signals...');
    
    // Tweak peer data during scan for dynamic visual effect
    setTimeout(() => {
      setScanProgressText("Connecting to Alexander's iPad...");
    }, 1000);

    setTimeout(() => {
      setScanProgressText('Getting study files list...');
      // Activate inactive peers in simulations
      setLocalPeers(prev => prev.map(p => {
        if (!p.isLocal) {
          return {
            ...p,
            status: 'active',
            latencyMs: Math.max(8, p.latencyMs - 15)
          };
        }
        return p;
      }));
      setDiscoveredCount(42);
    }, 2500);

    setTimeout(() => {
      setIsScanning(false);
      setScanProgressText('Search Complete');
    }, 4000);
  };

  const getFormatBadgeColor = (type: string) => {
    switch (type) {
      case 'PDF':
        return 'bg-red-500 text-white';
      case 'VIDEO':
        return 'bg-purple-500 text-white';
      case 'AUDIO':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Discovery Hero Section */}
      <section className="bg-[#0ea5e9] rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-sky-500/10 relative overflow-hidden">
        {/* Abstract vector backgrounds */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur rounded-full text-[10px] font-bold font-mono uppercase tracking-wider mb-2 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-sky-200 fill-sky-200" />
              NEARBY SEARCH V2.0
            </div>
            <h2 className="font-display font-extrabold text-2xl md:text-3xl leading-tight mb-2">
              Ready to study together?
            </h2>
            <p className="text-sky-100 text-sm mb-6 max-w-sm font-sans">
              Find and download notes, audios, and guidelines uploaded by classmates near you without using any mobile data or Wi-Fi!
            </p>
            
            <button 
              onClick={startDiscoveryScan}
              disabled={isScanning}
              className="bg-white text-[#0ea5e9] font-extrabold px-6 py-3.5 rounded-xl flex items-center gap-2.5 transition-all active:scale-[0.98] shadow-lg hover:bg-sky-50 mx-auto md:mx-0 disabled:opacity-90 select-none text-xs uppercase tracking-wide cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Searching...' : 'Find Nearby Files'}
            </button>
          </div>

          {/* Animated Pulsing Radial decor resembling radar */}
          <div className="relative flex items-center justify-center w-40 h-40">
            {/* Pulsing Ring Backdrops */}
            <motion.div 
              animate={{ scale: [1, 1.4], opacity: [0.35, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeOut' }}
              className="absolute w-28 h-28 rounded-full border border-white/30"
            />
            <motion.div 
              animate={{ scale: [1, 1.6], opacity: [0.25, 0] }}
              transition={{ repeat: Infinity, duration: 3, delay: 1, ease: 'easeOut' }}
              className="absolute w-28 h-28 rounded-full border border-white/20"
            />

            {/* Central glowing beacon sensor item */}
            <div 
              onClick={startDiscoveryScan}
              className="relative w-24 h-24 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex flex-col items-center justify-center text-center shadow-lg cursor-pointer hover:bg-white/20 active:scale-95 transition-all select-none"
            >
              <Radio className={`w-7 h-7 text-white ${isScanning ? 'animate-pulse' : ''}`} />
              <span className="text-[9px] font-mono font-bold uppercase mt-1 tracking-wider text-sky-100">
                {isScanning ? 'SCAN...' : 'SCAN'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic scan progress bar under scanner */}
        {isScanning && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 4, ease: 'easeOut' }}
              className="h-full bg-sky-300"
            />
          </div>
        )}
      </section>

      {/* Discovered Banner Indicator */}
      {scanProgressText !== 'Standby' && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-sky-50 border border-sky-200/50 rounded-xl p-3 flex justify-between items-center text-xs font-mono font-bold select-none text-sky-700"
        >
          <span className="flex items-center gap-1.5 uppercase">
            <Disc className="w-4 h-4 animate-spin text-[#0ea5e9]" />
            {scanProgressText}
          </span>
          <span className="bg-[#0ea5e9] text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
            Devices Detected: {discoveredCount}
          </span>
        </motion.div>
      )}

      {/* Trending in Local Mesh Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg text-slate-800">Popular Files Nearby</h2>
          <span className="text-xs font-bold text-[#0ea5e9] uppercase font-sans tracking-wide">
            Range: Sitting Nearby
          </span>
        </div>

        {/* Bento-style Grid of Files */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trendingFiles.map(file => {
            const pullState = syncedFilesMap[file.id] || 'none';
            return (
              <div 
                key={file.id}
                className="bg-white border border-slate-200/80 p-5 rounded-2xl relative group hover:border-[#0ea5e9] hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Visual Type Badge */}
                <div className={`absolute top-4 right-4 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded shadow-sm ${getFormatBadgeColor(file.type)}`}>
                  {file.type}
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 text-[#0ea5e9] group-hover:bg-sky-50/50 transition-colors">
                    {file.type === 'PDF' ? (
                      <Network className="w-5 h-5 text-[#0ea5e9]" />
                    ) : (
                      <Radio className="w-5 h-5 text-[#0ea5e9]" />
                    )}
                  </div>
                  <div className="min-w-0 pr-10">
                    <h3 className="font-semibold text-sm text-slate-800 truncate select-all">{file.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">{file.size} • {file.peers} friends sharing</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                  {/* Simulated peer avatars hosting */}
                  <div className="flex -space-x-1.5 select-none font-sans">
                    <div className="w-6 h-6 rounded-full border border-white bg-slate-200 shadow-sm flex items-center justify-center text-[8px] font-bold text-slate-500">
                      Alex
                    </div>
                    <div className="w-6 h-6 rounded-full border border-white bg-sky-100 shadow-sm flex items-center justify-center text-[8px] font-bold text-[#0ea5e9]">
                      Sarah
                    </div>
                    {file.peers > 2 && (
                      <div className="w-6 h-6 rounded-full border border-white bg-slate-900 text-white shadow-sm flex items-center justify-center text-[8px] font-bold font-mono">
                        +{file.peers - 2}
                      </div>
                    )}
                  </div>

                  {/* Sync Pull Trigger Trigger buttons */}
                  {pullState === 'syncing' ? (
                    <button 
                      disabled
                      className="bg-slate-100 text-slate-400 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-inner pointer-events-none"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                      Downloading...
                    </button>
                  ) : pullState === 'synced' ? (
                    <button 
                      disabled
                      className="bg-green-100 text-green-700 text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1 shadow-inner pointer-events-none"
                    >
                      <Check className="w-4 h-4 font-bold" /> Saved Offline
                    </button>
                  ) : (
                    <button 
                      onClick={() => onPullPacket(file)}
                      className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white min-w-[120px] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all text-nowrap cursor-pointer"
                    >
                      Download File
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CrowdNet Epidemic Gossip notices block */}
      <section className="bg-slate-900/30 p-6 rounded-3xl border border-[#1e294b] shadow-xl text-slate-100 font-sans mb-8">
        <div className="flex items-center gap-2 mb-6 border-b border-[#1e294b]/60 pb-4 select-none">
          <Megaphone className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="font-display font-extrabold text-white text-sm uppercase tracking-tight">CrowdNet Gossip Alerts / Notices</h3>
            <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">Epidemic multi-hop emergency notice relays. No cloud is involved — messages carry forward node-to-node.</p>
          </div>
        </div>

        {/* Input box */}
        <form onSubmit={handleCreateNotice} className="bg-slate-950/70 p-4 rounded-2xl border border-slate-900 space-y-3 mb-6">
          <label className="text-[9px] font-mono font-bold tracking-wider text-slate-500 uppercase block">Broadcast Campus Emergency Notice</label>
          
          <input
            type="text"
            value={newNoticeText}
            onChange={(e) => setNewNoticeText(e.target.value)}
            className="w-full bg-[#070b14] border border-[#1e294b] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition-all"
            placeholder="e.g., Final Exam room changed to Hall B, wifi is down."
          />

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-1.5">
              <AlarmClock className="w-4 h-4 text-slate-500" />
              <span className="text-[10px] font-semibold text-slate-400">Time-To-Live (TTL):</span>
              <select
                value={noticeMinutesTTL}
                onChange={(e) => setNoticeMinutesTTL(Number(e.target.value))}
                className="bg-slate-900 text-slate-200 border border-slate-850 px-2 py-1 text-[10px] rounded focus:outline-none focus:border-amber-500 font-bold cursor-pointer"
              >
                <option value={60}>1 Hour TTL</option>
                <option value={240}>4 Hours TTL</option>
                <option value={1440}>24 Hours TTL</option>
              </select>
            </div>

            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-5 py-2 rounded-xl text-[11px] transition-all shrink-0 cursor-pointer text-center font-sans uppercase"
            >
              rel_broadcast notices
            </button>
          </div>
        </form>

        {/* Real-time notices cards */}
        <div className="space-y-3">
          <h4 className="font-mono text-[9px] uppercase font-bold text-slate-500 tracking-wider">Active Relayed Notices</h4>
          {alerts.length === 0 ? (
            <p className="text-[10px] text-slate-500 font-medium">No epidemic notices currently in local storage buffer.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {alerts.map(al => (
                <div key={al.alert_id} className="bg-[#050912]/80 p-4 rounded-xl border border-[#1e294b] hover:border-amber-500/30 transition-all flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-100 leading-relaxed font-sans">{al.message}</p>
                      <span className="text-[9px] text-[#38bdf8] font-mono mt-1.5 block">RELAY SENDER: {al.sender_name} ({al.sender_peer_id})</span>
                    </div>
                    <span className="text-[9px] bg-amber-950/40 text-amber-400 border border-amber-900/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide font-mono flex-shrink-0 select-none">
                      Hops: {al.hop_count}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 pt-3 border-t border-[#1e294b]/40 mt-2 select-none">
                    <span>CREATED: {al.created_at}</span>
                    <span className="text-amber-500 font-bold">EXPIRES: {al.expires_at}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Embedded interactive Topology Peer Map */}
      <PeerMap peers={localPeers} />
    </div>
  );
}
