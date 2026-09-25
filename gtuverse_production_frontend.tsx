import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, CheckCircle, ChevronRight, Play, 
  RefreshCw, Check, X, Award, Brain, BookOpen, Clock, 
  Sparkles, LayoutGrid, ChevronLeft, File, AlertCircle
} from 'lucide-react';

// --- PRODUCTION TYPES & INTERFACES ---
interface Question {
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

interface QuizData {
  title: string;
  topic: string;
  estimatedTime: string;
  questions: Question[];
}

interface User {
  initials: string;
  name: string;
}

// --- PRODUCTION CONSTANTS ---
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB limit
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];
const UPLOAD_TIMEOUT_MS = 120000; // 120 seconds timeout for large OCR/LLM tasks
const STEP_INTERVAL_MS = 2500; // Interval for processing animations

// --- REUSABLE UI COMPONENTS ---
const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-[#121216] border border-white/5 rounded-2xl p-6 shadow-xl ${className}`}>
    {children}
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  icon?: React.ReactNode;
}

const Button = ({ children, onClick, variant = 'primary', className = "", disabled = false, icon = null }: ButtonProps) => {
  const baseStyle = "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transform hover:-translate-y-0.5",
    secondary: "bg-white/5 hover:bg-white/10 text-white border border-white/10",
    outline: "border-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/10",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
      {icon && icon}
    </button>
  );
};

