import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Network, Radio, Layers } from 'lucide-react';
import { PeerNode } from '../types';

interface PeerMapProps {
  peers: PeerNode[];
  onSelectPeer?: (peer: PeerNode) => void;
}

export default function PeerMap({ peers, onSelectPeer }: PeerMapProps) {
  const [selectedNode, setSelectedNode] = useState<PeerNode | null>(null);
  const [pulseScale, setPulseScale] = useState(1);

  // Periodic pulse effect for the rings
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseScale(prev => (prev === 1 ? 1.15 : 1));
    }, 1500);
    return () => clearInterval(pulseInterval);
  }, []);

  // Map PeerNode objects to 2D coordinates for the visualization
  // Centered at (200, 100) or responsive percentages
  const nodePositions = [
    { id: 'p-node-entry', x: 260, y: 50, label: "Alexander's iPad" },
    { id: 'p-local', x: 200, y: 110, label: 'Your Device' },
    { id: 'p-alpha', x: 120, y: 60, label: 'Library Shared Hub' },
    { id: 'p-beta', x: 110, y: 150, label: "Liam's MacBook" },
    { id: 'p-relay-1', x: 320, y: 140, label: 'Study Room Router' },
    { id: 'p-112', x: 290, y: 100, label: "Sarah's iPhone" },
  ];

  return (
    <section className="mt-8 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative shadow-sm hover:border-slate-300 transition-colors">
      {/* Blueprint Dot Pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.12] pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(#0ea5e9 1.5px, transparent 1.5px)',
          backgroundSize: '20px 20px'
        }}
      />

      {/* Grid line accents */}
      <div className="absolute top-0 left-0 w-full h-full border border-dashed border-blue-500/5 pointer-events-none" />

      {/* Title Header Tag inside map */}
      <div className="absolute top-3 left-4 flex items-center gap-1.5 bg-slate-900/5 backdrop-blur px-2.5 py-1 rounded-md border border-slate-200/40 text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider z-20">
        <Layers className="w-3.5 h-3.5 text-blue-500" />
        CLASSROOM SIGNAL MAP
      </div>

      <div className="p-4 md:p-6 flex flex-col justify-between h-64">
        {/* Connection Space */}
        <div className="relative w-full h-40 mt-3">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
            {/* Connection Paths (Lines between nodes) */}
            <motion.line 
              x1="200" y1="110" x2="260" y2="50" 
              stroke="#0ea5e9" strokeWidth="1.5" strokeOpacity="0.25"
              strokeDasharray="4 2"
            />
            <motion.line 
              x1="200" y1="110" x2="120" y2="60" 
              stroke="#0ea5e9" strokeWidth="1.5" strokeOpacity="0.25"
              strokeDasharray="4 2"
            />
            <motion.line 
              x1="200" y1="110" x2="110" y2="150" 
              stroke="#0ea5e9" strokeWidth="1.5" strokeOpacity="0.15"
            />
            <motion.line 
              x1="120" y1="60" x2="110" y2="150" 
              stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.15"
            />
            <motion.line 
              x1="200" y1="110" x2="290" y2="100" 
              stroke="#0ea5e9" strokeWidth="1.5" strokeOpacity="0.35"
            />
            <motion.line 
              x1="260" y1="50" x2="320" y2="140" 
              stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.2"
            />
            <motion.line 
              x1="290" y1="100" x2="320" y2="140" 
              stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.3"
              strokeDasharray="3 3"
            />

            {/* Simulated Packet Pulse Travelling */}
            <motion.circle
              r="3.5"
              fill="#0ea5e9"
              initial={{ offset: 0 }}
              animate={{
                cx: [200, 260, 200],
                cy: [110, 50, 110],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.circle
              r="3"
              fill="#c8fffb"
              animate={{
                cx: [120, 200, 120],
                cy: [60, 110, 60],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <motion.circle
              r="3"
              fill="#10b981"
              animate={{
                cx: [200, 290, 200],
                cy: [110, 100, 110],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeIn"
              }}
            />
          </svg>

          {/* Interactive node elements overlaying the SVG */}
          {nodePositions.map(pos => {
            const peerInfo = peers.find(p => p.id === pos.id) || {
              id: pos.id,
              name: pos.label,
              status: 'inactive' as const,
              signalStrength: 1,
              latencyMs: 150,
              isLocal: false,
              sharedFilesCount: 0
            };

            const isActive = peerInfo.status === 'active';
            const isLocal = peerInfo.isLocal;
            const isRelay = peerInfo.status === 'relay';

            return (
              <div
                key={pos.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                style={{ left: `${(pos.x / 400) * 100}%`, top: `${(pos.y / 200) * 100}%` }}
                onMouseEnter={() => {
                  setSelectedNode(peerInfo);
                  if (onSelectPeer) onSelectPeer(peerInfo);
                }}
                onMouseLeave={() => setSelectedNode(null)}
              >
                {/* Visual node indicators */}
                <div className="relative group/node">
                  {/* Outer animated glow ring for select/local nodes */}
                  {(isLocal || isActive) && (
                    <div 
                      className={`absolute -inset-2.5 rounded-full duration-1000 ${
                        isLocal 
                          ? 'bg-sky-500/10 border border-sky-500/20' 
                          : 'bg-emerald-500/10 border border-emerald-500/20'
                      }`}
                      style={{ transform: `scale(${pulseScale})` }}
                    />
                  )}

                  {/* Core Node circle */}
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shadow-sm transition-all duration-300 ${
                      isLocal 
                        ? 'bg-sky-500 border-white text-white scale-110' 
                        : isRelay
                        ? 'bg-purple-600 border-white text-white'
                        : isActive
                        ? 'bg-emerald-500 border-white text-white' 
                        : 'bg-white border-slate-300 text-slate-400 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {isLocal ? (
                      <Radio className="w-3 h-3 text-white" />
                    ) : (
                      <Network className="w-3 h-3" />
                    )}
                  </div>

                  {/* Node label */}
                  <div className="absolute top-7 left-1/2 transform -translate-x-1/2 bg-slate-900/80 text-white rounded px-1.5 py-0.5 text-[8px] font-mono leading-none pointer-events-none opacity-0 group-hover/node:opacity-100 transition-opacity whitespace-nowrap">
                    {pos.label} {isLocal && '(You)'}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Floated detailed inspection hover card */}
          {selectedNode && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-0 right-2 w-44 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg p-2.5 text-white z-30 shadow-lg text-[11px]"
            >
              <p className="font-bold font-mono tracking-tight text-blue-300 truncate">{selectedNode.name}</p>
              <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 mt-1 pt-1 border-t border-slate-700/50 font-mono text-slate-300 font-sans text-[10px]">
                <span>Connection:</span>
                <span className="text-right text-emerald-400 font-bold">{selectedNode.isLocal ? '0ms' : `${selectedNode.latencyMs}ms delay`}</span>
                
                <span>Shared:</span>
                <span className="text-right text-white font-bold">{selectedNode.sharedFilesCount} files</span>
                
                <span>Status:</span>
                <span className="text-right text-purple-300 capitalize font-bold">{selectedNode.isLocal ? 'Active' : selectedNode.status}</span>
                
                <span>Signal:</span>
                <span className="text-right text-indigo-300 font-bold">Fast</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bottom Banner tag */}
        <div className="flex justify-between items-center bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200 shadow-sm z-20">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            Classroom Signal Connection: <span className="text-sky-500 font-bold">EXCELLENT</span>
          </span>
          <span className="text-[10px] font-mono font-bold text-slate-400">STUDY NETWORK</span>
        </div>
      </div>
    </section>
  );
}
