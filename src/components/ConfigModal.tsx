import { useState, useEffect } from 'react';
import type { DFADefinition } from '../core/DFAEngine';
import { X, CheckCircle, AlertTriangle, FileJson } from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDfa: DFADefinition;
  onSave: (newDfa: DFADefinition) => void;
}

const PRESET_SAMPLES = [
  {
    name: "Ends with 1",
    description: "Accepts strings ending in '1'",
    dfa: {
      states: ["q0", "q1"],
      alphabet: ["0", "1"],
      transitions: {
        "q0": { "0": "q0", "1": "q1" },
        "q1": { "0": "q0", "1": "q1" }
      },
      startState: "q0",
      acceptStates: ["q1"]
    }
  },
  {
    name: "Divisible by 3",
    description: "Binary numbers evenly divisible by 3",
    dfa: {
      states: ["q0", "q1", "q2"],
      alphabet: ["0", "1"],
      transitions: {
        "q0": { "0": "q0", "1": "q1" },
        "q1": { "0": "q2", "1": "q0" },
        "q2": { "0": "q1", "1": "q2" }
      },
      startState: "q0",
      acceptStates: ["q0"]
    }
  },
  {
    name: "Even number of 0s",
    description: "Accepts strings with an even number of '0's",
    dfa: {
      states: ["q0", "q1"],
      alphabet: ["0", "1"],
      transitions: {
        "q0": { "0": "q1", "1": "q0" },
        "q1": { "0": "q0", "1": "q1" }
      },
      startState: "q0",
      acceptStates: ["q0"]
    }
  },
  {
    name: "Contains 01",
    description: "Accepts strings containing '01' as substring",
    dfa: {
      states: ["q0", "q1", "q2"],
      alphabet: ["0", "1"],
      transitions: {
        "q0": { "0": "q1", "1": "q0" },
        "q1": { "0": "q1", "1": "q2" },
        "q2": { "0": "q2", "1": "q2" }
      },
      startState: "q0",
      acceptStates: ["q2"]
    }
  },
  {
    name: "Alternating ab (incomplete)",
    description: "Missing transitions (tests implicit dead state)",
    dfa: {
      states: ["q0", "q1"],
      alphabet: ["a", "b"],
      transitions: {
        "q0": { "a": "q1" },
        "q1": { "b": "q0" }
      },
      startState: "q0",
      acceptStates: ["q1"]
    }
  }
];

export function ConfigModal({ isOpen, onClose, currentDfa, onSave }: ConfigModalProps) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to current config when opened
  useEffect(() => {
    if (isOpen) {
      setJsonText(JSON.stringify(currentDfa, null, 2));
      setError(null);
      setToastMessage(null);
    }
  }, [isOpen, currentDfa]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  if (!isOpen) return null;

  const handleValidateAndSave = (textToValidate: string = jsonText, shouldClose: boolean = true) => {
    try {
      const parsed = JSON.parse(textToValidate);
      
      // Basic type checking
      if (!parsed.states || !Array.isArray(parsed.states)) throw new Error('Missing or invalid "states" array.');
      if (!parsed.alphabet || !Array.isArray(parsed.alphabet)) throw new Error('Missing or invalid "alphabet" array.');
      if (!parsed.transitions || typeof parsed.transitions !== 'object') throw new Error('Missing or invalid "transitions" object.');
      if (!parsed.startState || typeof parsed.startState !== 'string') throw new Error('Missing "startState" string.');
      if (!parsed.acceptStates || !Array.isArray(parsed.acceptStates)) throw new Error('Missing "acceptStates" array.');

      onSave(parsed as DFADefinition);
      setError(null);
      if (shouldClose) onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadSample = (sample: typeof PRESET_SAMPLES[0]) => {
    const formattedJson = JSON.stringify(sample.dfa, null, 2);
    setJsonText(formattedJson);
    handleValidateAndSave(formattedJson, false);
    setToastMessage(`Loaded preset: ${sample.name}`);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-panel" style={{ width: '1100px', maxWidth: '95vw', height: '85vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        {toastMessage && (
          <div style={{
            position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
            background: 'var(--accent-emerald)', color: '#000', padding: '8px 16px',
            borderRadius: '20px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
            animation: 'fadeIn 0.3s ease-out', zIndex: 2000
          }}>
            ✓ {toastMessage}
          </div>
        )}

        <header style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div>
             <h2 className="mono-text" style={{ fontSize: '1.2rem', color: 'var(--accent-cyan)' }}>SYSTEM.CONFIG_OVERRIDE</h2>
             <p className="text-muted" style={{ fontSize: '0.85rem' }}>Edit the JSON 5-Tuple directly to reprogram the core engine, or load a preset.</p>
           </div>
           <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', outline: 'none' }}><X size={24} /></button>
        </header>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Panel: Sample DFAs */}
          <div style={{ width: '340px', borderRight: '1px solid var(--border-subtle)', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.2)' }}>
            <h3 className="mono-text" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileJson size={16} /> PRESET ARCHIVE
            </h3>
            
            {PRESET_SAMPLES.map((sample, idx) => (
              <button 
                key={idx}
                onClick={() => loadSample(sample)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                  padding: '12px',
                  borderRadius: '6px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', gap: '4px'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'var(--accent-cyan)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
              >
                <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.95rem' }}>{sample.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: '1.4' }}>{sample.description}</div>
              </button>
            ))}
          </div>

          {/* Right Panel: JSON Editor */}
          <div style={{ padding: '1.5rem', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#0a0a0a' }}>
             {error && (
               <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--accent-rose)', borderRadius: '6px', color: 'var(--accent-rose)', display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.9rem' }}>
                  <AlertTriangle size={18} />
                  <span className="mono-text">{error}</span>
               </div>
             )}

             <textarea 
               className="mono-text"
               value={jsonText}
               onChange={(e) => setJsonText(e.target.value)}
               spellCheck={false}
               style={{ 
                 flex: 1, width: '100%',
                 background: 'transparent', color: '#a5b4fc',
                 border: 'none',
                 fontSize: '0.9rem', lineHeight: '1.5',
                 outline: 'none', resize: 'none'
               }}
             />
          </div>

        </div>

        <footer style={{ padding: '1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: 'rgba(0,0,0,0.3)' }}>
           <button className="button-secondary" onClick={onClose}>Cancel</button>
           <button className="button-primary glow-emerald" style={{ background: 'var(--accent-emerald)', color: '#000' }} onClick={() => handleValidateAndSave(jsonText, true)}>
              <CheckCircle size={18} /> Compile & Close
           </button>
        </footer>

      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; top: -70px; } to { opacity: 1; top: -60px; } }
      `}</style>
    </div>
  );
}
