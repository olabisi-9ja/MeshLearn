import { useState, useEffect } from 'react';
import { FileText, Save, Clock, RefreshCw, Send, Plus, Trash2, ArrowRight } from 'lucide-react';
import { SQLiteEngine, SQLiteSyncNote } from './SQLiteDB';

interface SyncNoteTabProps {
  showToast: (msg: string, type: 'success' | 'info' | 'warn') => void;
  activeUser: any;
}

export default function SyncNoteTab({ showToast, activeUser }: SyncNoteTabProps) {
  const [notes, setNotes] = useState<SQLiteSyncNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<SQLiteSyncNote | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [vectorClock, setVectorClock] = useState<Record<string, number>>({});
  
  // Peer simulation state
  const [peerConflictPayload, setPeerConflictPayload] = useState<string>('');
  const [peerClock, setPeerClock] = useState<Record<string, number>>({});
  const [showSimulator, setShowSimulator] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    const loaded = SQLiteEngine.getSyncNotes();
    setNotes(loaded);
    if (loaded.length > 0 && !selectedNote) {
      handleSelectNote(loaded[0]);
    }
  };

  const handleSelectNote = (note: SQLiteSyncNote) => {
    setSelectedNote(note);
    setEditorTitle(note.title);
    setEditorContent(note.crdt_state);
    try {
      setVectorClock(JSON.parse(note.version_vector || '{}'));
    } catch {
      setVectorClock({});
    }
    
    // Prepare simulator
    setPeerConflictPayload(note.crdt_state + '\n\n- [EMMA EDITS] Swapped local routing to EPIDEMIC loops.');
    setPeerClock({
      ...vectorClock,
      EM: (vectorClock['EM'] || 0) + 3,
      AJ: (vectorClock['AJ'] || 0) + 1
    });
  };

  // Simulates CRDT keystroke updates incrementing version clocks
  const handleEditorChange = (val: string) => {
    setEditorContent(val);
    
    // Increment version clock for current user
    const usernameInitials = activeUser ? activeUser.username.substring(0, 2).toUpperCase() : 'AJ';
    setVectorClock(prev => ({
      ...prev,
      [usernameInitials]: (prev[usernameInitials] || 0) + 1
    }));
  };

  const handleSave = () => {
    if (!selectedNote) return;
    const notesString = JSON.stringify(vectorClock);
    const updated = SQLiteEngine.saveSyncNote(selectedNote.note_id, editorTitle, editorContent, notesString);
    showToast('Document local CRDT branch committed!', 'success');
    loadNotes();
    setSelectedNote(updated);
  };

  const handleCreateNote = () => {
    const defaultTitle = 'Untitled Note ' + (notes.length + 1);
    const userInit = activeUser ? activeUser.username.substring(0, 2).toUpperCase() : 'AJ';
    const initClock = JSON.stringify({ [userInit]: 1 });
    
    const newNote = SQLiteEngine.saveSyncNote(
      'n-' + Math.random().toString(36).substr(2, 9),
      defaultTitle,
      '# New study note\n\nStart typing peer notes here...',
      initClock
    );
    showToast('New study notes branches initialized!', 'success');
    loadNotes();
    handleSelectNote(newNote);
  };

  // Mathematical Semi-lattice Commutative Merge Demo
  const triggerCRDTMerge = () => {
    if (!selectedNote) return;
    
    const originalText = editorContent;
    const mergeResultText = originalText + '\n\n/* MERGED CHANGES FROM EMMA\'S IPAD */\n- [EMMA EDITS] Swapped local routing to EPIDEMIC loops.';
    
    // Take the maximum of each key in the logical vector clocks (CRDT convergence LUB)
    const mergedClock: Record<string, number> = { ...vectorClock };
    Object.keys(peerClock).forEach(key => {
      mergedClock[key] = Math.max(mergedClock[key] || 0, peerClock[key]);
    });

    setEditorContent(mergeResultText);
    setVectorClock(mergedClock);
    
    const updatedVectorString = JSON.stringify(mergedClock);
    SQLiteEngine.saveSyncNote(selectedNote.note_id, editorTitle, mergeResultText, updatedVectorString);

    showToast('P2P State Convergence Complete! CRDT Maximum Union bound successfully.', 'success');
    loadNotes();
    
    setNotes(prev => prev.map(n => n.note_id === selectedNote.note_id ? {
      ...n,
      crdt_state: mergeResultText,
      version_vector: updatedVectorString
    } : n));

    setShowSimulator(false);
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-100 font-sans">
      <section className="bg-[#0b1120] p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden cyber-glow">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="bg-sky-950/45 text-sky-400 border border-sky-500/20 uppercase tracking-widest text-[9px] font-mono px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 mb-2 shadow-sm">
              <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" /> P2P State CRDT: active
            </div>
            <h2 className="font-display font-black text-2xl text-white tracking-tight">SyncNote Editor</h2>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed max-w-lg">
              Peer-to-peer collaborative notes editor. Uses mathematical Vector Clocks to guarantee eventual consistency across offline study bodies.
            </p>
          </div>

          <button
            onClick={handleCreateNote}
            className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-505 text-white font-extrabold px-5 py-3 rounded-xl flex items-center gap-1.5 transition-all duration-300 hover:scale-[1.02] active:scale-95 text-xs text-center cursor-pointer shadow-lg shadow-sky-505/10"
          >
            <Plus className="w-4 h-4" /> Create Note Segment
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Notes list sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="font-mono text-[9px] uppercase font-bold text-slate-500 tracking-widest pl-1">Local File Leaves</h3>
            <div className="space-y-2">
              {notes.map(note => {
                const isSelected = selectedNote?.note_id === note.note_id;
                return (
                  <button
                    key={note.note_id}
                    onClick={() => handleSelectNote(note)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 select-none cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-[#121c35] border-sky-500/70 shadow-lg text-white'
                        : 'bg-slate-950/80 border-slate-900/80 text-slate-350 hover:bg-[#0c1221] hover:border-slate-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <FileText className={`w-4 h-4 transition-colors ${isSelected ? 'text-sky-450' : 'text-slate-550 group-hover:text-sky-400'}`} />
                        <span className="font-bold text-xs truncate block">{note.title}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-550 block">Mod: {note.last_modified}</span>
                    </div>
                    <div className="text-[9px] bg-slate-950 px-2.5 py-1 rounded bg-[#030712] text-sky-400 font-mono border border-slate-900 shadow-inner group-hover:border-sky-500/20">
                      VV: {Object.keys(JSON.parse(note.version_vector || '{}')).length}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active editor frame */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            {selectedNote ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  <input
                    type="text"
                    value={editorTitle}
                    onChange={(e) => setEditorTitle(e.target.value)}
                    className="bg-slate-950/90 border border-slate-800 focus:border-sky-500 px-4 py-2.5 text-xs font-bold text-white rounded-xl focus:outline-none flex-1 transition-all duration-200 shadow-inner"
                    placeholder="Note study title"
                  />
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-505 text-white font-extrabold p-2.5 px-4 rounded-xl flex items-center gap-1.5 text-xs cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-emerald-505/10"
                    >
                      <Save className="w-4 h-4" /> Commit Local
                    </button>
                    
                    <button
                      onClick={() => setShowSimulator(!showSimulator)}
                      className="bg-slate-950 font-bold p-2.5 px-4.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-200 flex items-center gap-1.5 text-xs cursor-pointer transition-all duration-200 hover:border-slate-700"
                    >
                      <Clock className="w-4 h-4 text-sky-450" /> Simulate Conflict
                    </button>
                  </div>
                </div>

                {/* State Vector visualization badge */}
                <div className="bg-slate-950/90 border border-slate-900 p-4 rounded-2xl font-mono text-[10px] flex flex-wrap items-center gap-3 shadow-inner">
                  <span className="text-slate-450 font-bold tracking-wider">STATE VECTOR CLOCKS:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(vectorClock).map(([key, val]) => (
                      <span key={key} className="bg-sky-950/40 text-[#38bdf8] border border-sky-850 px-2 py-0.5 rounded-md font-bold text-[9px] flex items-center gap-1.5 shadow-sm">
                        Node {key}: <span className="text-white font-extrabold">{val}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Simulated Peer Edit Overlay drawer */}
                {showSimulator && (
                  <div className="bg-[#0c0d28]/95 border border-indigo-500/25 p-5 rounded-2xl space-y-4.5 animate-fade-in relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-505/45 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider">Bluetooth Concurrent Edit Collision</h4>
                        <p className="text-[11px] text-indigo-200 mt-1 max-w-md leading-relaxed font-semibold">
                          Emma is sitting 3 seats over and edited the same note offline. Her vector clock differs from your current branch!
                        </p>
                      </div>
                      <span className="p-1.5 px-2 bg-indigo-950 text-indigo-300 border border-indigo-900 rounded-xl font-mono text-[8px] font-extrabold tracking-widest leading-none">SIMULATOR ACTIVE</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-2 font-mono text-[9px] text-slate-400 relative z-10">
                      <div className="bg-indigo-950/40 p-3 rounded-xl border border-indigo-900/35 shadow-inner">
                        <span className="text-white font-bold block mb-1.5">Emma's Vector Clocks:</span>
                        {Object.entries(peerClock).map(([k, v]) => (
                          <div key={k}>{k}: <span className="text-indigo-400 font-extrabold">{v}</span></div>
                        ))}
                      </div>
                      <div className="bg-indigo-950/40 p-3 rounded-xl border border-indigo-900/35 shadow-inner">
                        <span className="text-white font-bold block mb-1.5">Your current Clocks:</span>
                        {Object.entries(vectorClock).map(([k, v]) => (
                          <div key={k}>{k}: <span className="text-sky-450 font-extrabold">{v}</span></div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={triggerCRDTMerge}
                      className="w-full bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-700 hover:from-indigo-450 hover:to-indigo-505 text-white font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 shadow-md hover:scale-[1.01]"
                    >
                      <RefreshCw className="w-4 h-4 font-bold animate-pulse text-indigo-150" /> Mathematically Resolve Commutative State Map
                    </button>
                  </div>
                )}

                {/* Textbox space */}
                <textarea
                  value={editorContent}
                  onChange={(e) => handleEditorChange(e.target.value)}
                  className="w-full min-h-[220px] bg-slate-950/90 border border-slate-800 px-5 py-5 rounded-2xl text-slate-205 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono text-xs leading-relaxed focus:shadow-lg transition-all"
                  placeholder="Insert notes text details..."
                />
              </div>
            ) : (
              <div className="p-14 text-center text-slate-550 font-bold border border-dashed border-slate-800 rounded-2xl bg-slate-950/30">Select or create a study note segment to begin.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
