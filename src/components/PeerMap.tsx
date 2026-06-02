import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Radio, Layers, Wifi, Zap } from 'lucide-react';
import { PeerNode } from '../types';

interface PeerMapProps {
  peers: PeerNode[];
  onSelectPeer?: (peer: PeerNode) => void;
}

export default function PeerMap({ peers, onSelectPeer }: PeerMapProps) {
  const [selectedNode, setSelectedNode] = useState<PeerNode | null>(null);
  const [pulseScale, setPulseScale] = useState(1);
  const [driftSeed, setDriftSeed] = useState(0);

  // Periodic visual pulse effect for active nodes
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseScale(prev => (prev === 1 ? 1.15 : 1));
    }, 1500);
    return () => clearInterval(pulseInterval);
  }, []);

  // Periodic slow drifting sequence simulation for active ad-hoc mesh
  useEffect(() => {
    const driftInterval = setInterval(() => {
      setDriftSeed(prev => prev + 1);
    }, 2500);
    return () => clearInterval(driftInterval);
  }, []);

  // Classic classroom spatial node layout lookup anchors
  const defaultPositions: Record<string, { x: number; y: number }> = {
    'p-node-entry': { x: 270, y: 55 },
    'p-local': { x: 200, y: 110 },
    'p-alpha': { x: 125, y: 65 },
    'p-beta': { x: 110, y: 155 },
    'p-relay-1': { x: 325, y: 145 },
    'p-112': { x: 285, y: 105 },
  };

  // Derive dynamic coordinate drift offsets deterministically per node to avoid state lags
  const getDynamicCoords = (id: string, base: { x: number; y: number }) => {
    if (id === 'p-local' || id === 'local-your-device') {
      const theta = (driftSeed * 0.9) + (id.charCodeAt(0) || 1);
      return {
        x: base.x + Math.sin(theta) * 1.5,
        y: base.y + Math.cos(theta) * 1.5
      };
    }
    const theta = (driftSeed * 0.7) + (id.charCodeAt(0) || 5);
    return {
      x: base.x + Math.sin(theta) * 11,
      y: base.y + Math.cos(theta) * 8
    };
  };

  // Process mapping for all peer positions including dynamically added custom devices
  const mappedNodes = peers.map((p, idx) => {
    let base = defaultPositions[p.id];
    if (!base) {
      if (p.isLocal) {
        base = { x: 200, y: 110 };
      } else {
        // Arrange custom additions in mathematical elliptical orbit rings around the mesh center
        const totalOthers = Math.max(peers.length - 1, 1);
        const relativeIdx = peers.filter(f => !f.isLocal).findIndex(f => f.id === p.id);
        const angle = (relativeIdx >= 0 ? relativeIdx : idx) * ((2 * Math.PI) / totalOthers) + 0.5;
        base = {
          x: Math.round(200 + 120 * Math.cos(angle)),
          y: Math.round(110 + 70 * Math.sin(angle))
        };
      }
    }

    const dynamicRef = getDynamicCoords(p.id, base);
    return {
      peer: p,
      x: dynamicRef.x,
      y: dynamicRef.y,
    };
  });

  // Find center node to route connecting paths
  const localNode = mappedNodes.find(n => n.peer.isLocal) || mappedNodes.find(n => n.peer.id === 'p-local') || mappedNodes[0];

  return (
    <section className="mt-8 bg-[#0b1222]/90 rounded-3xl border border-slate-800/80 overflow-hidden relative shadow-2xl transition-all duration-300 select-none cyber-glow min-h-[300px]">
      {/* Blueprint Dot Pattern layout overlay */}
      <div 
        className="absolute inset-0 opacity-[0.14] pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Grid line accents */}
      <div className="absolute top-0 left-0 w-full h-full border border-dashed border-sky-500/5 pointer-events-none" />

      {/* Title Header Tag inside map */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-950/70 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-900/40 text-[9px] font-mono uppercase text-sky-400 font-extrabold tracking-widest z-20">
        <Layers className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
        Mesh Signal Topology
      </div>

      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-sky-950/40 px-2 py-1 rounded-lg border border-sky-900/30 text-[8px] font-mono text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>AD-HOC DRIFT ACTIVE</span>
      </div>

      <div className="p-4 md:p-6 flex flex-col justify-between min-h-[300px]">
        {/* Dynamic SVG connection map space */}
        <div className="relative w-full h-48 mt-8">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
            {/* Connection Paths (Lines drawn dynamically to active or relay status nodes) */}
            {mappedNodes.map(node => {
              if (node.peer.isLocal) return null;
              const isActive = node.peer.status === 'active';
              const isRelay = node.peer.status === 'relay';
              if (!isActive && !isRelay) return null;

              return (
                <g key={`link-${node.peer.id}`}>
                  {/* Glowing backdrop line */}
                  <motion.line 
                    animate={{
                      x1: localNode.x, y1: localNode.y,
                      x2: node.x, y2: node.y
                    }}
                    transition={{ type: "spring", stiffness: 35, damping: 15 }}
                    stroke={isRelay ? "#c084fc" : "#38bdf8"} 
                    strokeWidth="3.5" 
                    strokeOpacity="0.1"
                  />
                  {/* Real responsive connection path line */}
                  <motion.line 
                    animate={{
                      x1: localNode.x, y1: localNode.y,
                      x2: node.x, y2: node.y
                    }}
                    transition={{ type: "spring", stiffness: 35, damping: 15 }}
                    stroke={isRelay ? "#a855f7" : "#0ea5e9"} 
                    strokeWidth="1.5" 
                    strokeOpacity="0.45"
                    strokeDasharray={isRelay ? "4 4" : undefined}
                  />

                  {/* Simulated packet traveling along dynamic line coordinate paths */}
                  <motion.circle
                    r="3"
                    fill={isRelay ? "#d8b4fe" : "#c8fffb"}
                    animate={{
                      cx: [localNode.x, node.x, localNode.x],
                      cy: [localNode.y, node.y, localNode.y],
                    }}
                    transition={{
                      duration: isRelay ? 3.8 : 2.5 + (idToNum(node.peer.id) % 3),
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="shadow-sm"
                  />
                </g>
              );
            })}

            {/* Intersession Relay Bridge paths (Extra hops to demonstrate mesh capabilities) */}
            {mappedNodes.filter(n => n.peer.status === 'relay').map((relayNode, rIdx) => {
              const reachable = mappedNodes.filter(n => !n.peer.isLocal && n.peer.id !== relayNode.peer.id);
              if (reachable.length === 0) return null;
              // Link to a peer deterministically
              const destNode = reachable[rIdx % reachable.length];
              return (
                <g key={`relay-hop-${relayNode.peer.id}`}>
                  <motion.line
                    animate={{
                      x1: relayNode.x, y1: relayNode.y,
                      x2: destNode.x, y2: destNode.y
                    }}
                    transition={{ type: "spring", stiffness: 35, damping: 15 }}
                    stroke="#a855f7"
                    strokeWidth="1"
                    strokeOpacity="0.3"
                    strokeDasharray="2 3"
                  />
                </g>
              );
            })}
          </svg>

          {/* Graphical nodes layered perfectly over the SVG coordinates with spring-motion dynamics */}
          {mappedNodes.map(node => {
            const peerInfo = node.peer;
            const isActive = peerInfo.status === 'active';
            const isLocal = peerInfo.isLocal;
            const isRelay = peerInfo.status === 'relay';

            return (
              <motion.div
                key={node.peer.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                animate={{
                  left: `${(node.x / 400) * 100}%`,
                  top: `${(node.y / 200) * 100}%`
                }}
                transition={{ type: "spring", stiffness: 35, damping: 15 }}
                onClick={() => {
                  setSelectedNode(prev => prev?.id === peerInfo.id ? null : peerInfo);
                  if (onSelectPeer) onSelectPeer(peerInfo);
                }}
                onMouseEnter={() => {
                  setSelectedNode(peerInfo);
                  if (onSelectPeer) onSelectPeer(peerInfo);
                }}
                onMouseLeave={() => setSelectedNode(null)}
              >
                {/* Visual tactile peer node representation */}
                <div className="relative group/node">
                  {/* Multi-layered animated signal rings which pulse synchronously */}
                  {(isLocal || isActive || isRelay) && (
                    <div 
                      className={`absolute -inset-3.5 rounded-full duration-1000 select-none pointer-events-none transition-all ${
                        isLocal 
                          ? 'bg-sky-500/10 border border-sky-400/20' 
                          : isRelay
                          ? 'bg-purple-500/10 border border-purple-400/20'
                          : 'bg-emerald-500/10 border border-emerald-400/20'
                      }`}
                      style={{ transform: `scale(${isLocal ? pulseScale : pulseScale * 0.95})` }}
                    />
                  )}

                  {/* Core sensory component */}
                  <div 
                    className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all duration-300 shadow-md ${
                      isLocal 
                        ? 'bg-gradient-to-br from-sky-400 to-indigo-600 border-sky-200 text-white scale-115 shadow-sky-500/25' 
                        : isRelay
                        ? 'bg-purple-650 border-purple-400 text-white hover:scale-110 shadow-purple-500/15'
                        : isActive
                        ? 'bg-emerald-500 border-emerald-300 text-white hover:scale-110 shadow-emerald-500/15' 
                        : 'bg-slate-950 border-slate-800 text-slate-500 opacity-55 hover:opacity-100 hover:border-slate-700'
                    }`}
                  >
                    {isLocal ? (
                      <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
                    ) : isRelay ? (
                      <Zap className="w-3.5 h-3.5 text-purple-200" />
                    ) : (
                      <Network className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-100' : 'text-slate-500'}`} />
                    )}
                  </div>

                  {/* Embedded high-contrast typography tag labels */}
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-slate-950/95 text-slate-200 border border-slate-800 rounded-lg px-2 py-1 text-[8px] font-mono leading-none pointer-events-none opacity-0 group-hover/node:opacity-100 transition-opacity duration-200 shadow-xl whitespace-nowrap z-30">
                    <span className="font-bold">{peerInfo.name}</span>
                    {isLocal && <span className="text-sky-450 font-black ml-1">(YOU)</span>}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Detail telemetry inspection panel on hover */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.93, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 5 }}
                className="absolute top-0 right-2 w-48 bg-slate-955/95 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3.5 text-white z-20 shadow-2xl text-[11px] font-sans"
              >
                <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-slate-800/60">
                  <span className={`w-2 h-2 rounded-full ${selectedNode.isLocal ? 'bg-sky-400' : selectedNode.status === 'active' ? 'bg-emerald-450' : selectedNode.status === 'relay' ? 'bg-purple-400' : 'bg-slate-500'}`} />
                  <p className="font-bold font-mono tracking-tight text-slate-200 truncate">{selectedNode.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-y-1 font-mono text-[10px] text-slate-400 leading-none">
                  <span>Ping Delay:</span>
                  <span className="text-right text-emerald-450 font-bold">{selectedNode.isLocal ? '0ms' : `${selectedNode.latencyMs}ms`}</span>
                  
                  <span>Shared:</span>
                  <span className="text-right text-sky-405 font-bold">{selectedNode.sharedFilesCount} files</span>
                  
                  <span>Role:</span>
                  <span className="text-right text-purple-400 capitalize font-bold">{selectedNode.isLocal ? 'Local Host' : selectedNode.status}</span>
                  
                  <span>Connection:</span>
                  <span className="text-right text-indigo-400 font-bold">Secure BLE</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic mesh coordination status banner */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-950/80 border border-slate-900 px-4 py-2.5 rounded-2xl shadow-inner z-20 gap-3">
          <span className="text-xs font-bold text-slate-350 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            Classroom Signal: <span className="text-[#38bdf8] font-extrabold uppercase font-mono tracking-wider ml-0.5">EXCELLENT</span>
          </span>
          <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">
            {peers.filter(p => p.status === 'active').length} connected • {peers.filter(p => p.status === 'relay').length} hops routing
          </span>
        </div>
      </div>
    </section>
  );
}

// Convert unique node ID to constant number seed
function idToNum(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return sum;
}
