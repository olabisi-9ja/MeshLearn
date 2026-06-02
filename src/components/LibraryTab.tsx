import { useState, useEffect } from 'react';
import { Search, Download, CheckCircle, ExternalLink, Users, FileText, Film, Radio, FileCheck, Layers, BookOpen, AlertCircle, Award, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MeshFile } from '../types';
import { SQLiteEngine, SQLiteLMSContent, SQLiteLMSProgress } from './SQLiteDB';

interface LibraryTabProps {
  files: MeshFile[];
  onGetFile: (file: MeshFile) => void;
  onViewFileDetails?: (file: MeshFile) => void;
  onAddSelectedFileToOffline?: (file: MeshFile) => void;
  activeUser?: any;
}

export default function LibraryTab({
  files,
  onGetFile,
  onViewFileDetails,
  onAddSelectedFileToOffline,
  activeUser
}: LibraryTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'document' | 'video' | 'raw_data'>('all');
  const [detailedFile, setDetailedFile] = useState<MeshFile | null>(null);

  // Mesh LMS Quiz and Grading states
  const [lmsQuizzes, setLmsQuizzes] = useState<SQLiteLMSContent[]>([]);
  const [gradeLogs, setGradeLogs] = useState<SQLiteLMSProgress[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [chosenOpt, setChosenOpt] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  useEffect(() => {
    loadContentAndGrades();
  }, [activeUser]);

  const loadContentAndGrades = () => {
    const loadedQuizzes = SQLiteEngine.getLmsContent().filter(c => c.content_type === 'QUIZ_JSON');
    setLmsQuizzes(loadedQuizzes);
    const progress = SQLiteEngine.getLmsProgress();
    setGradeLogs(progress);
  };

  const handleStartQuiz = (rawQuiz: SQLiteLMSContent) => {
    try {
      const parsedQuestions = JSON.parse(rawQuiz.payload);
      setActiveQuiz({
        id: rawQuiz.content_id,
        title: rawQuiz.title,
        questions: parsedQuestions
      });
      setQIndex(0);
      setChosenOpt(null);
      setQuizScore(0);
      setQuizDone(false);
    } catch {
      setActiveQuiz(null);
    }
  };

  const handleNextQuestion = () => {
    if (activeQuiz === null || chosenOpt === null) return;
    
    const isCorrect = chosenOpt === activeQuiz.questions[qIndex].correct;
    const nextScore = isCorrect ? quizScore + 1 : quizScore;
    setQuizScore(nextScore);

    if (qIndex + 1 < activeQuiz.questions.length) {
      setQIndex(qIndex + 1);
      setChosenOpt(null);
    } else {
      setQuizDone(true);
      const studentId = activeUser ? activeUser.id : 'u-self';
      const finalPercentage = Math.round((nextScore / activeQuiz.questions.length) * 100);
      
      // PERSIST progress inside SQLite lms_progress table
      SQLiteEngine.insertProgress(studentId, activeQuiz.id, finalPercentage);
      loadContentAndGrades(); // Reload logs
    }
  };

  // Filters
  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const offlineFiles = filteredFiles.filter(f => f.status === 'offline');
  const remoteTrends = filteredFiles.filter(f => f.status === 'remote' && !f.coverUrl);
  const catalogCards = filteredFiles.filter(f => f.status === 'remote' && f.coverUrl);

  const handleOpenDetails = (file: MeshFile) => {
    setDetailedFile(file);
    if (onViewFileDetails) onViewFileDetails(file);
  };

  const getFormatBadgeColor = (type: string) => {
    switch (type) {
      case 'PDF':
        return 'bg-red-500 text-white';
      case 'VIDEO':
        return 'bg-purple-500 text-white';
      case 'AUDIO':
        return 'bg-blue-500 text-white';
      case 'ZIP':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Search & Category Filter Clusters */}
      <section>
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450">
            <Search className="w-5 h-5 text-sky-400" />
          </span>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search the mesh library..."
            className="w-full bg-[#0a0f1d] border border-[#1e294b] focus:border-sky-500 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-all text-base shadow-lg font-sans"
          />
        </div>
        
        {/* Category Selector Chips */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 select-none">
          <button 
            onClick={() => setSelectedCategory('all')}
            className={`px-5 py-2 rounded-full text-xs font-bold font-sans transition-all border shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                : 'bg-[#0a0f1d] border-[#1e294b] text-slate-350 hover:bg-[#11192e] hover:text-sky-455'
            }`}
          >
            All Resources
          </button>
          <button 
            onClick={() => setSelectedCategory('document')}
            className={`px-5 py-2 rounded-full text-xs font-bold font-sans transition-all border shrink-0 cursor-pointer ${
              selectedCategory === 'document'
                ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                : 'bg-[#0a0f1d] border-[#1e294b] text-slate-350 hover:bg-[#11192e] hover:text-sky-455'
            }`}
          >
            Documents
          </button>
          <button 
            onClick={() => setSelectedCategory('video')}
            className={`px-5 py-2 rounded-full text-xs font-bold font-sans transition-all border shrink-0 cursor-pointer ${
              selectedCategory === 'video'
                ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                : 'bg-[#0a0f1d] border-[#1e294b] text-slate-350 hover:bg-[#11192e] hover:text-sky-455'
            }`}
          >
            Video Lessons
          </button>
          <button 
            onClick={() => setSelectedCategory('raw_data')}
            className={`px-5 py-2 rounded-full text-xs font-bold font-sans transition-all border shrink-0 cursor-pointer ${
              selectedCategory === 'raw_data'
                ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                : 'bg-[#0a0f1d] border-[#1e294b] text-slate-350 hover:bg-[#11192e] hover:text-sky-455'
            }`}
          >
            Study Packages
          </button>
        </div>
      </section>

      {/* Available Offline (State A: Checked Offline Lists) */}
      <section>
        <div className="flex items-center gap-2 mb-4 select-none">
          <CheckCircle className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-bold font-display uppercase tracking-widest text-[#38bdf8] font-mono">Available Offline</h2>
        </div>

        {offlineFiles.length === 0 ? (
          <div className="bg-[#0f172a]/40 border border-dashed border-[#1e294b] rounded-2xl p-6 text-center select-none">
            <AlertCircle className="w-6 h-6 text-slate-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">No offline files found matching search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offlineFiles.map(file => (
              <div 
                key={file.id} 
                onClick={() => handleOpenDetails(file)}
                className="bg-gradient-to-r from-[#0d1425] to-[#0a0f1d] hover:to-[#11182c] p-4 rounded-2xl border border-[#1e294b] hover:border-sky-500/60 transition-all cursor-pointer shadow-xl flex items-center justify-between group active:scale-[0.99]"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 bg-sky-950/85 text-sky-450 rounded-xl flex items-center justify-center flex-shrink-0 text-sky-400">
                    {file.category === 'video' ? <Film className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-100 group-hover:text-[#38bdf8] transition-colors truncate select-all">{file.name}</h3>
                    <p className="text-[10px] text-slate-500 font-bold font-mono uppercase tracking-wide mt-0.5">
                      {file.type} Document • {file.size}
                    </p>
                  </div>
                </div>
                <span className="w-5 h-5 text-emerald-400 flex-shrink-0 animate-pulse">
                  <CheckCircle className="w-5 h-5" />
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Network Resources / Trends (Inline Items with Pull Packet handles) */}
      <section>
        <div className="flex items-center justify-between mb-4 select-none">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
            <h2 className="text-xs font-bold font-display uppercase tracking-widest text-[#38bdf8] font-mono">Trending Nearby</h2>
          </div>
        </div>

        {remoteTrends.length === 0 ? (
          <div className="bg-[#0f172a]/40 border border-[#1e294b] rounded-2xl p-6 text-center text-xs text-slate-500">
            No active trending files discovered nearby.
          </div>
        ) : (
          <div className="space-y-3">
            {remoteTrends.map(file => (
              <div 
                key={file.id}
                className="bg-[#0a0f1d] p-4 rounded-xl border border-[#1e294b] hover:border-sky-500/40 shadow-xl flex flex-wrap gap-4 items-center justify-between group transition-all"
                title={`${file.name} is shared by ${file.peers} classmate${file.peers !== 1 ? 's' : ''}`}
              >
                <div 
                  onClick={() => handleOpenDetails(file)}
                  className="flex items-center gap-4 min-w-0 cursor-pointer flex-1"
                >
                  <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-slate-300 font-bold font-mono text-[9px] uppercase border border-[#1e294b] flex-shrink-0">
                    {file.type}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-100 group-hover:text-sky-400 transition-colors truncate select-all">{file.name}</h4>
                    <div className="flex gap-4 mt-1 font-mono text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-600" /> {file.size}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-600" /> {file.peers} sharing
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => onGetFile(file)}
                  className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg active:scale-95 text-nowrap cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download File
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Educational Catalog (High Visual Bento Grid Cards) */}
      <section>
        <div className="flex items-center gap-2 mb-4 select-none">
          <BookOpen className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-bold font-display uppercase tracking-widest text-[#38bdf8] font-mono">Study Files Catalog</h2>
        </div>

        {catalogCards.length === 0 ? (
          <div className="bg-[#0f172a]/45 border border-[#1e294b] rounded-2xl p-6 text-center text-xs text-slate-500 select-none">
            No catalog resources found under current search parameters.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {catalogCards.map(file => (
              <div 
                key={file.id}
                onClick={() => handleOpenDetails(file)}
                className="group cursor-pointer flex flex-col h-full bg-gradient-to-b from-[#0d1425] to-[#0a0f1d] border border-[#1e294b] rounded-2xl p-2.5 hover:border-sky-500/60 hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 relative mb-3 border border-[#1e294b]">
                  <img 
                    src={file.coverUrl} 
                    alt={file.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-950/95 backdrop-blur px-2 py-0.5 rounded text-[8px] font-bold text-sky-400 uppercase shadow-md border border-[#1e294b] font-mono tracking-wider">
                    {file.type}
                  </div>
                </div>
                
                <h5 className="font-bold text-xs leading-tight text-white mb-2 group-hover:text-sky-400 transition-colors line-clamp-1 select-all font-display">
                  {file.name}
                </h5>
                
                <div className="flex items-center justify-between text-slate-500 text-[9px] font-mono font-bold tracking-wider uppercase mt-auto pt-2 border-t border-[#1e294b]/60">
                  <span>{file.size}</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-500" /> {file.peers}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Mesh LMS Courseware Assessment Portal */}
      <section className="bg-[#0a0f1d] p-6 rounded-3xl border border-[#1e294b] shadow-xl">
        <div className="flex items-center gap-2 mb-6 border-b border-[#1e294b]/80 pb-4">
          <Award className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="font-display font-extrabold text-sm text-white uppercase tracking-tight">Offline Syllabus Assessments</h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">P2P graded quizzes. Results commit to the local SQLite database to synchronize when back on campus.</p>
          </div>
        </div>

        {activeQuiz ? (
          <div className="bg-[#050912] p-5 rounded-2xl border border-[#1e294b]/80 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#1e294b]/40">
              <span className="text-[10px] font-mono font-bold text-sky-450 uppercase">{activeQuiz.title}</span>
              <span className="text-[10px] text-slate-400 font-bold font-mono">QUESTION {qIndex + 1} OF {activeQuiz.questions.length}</span>
            </div>

            {!quizDone ? (
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-100">{activeQuiz.questions[qIndex].q}</p>
                <div className="space-y-2">
                  {activeQuiz.questions[qIndex].options.map((opt: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setChosenOpt(idx)}
                      className={`w-full text-left p-3 rounded-xl text-xs font-semibold leading-relaxed transition-all select-none border cursor-pointer ${
                        chosenOpt === idx
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500'
                          : 'bg-slate-900/60 text-slate-300 border-[#1e294b] hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      {idx + 1}. {opt}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setActiveQuiz(null)}
                    className="p-2 px-4 rounded-xl text-[11px] bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all font-bold cursor-pointer"
                  >
                    Quit Quiz
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={chosenOpt === null}
                    className="p-2 px-5 rounded-xl text-[11px] bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-extrabold transition-all cursor-pointer"
                  >
                    {qIndex + 1 === activeQuiz.questions.length ? 'Submit Final Answers' : 'Proceed Question'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-emerald-950 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-900">
                  <Award className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">Grading Evaluation Complete!</h4>
                  <p className="text-[11px] text-slate-400 mt-1">You scored {quizScore} / {activeQuiz.questions.length} correct options ({Math.round((quizScore / activeQuiz.questions.length) * 100)}%).</p>
                  <p className="text-[10px] text-[#38bdf8] font-mono mt-1 uppercase">Saved to SQLite Table: lms_progress</p>
                </div>
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="bg-[#11192e] hover:bg-[#16223f] border border-[#1e294b] text-sky-400 font-extrabold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Exit Gradebook View
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lmsQuizzes.map(quiz => (
                <div key={quiz.content_id} className="bg-[#050912] p-4 rounded-2xl border border-[#1e294b] flex flex-col justify-between">
                  <div className="mb-4">
                    <span className="text-[8px] bg-sky-950 text-sky-400 border border-sky-900 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide font-mono">Active Syllabus</span>
                    <h4 className="font-bold text-xs text-white mt-1.5">{quiz.title}</h4>
                  </div>
                  <button
                    onClick={() => handleStartQuiz(quiz)}
                    className="w-full bg-[#11192e] hover:bg-[#16223f] text-sky-400 border border-sky-950/40 font-bold py-2 text-[10px] rounded-xl text-center uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Evaluate Offline Quiz
                  </button>
                </div>
              ))}
            </div>

            {/* Historical Gradebook Records compiled directly from users SQL logs */}
            <div className="mt-6 border-t border-[#1e294b]/60 pt-4">
              <h4 className="font-mono text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-3">Sync Progress Logs (Table: lms_progress)</h4>
              
              {gradeLogs.length === 0 ? (
                <p className="text-[10px] text-slate-500 font-medium">No recorded grades found in the local SQLite cache.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {gradeLogs.map(log => (
                    <div key={log.progress_id} className="bg-[#050912] p-3 rounded-xl border border-slate-900 flex justify-between items-center text-[10px] font-mono">
                      <div className="min-w-0 pr-2">
                        <span className="text-white font-bold block truncate">ID: {log.content_id}</span>
                        <span className="text-slate-500 block">Graded at: {log.completed_at}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-emerald-400 font-bold block">{log.score}% Score</span>
                        <span className="text-[8px] text-slate-500">{log.is_synced_to_cloud === 1 ? 'CLOUD SYNCED' : 'LOCAL CACHED'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Slide-over/Center Detail Dialog */}
      <AnimatePresence>
        {detailedFile && (
          <div className="fixed inset-0 z-150 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailedFile(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />
            
            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#0a0f1d] rounded-3xl overflow-hidden shadow-2xl border border-[#1e294b] z-10"
            >
              {/* Cover coverUrl header if exists */}
              {detailedFile.coverUrl ? (
                <div className="aspect-video w-full relative">
                  <img 
                    src={detailedFile.coverUrl} 
                    alt={detailedFile.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute top-4 right-4 text-[9px] font-bold px-2 py-1 rounded font-mono shadow ${getFormatBadgeColor(detailedFile.type)}`}>
                    {detailedFile.type}
                  </div>
                </div>
              ) : (
                <div className="bg-[#11192e] text-white p-6 relative">
                  <div className={`absolute top-4 right-4 text-[9px] font-mono font-bold px-2.5 py-1 rounded ${getFormatBadgeColor(detailedFile.type)}`}>
                    {detailedFile.type}
                  </div>
                  <Layers className="w-10 h-10 text-sky-400 mb-2" />
                  <p className="text-[10px] font-mono tracking-wider font-bold text-slate-450 uppercase">File Info</p>
                </div>
              )}

              {/* Content body */}
              <div className="p-6">
                <h3 className="text-sm font-extrabold text-white font-display uppercase tracking-tight select-all">
                  {detailedFile.name}
                </h3>
                
                {detailedFile.description && (
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">
                    {detailedFile.description}
                  </p>
                )}

                {/* Characteristics block */}
                <div className="grid grid-cols-2 gap-4 bg-[#0d1425] border border-[#1e294b] rounded-xl p-4 mt-5 text-slate-300 font-mono text-[9px] font-medium leading-relaxed">
                  <div>
                    <span className="text-slate-500 uppercase font-bold">Category:</span>
                    <p className="text-white font-semibold capitalize mt-0.5">{detailedFile.category.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-bold">File Size:</span>
                    <p className="text-white font-semibold mt-0.5">{detailedFile.size}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-bold">Sharing Classmates:</span>
                    <p className="text-white font-semibold mt-0.5">{detailedFile.peers || 12} devices</p>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-bold">Status:</span>
                    <p className={`font-semibold mt-0.5 uppercase ${detailedFile.status === 'offline' ? 'text-emerald-400' : 'text-sky-400'}`}>
                      {detailedFile.status === 'offline' ? 'Saved Offline' : 'Ready to Download'}
                    </p>
                  </div>
                </div>

                {/* CTA actions */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button 
                    onClick={() => setDetailedFile(null)}
                    className="w-full bg-[#11192e] border border-[#1e294b] text-slate-350 hover:text-white font-bold py-3 text-xs rounded-xl hover:bg-[#16223f] transition-all select-none cursor-pointer"
                  >
                    Close Panel
                  </button>
                  
                  {detailedFile.status === 'offline' ? (
                    <button 
                      disabled
                      className="w-full bg-emerald-950/40 text-emerald-300 border border-emerald-800/50 font-extrabold py-3 text-xs rounded-xl flex items-center justify-center gap-1 pointer-events-none select-none"
                    >
                      <FileCheck className="w-4 h-4 text-emerald-400" /> Downloaded
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        onGetFile(detailedFile);
                        setDetailedFile(null);
                      }}
                      className="w-full bg-sky-500 hover:bg-sky-600 text-white font-extrabold py-3 text-xs rounded-xl flex items-center justify-center gap-1 shadow-lg hover:shadow-sky-500/15 select-none transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <Download className="w-4 h-4 font-bold" /> Download File
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
