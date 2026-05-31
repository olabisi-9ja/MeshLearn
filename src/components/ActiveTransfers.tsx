import { Play, Pause, X, FileText, Film, FolderArchive, Terminal, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { ActiveTransfer } from '../types';

interface ActiveTransfersProps {
  transfers: ActiveTransfer[];
  onCancelTransfer: (id: string) => void;
  onTogglePause?: (id: string) => void;
  pausedIds?: string[];
}

export default function ActiveTransfers({
  transfers,
  onCancelTransfer,
  onTogglePause,
  pausedIds = []
}: ActiveTransfersProps) {
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'VIDEO':
        return <Film className="w-5 h-5 text-purple-500" />;
      case 'ZIP':
        return <FolderArchive className="w-5 h-5 text-blue-500" />;
      default:
        return <Terminal className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-base text-slate-800">Active Transfers</h3>
        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          {transfers.length} Total
        </span>
      </div>

      {transfers.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-sm">
          <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">All transmissions synchronized</p>
          <p className="text-xs text-slate-400 mt-1">Ready to sync or seed new educational payloads.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transfers.map((item) => {
            const isPaused = pausedIds.includes(item.id);
            return (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      {getIcon(item.type)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-800 truncate select-all">{item.name}</h4>
                      <p className="text-[11px] text-slate-400 font-medium truncate">
                        {item.direction === 'incoming' 
                          ? `From: ${item.peerName} • ${item.sizeLeft}` 
                          : `Syncing to: ${item.peerName} • seeding`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right mr-1">
                      <span className={`text-sm font-extrabold font-display ${isPaused ? 'text-slate-400' : 'text-blue-600'}`}>
                        {item.progress}%
                      </span>
                      <p className="text-[9px] text-slate-400 uppercase font-mono font-bold tracking-wider">
                        {isPaused ? 'Paused' : item.eta}
                      </p>
                    </div>

                    {/* Interactive controls */}
                    <div className="flex items-center gap-1">
                      {onTogglePause && (
                        <button
                          onClick={() => onTogglePause(item.id)}
                          className="w-7 h-7 bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                          title={isPaused ? 'Resume Transfer' : 'Pause Transfer'}
                        >
                          {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                        </button>
                      )}
                      
                      <button
                        onClick={() => onCancelTransfer(item.id)}
                        className="w-7 h-7 bg-slate-50 border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                        title="Cancel Sync"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress track & dynamic background reveal */}
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                  <motion.div 
                    className={`h-full rounded-full ${isPaused ? 'bg-slate-400' : 'bg-blue-600'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
