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
      <section className="bg-[#0a0f1d] p-6 rounded-3xl border border-[#1e294b] shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1e294b]/80 pb-6">
          <div>
            <div className="bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase tracking-widest text-[9px] font-mono px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 mb-2">
              <RefreshCw className="w-3 h-3 text-sky-450 animate-spin" /> P2P State CRDT: active
            </div>
            <h2 className="font-display font-bold text-2xl text-white">SyncNote Editor</h2>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-lg">
              Peer-to-peer collaborative notes editor. Uses mathematical Vector Clocks to guarantee eventual consistency across offline study bodies.
            </p>
          </div>

          <button
            onClick={handleCreateNote}
            className="bg-[#0ea5e9] hover:bg-sky-500 text-white font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 text-xs text-center cursor-pointer font-sans"
          >
            <Plus className="w-4 h-4" /> Create Note Segment
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Notes list sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="font-mono text-[9px] uppercase font-bold text-slate-500 tracking-wider">Local File Leaves</h3>
            <div className="space-y-2">
              {notes.map(note => {
                const isSelected = selectedNote?.note_id === note.note_id;
                return (
                  <button
                    key={note.note_id}
                    onClick={() => handleSelectNote(note)}
                    className={`w-full text-left p-4 rounded-xl border transition-all select-none cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#152342]/70 border-sky-500 shadow-md text-white'
                        : 'bg-[#060a15] border-[#1e294b] text-slate-300 hover:bg-[#11192e] hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <FileText className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                        <span className="font-bold text-xs truncate block">{note.title}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 block">Mod: {note.last_modified}</span>
                    </div>
                    <div className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-sky-400 font-mono scale-90 border border-slate-800">
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
                    className="bg-[#050912] border border-[#1e294b] px-3 py-2 text-sm font-bold text-white rounded-lg focus:outline-none focus:border-sky-500 flex-1"
                    placeholder="Note study title"
                  />
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-2.5 px-4 rounded-xl flex items-center gap-1 text-xs cursor-pointer transition-all active:scale-95"
                    >
                      <Save className="w-3.5 h-3.5" /> Commit Local
                    </button>
                    
                    <button
                      onClick={() => setShowSimulator(!showSimulator)}
                      className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-bold p-2.5 px-3 rounded-xl flex items-center gap-1 text-xs cursor-pointer transition-all"
                    >
                      <Clock className="w-3.5 h-3.5" /> Simulate Conflict
                    </button>
                  </div>
                </div>

                {/* State Vector visualization badge */}
                <div className="bg-[#0e172a] border border-[#1e294b] p-3 rounded-xl font-mono text-[10px] flex flex-wrap items-center gap-3">
                  <span className="text-slate-400 font-bold">STATE VECTOR CLOCKS:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(vectorClock).map(([key, val]) => (
                      <span key={key} className="bg-sky-950/40 text-sky-400 border border-sky-900/60 px-1.5 py-0.5 rounded-md font-bold text-[9px] flex items-center gap-1">
                        Node {key}: <span className="text-white font-extrabold">{val}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Simulated Peer Edit Overlay drawer */}
                {showSimulator && (
                  <div className="bg-[#1e1b4b]/65 border border-indigo-500/30 p-4 rounded-xl space-y-4 animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-indigo-300">Bluetooth Concurrent Edit Collision</h4>
                        <p className="text-[10px] text-indigo-200 mt-0.5 max-w-md">
                          Emma is sitting 3 seats over and edited the same note offline. Her vector clock differs from your current branch!
                        </p>
                      </div>
                      <span className="p-1 px-1.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded font-mono text-[8px] font-extrabold scale-90">SIMULATOR ACTIVE</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-2 font-mono text-[9px] text-slate-400">
                      <div className="bg-indigo-950/40 p-2.5 rounded border border-indigo-900/40">
                        <span className="text-white font-bold block mb-1">Emma's Vector Clocks:</span>
                        {Object.entries(peerClock).map(([k, v]) => (
                          <div key={k}>{k}: <span className="text-indigo-300 font-extrabold">{v}</span></div>
                        ))}
                      </div>
                      <div className="bg-indigo-950/40 p-2.5 rounded border border-indigo-900/40">
                        <span className="text-white font-bold block mb-1">Your current Clocks:</span>
                        {Object.entries(vectorClock).map(([k, v]) => (
                          <div key={k}>{k}: <span className="text-sky-300 font-extrabold">{v}</span></div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={triggerCRDTMerge}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5 font-bold animate-pulse text-indigo-200" /> Mathematically Resolve Commutative State Map
                    </button>
                  </div>
                )}

                {/* Textbox space */}
                <textarea
                  value={editorContent}
                  onChange={(e) => handleEditorChange(e.target.value)}
                  className="w-full min-h-[180px] bg-slate-950/80 border border-slate-850 px-4 py-4 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono text-xs leading-relaxed"
                  placeholder="Insert notes text details..."
                />
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-medium">Select or create a study note segment to begin.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
