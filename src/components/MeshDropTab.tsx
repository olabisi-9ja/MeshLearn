import React, { useState, useRef } from 'react';
import { Send, Radio, UploadCloud, FileUp, Terminal, Play, CheckCircle, Info, Disc, ServerCrash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ActiveTransfers from './ActiveTransfers';
import NetworkMetrics from './NetworkMetrics';
import { ActiveTransfer, PeerNode } from '../types';

interface MeshDropTabProps {
  transfers: ActiveTransfer[];
  onCancelTransfer: (id: string) => void;
  onUploadFile: (name: string, type: string, size: string) => void;
  peers: PeerNode[];
}

export default function MeshDropTab({
  transfers,
  onCancelTransfer,
  onUploadFile,
  peers
}: MeshDropTabProps) {
  const [dragActive, setDragActive] = useState(false);
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