export default function GTUverseApp() {
  // Strongly typed state variables
  const [currentView, setCurrentView] = useState<'upload' | 'processing' | 'review' | 'quiz' | 'results'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  
  // Mock User State for Production (Replace with actual Auth Context)
  const [currentUser, setCurrentUser] = useState<User | null>({ initials: 'JD', name: 'John Doe' });

  const resetApp = () => {
    setFile(null);
    setQuizData(null);
    setUserAnswers({});
    setCurrentView('upload');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-200 font-sans selection:bg-blue-500/30 flex flex-col relative overflow-x-hidden">
      {/* Background Effects - Using local /noise.svg instead of external URL */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 mix-blend-overlay" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 w-full border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={resetApp}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.4)] group-hover:scale-105 transition-transform duration-300">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              GTUverse<span className="text-blue-500 font-light text-xl ml-1">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            {/* Added onClick for Dashboard to prevent dead links in production */}
            <button onClick={() => alert('Dashboard navigation would trigger here')} className="hidden md:flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">
              <LayoutGrid className="w-4 h-4" /> Dashboard
            </button>
            <div className="w-px h-6 bg-white/10 hidden md:block mx-2"></div>
            {/* Dynamic User Initials */}
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-lg cursor-pointer transform hover:scale-105 transition-transform" title={currentUser?.name}>
              <span className="text-xs font-bold text-white">{currentUser?.initials || 'G'}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex-grow flex flex-col items-center p-4 sm:p-6 w-full max-w-5xl mx-auto min-h-[calc(100vh-80px)] transition-all duration-500">
        {currentView === 'upload' && <UploadView setFile={setFile} setView={setCurrentView} setQuizData={setQuizData} />}
        {currentView === 'processing' && <ProcessingView />}
        {currentView === 'review' && <ReviewView quizData={quizData} setView={setCurrentView} />}
        {currentView === 'quiz' && <QuizView quizData={quizData!} userAnswers={userAnswers} setUserAnswers={setUserAnswers} setView={setCurrentView} />}
        {currentView === 'results' && <ResultsView quizData={quizData!} userAnswers={userAnswers} resetApp={resetApp} />}
      </main>
    </div>
  );
}

interface UploadProps {
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  setView: React.Dispatch<React.SetStateAction<'upload' | 'processing' | 'review' | 'quiz' | 'results'>>;
  setQuizData: React.Dispatch<React.SetStateAction<QuizData | null>>;
}

function UploadView({ setFile, setView, setQuizData }: UploadProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Validation Logic
  const validateFile = (fileToValidate: File): string | null => {
    if (fileToValidate.size > MAX_FILE_SIZE_BYTES) {
      return `File exceeds 50MB limit. Uploaded size: ${(fileToValidate.size / 1024 / 1024).toFixed(2)} MB.`;
    }
    const isAllowedExt = ALLOWED_EXTENSIONS.some(ext => fileToValidate.name.toLowerCase().endsWith(ext));
    if (!isAllowedExt) {
      return `Invalid file type. Supported formats are: ${ALLOWED_EXTENSIONS.join(', ')}.`;
    }
    return null;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const validationError = validateFile(droppedFile);
      if (validationError) {
        setError(validationError);
        setLocalFile(null);
      } else {
        setError(null);
        setLocalFile(droppedFile);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        setLocalFile(null);
      } else {
        setError(null);
        setLocalFile(selectedFile);
      }
    }
  };

  const uploadToBackend = async () => {
    if (!localFile) return;
    setFile(localFile);
    setView('processing');
    setError(null);

    const formData = new FormData();
    formData.append('file', localFile);

    // Abort controller for handling long-running API timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

    try {
      const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) 
        ? import.meta.env.VITE_API_URL 
        : 'http://localhost:8000';
      
      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorDetail = response.statusText;
        try {
          const errData = await response.json();
          if (errData.detail) errorDetail = errData.detail;
        } catch(e) { /* ignore parse error */ }
        throw new Error(`Server Error: ${errorDetail}`);
      }
      
      const generatedQuiz: QuizData = await response.json();
      setQuizData(generatedQuiz);
      setView('review');
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Upload failed:", err);
      
      if (err.name === 'AbortError') {
        setError("Upload timed out. The server took too long to process the document.");
      } else {
        setError(err.message || "Failed to process document. Please ensure the backend is running and try again.");
      }
      
      setLocalFile(null); 
      setView('upload');
    }
  };

  return (
    <div className="w-full max-w-2xl mt-10 md:mt-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
          Transform Documents into <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Interactive Quizzes</span>
        </h1>
        <p className="text-neutral-400 text-lg">Upload your lecture notes or PDFs. The GTUverse ML engine will extract core concepts and generate rigorous assessments instantly.</p>
      </div>

      {error && (
        <div className="w-full mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-200 text-sm font-medium">{error}</p>
        </div>
      )}

      <div 
        className={`relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all duration-300 ${
          isDragging ? 'border-blue-500 bg-blue-500/5 scale-[1.02]' : 'border-white/10 bg-white/5 hover:border-white/20'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileInputChange} 
          className="hidden" 
          accept={ALLOWED_EXTENSIONS.join(',')} 
        />
        
        {!localFile ? (
          <>
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <UploadCloud className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Drag & Drop your material here</h3>
            <p className="text-neutral-500 mb-6">Supports PDF, DOCX, TXT (Max {MAX_FILE_SIZE_BYTES / 1024 / 1024}MB)</p>
            <Button onClick={() => fileInputRef.current?.click()} variant="secondary">Browse Files</Button>
          </>
        ) : (
          <div className="flex flex-col items-center w-full animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/30">
              <File className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1 text-center max-w-full overflow-hidden text-ellipsis whitespace-nowrap px-4">{localFile.name}</h3>
            <p className="text-neutral-400 mb-8 text-sm">{(localFile.size / 1024 / 1024).toFixed(2)} MB</p>
            <div className="flex gap-4 w-full justify-center">
              <Button variant="secondary" onClick={() => { setLocalFile(null); setError(null); }}>Cancel</Button>
              <Button variant="primary" onClick={uploadToBackend} icon={<Sparkles className="w-4 h-4" />}>
                Generate AI Quiz
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProcessingView() {
  const [step, setStep] = useState(0);
  const steps = [
    "Ingesting & Parsing Document...",
    "Applying OCR & Noise Reduction...",
    "Semantic Chunking & Context Mapping...",
    "Extracting Concepts via spaCy NER...",
    "Orchestrating AI via Cloudflare Gateway...",
    "Enforcing Strict JSON Output..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => (s < steps.length - 1 ? s + 1 : s));
    }, STEP_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="w-full max-w-xl mt-20 flex flex-col items-center animate-in fade-in duration-500">
      <div className="relative w-32 h-32 mb-10">
        <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Brain className="w-10 h-10 text-blue-400 animate-pulse" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-white mb-8">ML Pipeline Active...</h2>
      <div className="w-full space-y-4">
        {steps.map((title, idx) => (
          <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${idx === step ? 'bg-white/10 border border-white/10 shadow-lg scale-105' : 'opacity-40'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${idx < step ? 'bg-green-500/20 text-green-400' : idx === step ? 'bg-blue-500/20 text-blue-400 animate-pulse' : 'bg-white/5 text-neutral-500'}`}>
              {idx < step ? <Check className="w-4 h-4" /> : <RefreshCw className={`w-4 h-4 ${idx === step ? 'animate-spin' : ''}`} />}
            </div>
            <h4 className={`font-semibold ${idx === step ? 'text-white' : 'text-neutral-300'}`}>{title}</h4>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ReviewProps {
  quizData: QuizData | null;
  setView: React.Dispatch<React.SetStateAction<'upload' | 'processing' | 'review' | 'quiz' | 'results'>>;
}

function ReviewView({ quizData, setView }: ReviewProps) {
  if (!quizData) return null;
  return (
    <div className="w-full mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-bold mb-3 border border-green-500/20">
            Pipeline Generation Complete
          </span>
          <h1 className="text-3xl font-black text-white">{quizData.title}</h1>
          <p className="text-neutral-400 mt-2 flex items-center gap-4">
            <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {quizData.topic}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {quizData.estimatedTime}</span>
          </p>
        </div>
        <Button onClick={() => setView('quiz')} icon={<Play className="w-4 h-4" fill="currentColor" />}>
          Launch Student Interface
        </Button>
      </div>

      <div className="space-y-6">
        {quizData.questions.map((q, idx) => (
          <Card key={idx} className="group hover:border-white/10 transition-colors">
            <div className="flex justify-between items-start gap-4 mb-4">
              <h3 className="text-xl font-semibold text-white">
                <span className="text-blue-500 mr-2">{idx + 1}.</span> {q.text}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {q.options.map((opt, optIdx) => (
                <div key={optIdx} className={`p-3 rounded-lg border text-sm ${optIdx === q.correctAnswerIndex ? 'bg-green-500/10 border-green-500/30 text-green-100' : 'bg-black/20 border-white/5 text-neutral-400'}`}>
                  <span className="font-mono text-xs opacity-50 mr-2">{String.fromCharCode(65 + optIdx)}.</span>{opt}
                </div>
              ))}
            </div>
            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-4 flex gap-3 items-start">
              <Brain className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">Context Grounding (Explanation)</span>
                <p className="text-sm text-indigo-100/70">{q.explanation}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface QuizProps {
  quizData: QuizData;
  userAnswers: Record<number, number>;
  setUserAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  setView: React.Dispatch<React.SetStateAction<'upload' | 'processing' | 'review' | 'quiz' | 'results'>>;
}

function QuizView({ quizData, userAnswers, setUserAnswers, setView }: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const question = quizData.questions[currentIndex];
  const isLastQuestion = currentIndex === quizData.questions.length - 1;

  const handleNext = () => isLastQuestion ? setView('results') : setCurrentIndex(c => c + 1);
  const progressPercentage = ((currentIndex + 1) / quizData.questions.length) * 100;

  return (
    <div className="w-full max-w-3xl mt-10 animate-in fade-in duration-500">
      <div className="mb-10">
        <div className="flex justify-between text-sm font-bold text-neutral-400 mb-3 uppercase tracking-wider">
          <span>Question {currentIndex + 1} of {quizData.questions.length}</span>
          <span>{quizData.topic}</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
        </div>
      </div>

      <Card className="min-h-[400px] flex flex-col">
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-8 leading-tight">{question.text}</h2>
        <div className="flex-grow space-y-3">
          {question.options.map((opt, idx) => {
            const isSelected = userAnswers[currentIndex] === idx; 
            return (
              <button key={idx} onClick={() => setUserAnswers({...userAnswers, [currentIndex]: idx})}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                  isSelected ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)] scale-[1.01]' : 'border-white/5 bg-white/5 hover:border-white/20'
                }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono transition-colors ${isSelected ? 'bg-blue-500 text-white' : 'bg-black/30 text-neutral-400'}`}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className={`text-lg ${isSelected ? 'text-white font-medium' : 'text-neutral-300'}`}>{opt}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-8 pt-6 border-t border-white/5 flex justify-between">
          <Button variant="secondary" onClick={() => setCurrentIndex(c => Math.max(0, c - 1))} disabled={currentIndex === 0}>
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          <Button variant="primary" onClick={handleNext} disabled={userAnswers[currentIndex] === undefined} icon={isLastQuestion ? <CheckCircle className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}>
            {isLastQuestion ? 'Submit Quiz' : 'Next Question'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

interface ResultsProps {
  quizData: QuizData;
  userAnswers: Record<number, number>;
  resetApp: () => void;
}

function ResultsView({ quizData, userAnswers, resetApp }: ResultsProps) {
  let score = 0;
  quizData.questions.forEach((q, idx) => { if (userAnswers[idx] === q.correctAnswerIndex) score++; });
  const percentage = Math.round((score / quizData.questions.length) * 100);

  return (
    <div className="w-full max-w-4xl mt-8 animate-in slide-in-from-bottom-8 duration-700">
      <div className="bg-gradient-to-br from-[#1a1a24] to-[#0a0a0c] border border-white/10 rounded-3xl p-8 md:p-12 text-center mb-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-32 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <Award className="w-20 h-20 text-blue-400 mx-auto mb-6" />
        <h1 className="text-4xl md:text-5xl font-black text-white mb-2">Assessment Complete</h1>
        <div className="inline-flex items-center justify-center relative w-48 h-48 mt-8">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round"
              strokeDasharray="283" strokeDashoffset={283 - (283 * percentage) / 100} className="transition-all duration-1000 ease-out" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black text-blue-400">{percentage}%</span>
            <span className="text-sm font-medium text-neutral-400 uppercase tracking-widest mt-1">Score</span>
          </div>
        </div>
      </div>

      <div className="space-y-6 mb-12">
        {quizData.questions.map((q, idx) => {
          const isCorrect = userAnswers[idx] === q.correctAnswerIndex;
          return (
            <Card key={idx} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <div className="flex gap-4 items-start">
                <div className={`mt-1 p-1 rounded-full ${isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-lg font-medium text-white mb-4"><span className="text-neutral-500 mr-2">{idx + 1}.</span> {q.text}</h4>
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isActualCorrect = q.correctAnswerIndex === optIdx;
                      let style = "bg-white/5 text-neutral-400";
                      if (isActualCorrect) style = "bg-green-500/10 border-green-500/30 text-green-200";
                      else if (userAnswers[idx] === optIdx && !isCorrect) style = "bg-red-500/10 border-red-500/30 text-red-200 line-through opacity-80";
                      return <div key={optIdx} className={`p-3 rounded-lg border border-transparent text-sm ${style}`}>{opt}</div>;
                    })}
                  </div>
                  {!isCorrect && (
                    <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-200/80">
                      <strong>Text Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="flex justify-center pb-20"><Button onClick={resetApp}>Create Another Quiz</Button></div>
    </div>
  );
}