import React, { useState } from 'react';
import { Wifi, Radio, AlertTriangle, ShieldAlert, PlusCircle, CheckCircle2, RefreshCw, XCircle, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { PeerNode } from '../types';
import PeerMap from './PeerMap';

interface PeersTabProps {
  peers: PeerNode[];
  onTogglePeerStatus: (id: string) => void;
  onAddCustomPeer: (name: string, isLocal: boolean, sharedFilesCount: number) => void;
}

export default function PeersTab({
  peers,
  onTogglePeerStatus,
  onAddCustomPeer
}: PeersTabProps) {
  const [newPeerName, setNewPeerName] = useState('');
  const [newSharedCount, setNewSharedCount] = useState(15);
  const [isAdding, setIsAdding] = useState(false);

  const getSignalIcon = (strength: number, status: string) => {
    const color = status === 'active' 
      ? 'text-emerald-500 fill-emerald-100' 
      : status === 'relay' 
      ? 'text-purple-500 fill-purple-100' 
      : 'text-slate-300';

    return (
      <div className="flex gap-0.5 items-end h-3">
        <div className={`w-1 h-1.5 rounded-full ${strength >= 1 ? color : 'bg-slate-200'}`} />
        <div className={`w-1 h-2 rounded-full ${strength >= 2 ? color : 'bg-slate-200'}`} />
        <div className={`w-1 h-3 rounded-full ${strength >= 3 ? color : 'bg-slate-200'}`} />
        <div className={`w-1 h-4 rounded-full ${strength >= 4 ? color : 'bg-slate-200'}`} />
      </div>
    );
  };

  const handleCreatePeerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeerName.trim()) return;

    onAddCustomPeer(newPeerName.toUpperCase(), false, newSharedCount);
    setNewPeerName('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Topology Intro Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-802 text-white">Classmates Sharing Nearby</h2>
          <p className="text-sm text-slate-400">See who is active nearby and sharing study resources currently.</p>
        </div>

        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-505 text-white font-black py-3 px-5 rounded-xl text-xs flex items-center justify-center gap-1.5 select-none active:scale-95 transition-all shadow-md uppercase tracking-wider cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Add Classmate Device
        </button>
      </section>

      {/* Visual interactive ad-hoc signal map with dynamic routing links */}
      <PeerMap peers={peers} />

      {/* Slideout Add form */}
      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-slate-50 border border-slate-200 rounded-2xl p-5"
        >
          <form onSubmit={handleCreatePeerSubmit} className="space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider">Add Classmate's Shared Folder</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Classmate's Name / Device</label>
                <input 
                  type="text"
                  value={newPeerName}
                  onChange={(e) => setNewPeerName(e.target.value)}
                  placeholder="e.g. SOPHIA'S MACBOOK"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Number of Shared Files</label>
                <input 
                  type="number"
                  value={newSharedCount}
                  onChange={(e) => setNewSharedCount(Number(e.target.value))}
                  placeholder="e.g. 15"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white py-2 text-xs font-bold rounded-xl uppercase transition-all cursor-pointer"
            >
              Connect Classroom Device
            </button>
          </form>
        </motion.div>
      )}

      {/* Signal warning panel regarding offline logic */}
      <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold uppercase tracking-wider">Study Share Classroom Status</p>
          <p className="leading-relaxed text-amber-700/90 font-sans">
            These classmate devices communicate directly with yours. If a device has a weaker connection signal, files might download slightly slower. Turn classmates on/off to test how the study guide is automatically routed from device to device.
          </p>
        </div>
      </section>

      {/* Grid of Peers with signal strength indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {peers.map((peer) => {
          const isActive = peer.status === 'active';
          const isRelay = peer.status === 'relay';
          
          return (
            <div 
              key={peer.id}
              className={`bg-white p-5 rounded-2xl border transition-all ${
                isActive 
                  ? 'border-slate-200 hover:border-emerald-300' 
                  : isRelay 
                  ? 'border-slate-200 hover:border-purple-300' 
                  : 'border-slate-200/50 opacity-60 hover:opacity-100 hover:border-slate-300'
              } shadow-sm flex flex-col justify-between h-44`}
            >
              <div className="flex justify-between items-start">
                <div className="min-w-0 pr-6">
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    isActive 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : isRelay
                      ? 'bg-purple-50 text-purple-600 border border-purple-100' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {isActive ? 'Connected' : isRelay ? 'Classroom Relay' : 'Offline'}
                  </span>
                  <h3 className="font-semibold text-sm text-slate-800 tracking-tight font-display mt-2 truncate select-all">
                    {peer.name} {peer.isLocal && '(You)'}
                  </h3>
                </div>

                {getSignalIcon(peer.signalStrength, peer.status)}
              </div>

              {/* Ping Metrics */}
              <div className="grid grid-cols-2 gap-y-1.5 p-3 bg-slate-50 border border-slate-100/50 rounded-xl text-[10px] font-mono leading-relaxed text-slate-500 font-medium">
                <div>
                  <span className="font-bold">Signal speed:</span>
                  <p className={`font-bold mt-0.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {peer.isLocal ? 'Super Fast' : `${peer.latencyMs}ms check`}
                  </p>
                </div>
                <div>
                  <span className="font-bold">Shared:</span>
                  <p className="text-slate-800 font-bold mt-0.5">{peer.sharedFilesCount} files</p>
                </div>
              </div>

              {/* State Dial switcher */}
              {!peer.isLocal && (
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Connection:</span>
                  <button
                    onClick={() => onTogglePeerStatus(peer.id)}
                    className={`px-3 py-1 text-[9px] font-bold rounded-lg border transition-all cursor-pointer ${
                      peer.status === 'active' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' 
                        : peer.status === 'relay'
                        ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {peer.status === 'active' ? 'Disconnect' : 'Reconnect'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
