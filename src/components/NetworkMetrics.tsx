import { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface NetworkMetricsProps {
  health?: number;
  speed?: number;
  onRefresh?: () => void;
}

export default function NetworkMetrics({ health = 88, speed = 14.2, onRefresh }: NetworkMetricsProps) {
  const [liveSpeed, setLiveSpeed] = useState(speed);
  const [liveHealth, setLiveHealth] = useState(health);
  const [history, setHistory] = useState<number[]>([40, 55, 75, 80, 95, 85, 70, 60, 80, 90]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate network throughput fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveSpeed(prev => {
        const delta = (Math.random() - 0.5) * 1.2;
        const next = Math.max(8.5, Math.min(22.0, Number((prev + delta).toFixed(1))));
        
        // Update history bar graph
        setHistory(hist => {
          const updated = [...hist.slice(1)];
          const percentage = Math.round((next / 22.0) * 100);
          updated.push(percentage);
          return updated;
        });

        return next;
      });

      // Subtle fluctuation in health
      setLiveHealth(prev => {
        if (Math.random() > 0.8) {
          const delta = Math.random() > 0.5 ? 1 : -1;
          return Math.max(85, Math.min(95, prev + delta));
        }
        return prev;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    
    // Animate a quick sync burst
    setTimeout(() => {
      setLiveHealth(94);
      setLiveSpeed(19.8);
      setIsRefreshing(false);
    }, 1500);
  };

  // SVG Gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (liveHealth / 100) * circumference;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Network Health Card */}
      <div 
        onClick={handleManualRefresh}
        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#0ea5e9] transition-all group"
      >
        <div className="relative w-28 h-28 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle 
              className="text-slate-100" 
              cx="50" 
              cy="50" 
              fill="none" 
              r={radius} 
              stroke="currentColor" 
              strokeWidth="8"
            />
            {/* Health Segment */}
            <motion.circle 
              className="text-[#0ea5e9]" 
              cx="50" 
              cy="50" 
              fill="none" 
              r={radius} 
              stroke="currentColor" 
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round" 
              strokeWidth="8"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-2xl font-bold font-display text-slate-800">{liveHealth}%</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Signal</span>
          </div>
        </div>
        <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5 justify-center">
          <ShieldCheck className="w-4 h-4 text-green-500 fill-green-100" />
          Sharing Status: <span className="font-semibold text-green-600">{liveHealth >= 90 ? 'Excellent' : 'Strong'}</span>
        </p>
        <span className="text-[10px] text-slate-400 invisible group-hover:visible mt-1 animate-pulse">Click to test connections</span>
      </div>

      {/* Speed Metric & Visualization */}
      <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Sharing Speed</h3>
            <p className="text-slate-500 text-xs">Average speed for files transferring nearby</p>
          </div>
          <motion.div 
            animate={isRefreshing ? { rotate: 360 } : {}}
            transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
            className="p-1.5 bg-sky-50 text-[#0ea5e9] rounded-lg"
          >
            <Zap className="w-5 h-5 fill-sky-100" />
          </motion.div>
        </div>

        <div className="flex items-end gap-2">
          <motion.span 
            key={liveSpeed}
            initial={{ opacity: 0.7, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold font-display text-slate-800 tracking-tighter"
          >
            {liveSpeed.toFixed(1)}
          </motion.span>
          <span className="text-lg font-bold text-slate-400 mb-1">MB/s</span>
        </div>

        {/* Live Audio-eq frequency-style bar graph showing latency history */}
        <div className="mt-4 flex gap-1.5 h-12 items-end">
          {history.map((val, idx) => (
            <motion.div
              key={idx}
              className={`flex-1 rounded-t-md transition-all duration-300 ${
                idx >= history.length - 4 ? 'bg-[#0ea5e9]' : 'bg-slate-200'
              }`}
              style={{ height: `${val}%` }}
              initial={{ height: "10%" }}
              animate={{ height: `${val}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
