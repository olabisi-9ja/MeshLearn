import React, { useState, useRef } from 'react';
import { Send, Radio, UploadCloud, FileUp, Terminal, Play, CheckCircle, Info, Disc, ServerCrash, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ActiveTransfers from './ActiveTransfers';
import NetworkMetrics from './NetworkMetrics';
import { ActiveTransfer, PeerNode } from '../types';

interface MeshDropTabProps {
  transfers: ActiveTransfer[];
  onCancelTransfer: (id: string) => void;
  onUploadFile: (name: string, type: string, size: string) => void;
  peers: PeerNode[];
  showToast?: (msg: string, type: 'success' | 'info' | 'warn') => void;
}

export default function MeshDropTab({
  transfers,
  onCancelTransfer,
  onUploadFile,
  peers,
  showToast
}: MeshDropTabProps) {
  const [dragActive, setDragActive] = useState(false);
  
  // Segment data states for thesis specification bitfield monitoring
  const [chunks, setChunks] = useState([
    { index: 0, complete: true, loading: false },
    { index: 1, complete: true, loading: false },
    { index: 2, complete: true, loading: false },
    { index: 3, complete: false, loading: false },
    { index: 4, complete: false, loading: false }
  ]);
  const [isSimulatingChunks, setIsSimulatingChunks] = useState(false);

  // Computes progress
  const chunkCount = chunks.filter(c => c.complete).length;
  const chunkProgress = Math.round((chunkCount / chunks.length) * 100);

  const handleSimulateChunkDownload = () => {
    if (isSimulatingChunks) return;
    setIsSimulatingChunks(true);
    
    setBroadcastLogs(prev => [
      ...prev,
      'MeshDrop: Contacted peer Sarah Miller sitting 3 seats away',
      'Bitfield Handshaking: Client sent logical array [1, 1, 1, 0, 0]',
      'Bitfield Handshaking: Remote responded with array [1, 1, 1, 1, 1]',
      'P2P Sync: Identified disjoint elements [3, 4] for pipeline fetching'
    ]);

    // Animate Chunk 3 loading
    setChunks(prev => {
      const copy = [...prev];
      copy[3].loading = true;
      return copy;
    });

    setTimeout(() => {
      setChunks(prev => {
        const copy = [...prev];
        copy[3].loading = false;
        copy[3].complete = true;
        copy[4].loading = true; // start next
        return copy;
      });
      setBroadcastLogs(prev => [...prev, 'Completed: Pulled segmented 256KB block #3 over close Wi-Fi Direct!']);
    }, 2000);

    setTimeout(() => {
      setChunks(prev => {
        const copy = [...prev];
        copy[4].loading = false;
        copy[4].complete = true;
        return copy;
      });
      setBroadcastLogs(prev => [
        ...prev,
        'Completed: Pulled segmented 256KB block #4 over close Wi-Fi Direct!',
        'MeshDrop Success: File distributed_consensus_core.pdf compiled successfully! CRC32 checksum matches: 0x9D8C'
      ]);
      setIsSimulatingChunks(false);
      if (showToast) showToast('P2P segmented file download complete!', 'success');
    }, 4000);
  };

  const [broadcastLogs, setBroadcastLogs] = useState<string[]>([
    'System: Sharing interface initialized on your device',
    'System: Bluetooth sharing activated under My Device',
    'Ready: Sharing active study files (Calculus Study Guide, Psychology Lecture)'
  ]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [customFileName, setCustomFileName] = useState('');
  const [customFileType, setCustomFileType] = useState('PDF');
  const [customFileSize, setCustomFileSize] = useState('18 MB');
  const [showConfig, setShowConfig] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(file.size / 1024).toFixed(0)} KB`;
      const typeExt = file.name.split('.').pop()?.toUpperCase() || 'ZIP';
      
      onUploadFile(file.name, typeExt, sizeStr);
      
      setBroadcastLogs(prev => [
        ...prev,
        `Sharing: Added study file "${file.name}" (${sizeStr}) to your sharing drawer`,
        `System: Updated local file-sharing index`
      ]);
    }
  };

  const triggerUploadForm = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(file.size / 1024).toFixed(0)} KB`;
      const typeExt = file.name.split('.').pop()?.toUpperCase() || 'ZIP';

      onUploadFile(file.name, typeExt, sizeStr);

      setBroadcastLogs(prev => [
        ...prev,
        `Sharing: Sending file "${file.name}" over close-range Bluetooth`,
        `System: Syncing study list with nearby friends`
      ]);
    }
  };

  const triggerCustomFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFileName.trim()) return;

    let finalName = customFileName;
    if (!finalName.includes('.')) {
      finalName += `.${customFileType.toLowerCase()}`;
    }

    onUploadFile(finalName, customFileType, customFileSize);

    setBroadcastLogs(prev => [
      ...prev,
      `Shared: Created virtual study file "${finalName}" (${customFileSize})`,
      `Ready: Connection established for sharing`
    ]);

    setCustomFileName('');
    setShowConfig(false);
  };

  const handleBroadcastBeacon = () => {
    if (isBroadcasting) return;
    setIsBroadcasting(true);
    setBroadcastLogs(prev => [...prev, 'Searching: Finding classmates sitting close by...']);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step === 1) {
        setBroadcastLogs(prev => [...prev, 'Searching: Scanning Bluetooth frequencies for study buddies...']);
      } else if (step === 2) {
        setBroadcastLogs(prev => [...prev, "Found: Liam's MacBook and Emma's iPad detected! (Signal: Weak)"]);
      } else if (step === 3) {
        const activeNeighbors = peers.filter(p => p.status === 'active').map(p => p.name).join(', ');
        setBroadcastLogs(prev => [
          ...prev, 
          `Synced: Exchanged study lists with ${activeNeighbors}`,
          'Success: Fast Bluetooth connection established! Multi-peer speed: 100%'
        ]);
        setIsBroadcasting(false);
        clearInterval(interval);
      }
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Visual Header */}
      <section className="text-center md:text-left">
        <div className="mb-2 inline-flex items-center gap-1.5 bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider">
          <Disc className="w-3.5 h-3.5 animate-pulse text-sky-600" />
          STUDY SHARE ENGINE V2.0
        </div>
        <h2 className="font-display font-extrabold text-2xl md:text-3xl text-slate-800 leading-tight mb-4">
          Share study files with classmates nearby.
        </h2>

        {/* Action Triggers */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 text-xs uppercase tracking-wider select-none flex-1 md:flex-none"
          >
            <Send className="w-4 h-4 fill-white text-[#0ea5e9]" />
            Send Study File
          </button>
          
          <button 
            onClick={handleBroadcastBeacon}
            disabled={isBroadcasting}
            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-85 text-xs uppercase tracking-wider select-none flex-1 md:flex-none"
          >
            <Radio className={`w-4 h-4 text-[#0ea5e9] ${isBroadcasting ? 'animate-bounce' : ''}`} />
            {isBroadcasting ? 'Searching...' : 'Search for Classmates'}
          </button>
        </div>
      </section>

      {/* Dynamic Slideout Form for Custom Seeding */}
      <AnimatePresence>
        {showConfig && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-5 overflow-hidden"
          >
            <form onSubmit={triggerCustomFormSubmit} className="space-y-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold font-mono uppercase text-slate-500 tracking-wider">Create Virtual Study File</span>
                <button 
                  type="button" 
                  onClick={() => setShowConfig(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Study File Name</label>
                  <input 
                    type="text" 
                    value={customFileName}
                    onChange={(e) => setCustomFileName(e.target.value)}
                    placeholder="e.g. chemistry_lab_notes.pdf"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-sky-500/25"
                    required
                  />
                </div>
                
                <div className="w-full">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Format</label>
                  <select 
                    value={customFileType}
                    onChange={(e) => setCustomFileType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600 focus:ring-1"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="VIDEO">MP4 Video</option>
                    <option value="AUDIO">WAV Audio</option>
                    <option value="ZIP">ZIP Package</option>
                    <option value="TXT">TXT File</option>
                  </select>
                </div>

                <div className="w-full">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">File Size</label>
                  <input 
                    type="text" 
                    value={customFileSize}
                    onChange={(e) => setCustomFileSize(e.target.value)}
                    placeholder="e.g. 15 MB"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold py-2 text-xs rounded-xl transition-all uppercase"
              >
                Add to Sharing List
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Drag & Seeding Area */}
      <section>
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerUploadForm}
          className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
            dragActive 
              ? 'border-sky-500 bg-sky-50/20' 
              : 'border-slate-300 bg-white hover:border-sky-400 hover:bg-slate-50/40 shadow-sm'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden" 
          />
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mb-4 border border-sky-100 shadow-inner">
              <UploadCloud className="w-6 h-6 animate-pulse" />
            </div>
            <p className="font-semibold text-sm text-slate-700 select-none">
              Drag & Drop files here, or <span className="text-[#0ea5e9]">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-1 select-none font-mono">
              Supports PDF, Movies, Audio, ZIP up to 2.0 GB
            </p>
          </div>
        </div>
      </section>

      {/* Network Metrics Segment */}
      <NetworkMetrics speed={14.2} health={88} />

      {/* Queue Displays */}
      <ActiveTransfers 
        transfers={transfers}
        onCancelTransfer={onCancelTransfer}
      />

      {/* MeshDrop Segmented Chunk Transfer Bitfield Visualizer */}
      <section className="bg-slate-900/40 p-6 rounded-3xl border border-[#1e294b] shadow-xl text-slate-100 font-sans mb-8">
        <div className="flex items-center gap-2 mb-6 border-b border-[#1e294b]/60 pb-4 select-none">
          <Layers className="w-5 h-5 text-sky-450 animate-pulse" />
          <div>
            <h3 className="font-display font-extrabold text-white text-sm uppercase tracking-tight">MeshDrop Bitfield Chunks Monitor</h3>
            <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">Dynamic segment transfers. Files divide into 256KB blocks with secure verification hashes to allow multi-peer concurrent fetching and automatic resume on contact.</p>
          </div>
        </div>

        <div className="bg-[#050912] p-4 rounded-2xl border border-slate-900 space-y-4">
          <div className="flex justify-between items-center text-xs font-mono">
            <div>
              <span className="font-bold text-slate-100 select-all">File: distributed_consensus_core.pdf</span>
              <p className="text-[10px] text-slate-500 mt-1 uppercase">Block Div: 5 segments x 256KB • Total Size: 1.25 MB</p>
            </div>
            <div className="text-right">
              <span className="text-sky-400 font-bold block">{chunkProgress}% completed</span>
              <span className="text-[8px] text-slate-500 font-bold uppercase">{chunkProgress === 100 ? 'Immutable Hash verified' : 'Transfer paused'}</span>
            </div>
          </div>

          {/* Segment Blocks Row */}
          <div className="grid grid-cols-5 gap-2.5 pt-1 select-none">
            {chunks.map((chk, idx) => (
              <div key={idx} className="space-y-1.5 text-center">
                <motion.div
                  animate={chk.complete ? { scale: 1, filter: 'brightness(1)' } : chk.loading ? { scale: [1, 1.05, 1], filter: 'brightness(1.2)' } : {}}
                  transition={chk.loading ? { repeat: Infinity, duration: 1 } : {}}
                  className={`h-11 rounded-xl border flex items-center justify-center font-mono text-[10px] uppercase font-extrabold transition-all shadow-md ${
                    chk.complete
                      ? 'bg-emerald-950/70 border-emerald-500 text-emerald-450'
                      : chk.loading
                      ? 'bg-sky-950/40 border-sky-600 text-sky-450'
                      : 'bg-slate-905 border-slate-800 text-slate-600'
                  }`}
                >
                  {chk.complete ? 'OK' : chk.loading ? '...' : 'WAIT'}
                </motion.div>
                <p className="text-[8px] font-mono font-bold text-slate-500 text-center">BLK {idx}</p>
              </div>
            ))}
          </div>

          {/* Dynamic Bitfield array text */}
          <div className="bg-slate-950/40 p-3 rounded-xl font-mono text-[9px] text-slate-400 flex flex-wrap items-center justify-between gap-1 select-all">
            <span>BITFIELD STRING STATUS:</span>
            <span className="text-white font-extrabold text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
              [{chunks.map(c => c.complete ? '1' : '0').join(', ')}]
            </span>
          </div>

          {/* Simulate Action buttons */}
          {chunkProgress < 100 ? (
            <button
              onClick={handleSimulateChunkDownload}
              disabled={isSimulatingChunks}
              className="w-full bg-[#11192e] hover:bg-[#16223f] border border-[#1e294b] text-sky-400 font-extrabold py-3 text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer font-sans uppercase"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> {isSimulatingChunks ? 'Bitfield Exchange Handshake...' : 'Simulate Segment Auto-Resume Pull'}
            </button>
          ) : (
            <div className="bg-emerald-950/25 border border-emerald-800/40 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-250 select-none">
              <CheckCircle className="w-4 h-4 text-emerald-450" />
              <span>Full store-and-forward chunk replication verified. This device is now SEEDING this packet over local Wi-Fi buffers!</span>
            </div>
          )}
        </div>
      </section>

      {/* Live ledger console diagnostics */}
      <section className="bg-slate-900 rounded-3xl p-5 border border-slate-700 font-mono text-[10px] text-slate-300 shadow-xl relative overflow-hidden">
        <div className="absolute top-3 right-4 flex items-center gap-1">
          <Terminal className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[8px] text-slate-500 uppercase tracking-wider">Sharing Log</span>
        </div>
        
        <p className="text-slate-500 font-bold border-b border-slate-800 pb-2 mb-3 tracking-wider flex items-center gap-1.5 uppercase select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
          RECENT SHARING LOG
        </p>

        <div className="space-y-1.5 max-h-36 overflow-y-auto">
          {broadcastLogs.map((log, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-1"
            >
              <span className="text-sky-400 select-none">&gt;&gt;</span>
              <span className="break-all">{log}</span>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
