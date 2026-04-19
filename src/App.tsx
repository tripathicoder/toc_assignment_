import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, StepForward, Pause, RotateCcw, Settings2 } from 'lucide-react';
import { DFAEngine, type DFADefinition, type IterationState } from './core/DFAEngine';
import { DFAVisualizer } from './components/DFAVisualizer';
import { ConfigModal } from './components/ConfigModal';

// Sample DFA: Accepts strings ending in "01"
const sampleDfa: DFADefinition = {
  states: ['q0', 'q1', 'q2'],
  alphabet: ['0', '1'],
  transitions: {
    q0: { '0': 'q1', '1': 'q0' },
    q1: { '0': 'q1', '1': 'q2' },
    q2: { '0': 'q1', '1': 'q0' }
  },
  startState: 'q0',
  acceptStates: ['q2']
};

export default function App() {
  const [dfaDef, setDfaDef] = useState<DFADefinition>(sampleDfa);
  const [engine, setEngine] = useState(() => new DFAEngine(sampleDfa));
  const [inputStr, setInputStr] = useState('100101');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  // Entire trace computed upfront
  const [trace, setTrace] = useState<IterationState[] | null>(null);
  
  // Phase 3: Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const timerRef = useRef<number | null>(null);

  // Compute Full Trace
  const handleCompute = useCallback(() => {
    try {
      const result = engine.computeTrace(inputStr);
      setTrace(result);
      setCurrentStepIndex(0); // Set to step 0 (initial state)
      setIsPlaying(false);
    } catch (err: any) {
      alert(err.message);
    }
  }, [engine, inputStr]);

  // Player controls
  const handleStep = useCallback(() => {
    if (!trace) return;
    if (currentStepIndex < trace.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [trace, currentStepIndex]);

  const handleReset = () => {
    setTrace(null);
    setCurrentStepIndex(-1);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (!trace) {
      handleCompute();
      setIsPlaying(true);
      return;
    }
    
    // If finished, reset and play again
    if (currentStepIndex >= trace.length - 1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
      return;
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleSaveConfig = (newDef: DFADefinition) => {
    try {
      const newEngine = new DFAEngine(newDef);
      setDfaDef(newDef);
      setEngine(newEngine);
      setTrace(null);
      setCurrentStepIndex(-1);
      setIsPlaying(false);
      setInputStr('');
    } catch (err: any) {
      alert("Validation Failed: " + err.message);
    }
  };

  // Phase 3: Animation Auto-Play Hook
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentStepIndex(prev => {
          if (trace && prev < trace.length - 1) {
             return prev + 1;
          } else {
             setIsPlaying(false);
             return prev;
          }
        });
      }, 1000); // 1 state per second for clear visualization
    } else if (timerRef.current !== null) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, [isPlaying, trace]);

  // Derived visible render state
  const currentStateFrame = trace && currentStepIndex >= 0 ? trace[currentStepIndex] : null;

  return (
    <div className="app-container" style={{ padding: '2rem', height: '100vh', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient">Automata Theory Engine</h1>
          <p className="text-muted mono-text" style={{ fontSize: '0.9rem', marginTop: '4px' }}>Deterministic Finite Automaton (DFA) Simulator</p>
        </div>
        <button className="button-secondary glass-panel" onClick={() => setIsConfigOpen(true)}>
          <Settings2 size={18} /> Edit Core JSON (Phase 4)
        </button>
      </header>

      {/* Control Panel */}
      <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
             <label className="text-muted mono-text" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '8px' }}>INPUT STRING (Σ = {'{0, 1}'})</label>
             {currentStateFrame && (
               <div className="mono-text" style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>
                  Processed: <span style={{ color: 'var(--text-muted)' }}>{inputStr.substring(0, currentStateFrame.stepIndex)}</span>
                  <span style={{ color: 'var(--text-main)', borderBottom: currentStateFrame.inputSymbol ? '2px solid var(--accent-cyan)' : 'none' }}>
                     {currentStateFrame.inputSymbol || ''}
                  </span>
                  <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>{currentStateFrame.remainingInput}</span>
               </div>
             )}
          </div>
          <input 
            type="text" 
            value={inputStr}
            onChange={(e) => setInputStr(e.target.value)}
            disabled={isPlaying || (trace !== null && currentStepIndex > 0)}
            className="mono-text"
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: 'var(--bg-elevated)', 
              border: '1px solid var(--border-subtle)', 
              color: 'var(--text-main)', 
              borderRadius: '6px',
              outline: 'none',
              fontSize: '1.1rem',
              letterSpacing: '2px',
              opacity: (isPlaying || (trace !== null && currentStepIndex > 0)) ? 0.6 : 1
            }} 
          />
        </div>
        
        <div style={{ display: 'flex', gap: '12px', marginTop: '22px' }}>
          <button className="button-primary glow-cyan" onClick={togglePlay}>
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />} 
            {isPlaying ? 'Pause Sim' : 'Auto-Play'}
          </button>
          <button className="button-secondary" onClick={handleStep} disabled={isPlaying || (trace !== null && currentStepIndex >= trace.length - 1)}>
            <StepForward size={18} /> Step
          </button>
          <button className="button-secondary" onClick={handleReset}>
            <RotateCcw size={18} />
          </button>
        </div>
      </section>

      {/* Execution Trace Windows */}
      <section style={{ flex: 1, display: 'flex', gap: '2rem', overflow: 'hidden' }}>
        
        {/* Left: Graphical Simulation Layout */}
        <div className="glass-panel" style={{ flex: 2, padding: '10px', display: 'flex', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', opacity: 0.7, zIndex: 100 }} className="mono-text text-sm">GRAPHIC CORE . ONLINE</div>
          
          <DFAVisualizer 
            dfa={dfaDef} 
            currentState={currentStateFrame?.currentState || null} 
            status={currentStateFrame?.status || 'pending'} 
          />
        </div>
        
        {/* Right: Hacker Terminal Execution Log */}
        <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <h3 className="mono-text" style={{ marginBottom: '1rem', fontSize: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>RUNTIME.LOG</span>
            {trace && currentStepIndex === trace.length - 1 && <span style={{ color: trace[trace.length - 1].status === 'accepted' ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
              {trace[trace.length - 1].status.toUpperCase()}
            </span>}
          </h3>
          
          {!trace && <p className="text-muted mono-text" style={{ fontSize: '0.85rem' }}>&gt; Awaiting standard input...</p>}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '1rem' }}>
            {trace && trace.slice(0, currentStepIndex + 1).map((t, idx) => {
              const isActive = idx === currentStepIndex;
              const accentColor = t.status === 'error' || t.status === 'rejected' ? 'var(--accent-rose)' : t.status === 'accepted' ? 'var(--accent-emerald)' : t.status === 'pending' ? 'var(--text-muted)' : 'var(--accent-cyan)';
              return (
                <div key={idx} style={{ 
                  padding: '10px 12px', 
                  borderLeft: `2px solid ${accentColor}`, 
                  background: isActive ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.01)', 
                  borderRadius: '0 6px 6px 0',
                  opacity: isActive ? 1 : 0.6
                }}>
                   <div className="mono-text" style={{ fontSize: '0.85rem', display: 'flex', gap: '1rem' }}>
                      <span className="text-muted" style={{ minWidth: '30px' }}>[{String(t.stepIndex).padStart(2, '0')}]</span> 
                      {t.stepIndex === 0 ? (
                         <span>INITIALIZING SYSTEM...</span>
                      ) : t.stepIndex === trace.length - 1 ? (
                         <span style={{ color: accentColor }}>SYSTEM HALTED</span>
                      ) : (
                         <span>δ({trace[idx-1]?.currentState}, {t.inputSymbol}) → <span style={{ color: 'var(--text-main)' }}>{t.nextState}</span></span>
                      )}
                   </div>
                   {t.errorMessage && <div style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', marginTop: '6px', paddingLeft: '46px' }}>&gt; {t.errorMessage}</div>}
                </div>
              );
            })}
          </div>
        </div>

      </section>

      <ConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
        currentDfa={dfaDef} 
        onSave={handleSaveConfig} 
      />

    </div>
  )
}
