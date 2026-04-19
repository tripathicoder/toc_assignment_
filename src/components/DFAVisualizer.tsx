import { useMemo } from 'react';
import { ReactFlow, Background, Controls, type Node, type Edge, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { DFADefinition, StateId } from '../core/DFAEngine';

interface DFAVisualizerProps {
  dfa: DFADefinition;
  currentState: StateId | null;
  status: 'pending' | 'running' | 'accepted' | 'rejected' | 'error';
}

export function DFAVisualizer({ dfa, currentState, status }: DFAVisualizerProps) {
  // Convert DFA definition to ReactFlow nodes and edges
  const { nodes, edges } = useMemo(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    // Auto-Layout Algorithm (Simple Horizontal Spread for Phase 3)
    dfa.states.forEach((state, idx) => {
      const isStart = state === dfa.startState;
      const isAccept = dfa.acceptStates.includes(state);
      const isActive = state === currentState;
      
      let borderColor = 'var(--border-subtle)';
      let boxGlow = 'none';
      if (isActive) {
         if (status === 'accepted') { borderColor = 'var(--accent-emerald)'; boxGlow = '0 0 24px rgba(16, 185, 129, 0.5)'; }
         else if (status === 'error' || status === 'rejected') { borderColor = 'var(--accent-rose)'; boxGlow = '0 0 24px rgba(244, 63, 94, 0.5)'; }
         else { borderColor = 'var(--accent-cyan)'; boxGlow = '0 0 24px rgba(0, 240, 255, 0.5)'; }
      } else if (isAccept) {
         borderColor = 'var(--text-muted)';
      } else if (isStart) {
         borderColor = 'var(--text-muted)';
      }

      newNodes.push({
        id: state,
        position: { x: 150 + idx * 250, y: 150 + (idx % 2 === 0 ? 0 : 80) }, // Staggered Y to avoid edge overlaps
        data: { label: state },
        style: {
          background: isActive ? 'var(--bg-elevated)' : 'var(--bg-surface)',
          color: isActive ? 'white' : 'var(--text-main)',
          border: isAccept ? `4px double ${borderColor}` : `2px solid ${borderColor}`,
          boxShadow: boxGlow,
          borderRadius: '50%',
          width: 70,
          height: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontWeight: 'bold',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: isActive ? 10 : 1
        }
      });
      
      const transitions = dfa.transitions[state] || {};
      
      // Group symbols by target state
      const edgeMap: Record<string, string[]> = {};
      for (const [symbol, target] of Object.entries(transitions)) {
         if (!edgeMap[target]) edgeMap[target] = [];
         edgeMap[target].push(symbol);
      }
      
      for (const [target, symbols] of Object.entries(edgeMap)) {
         newEdges.push({
           id: `${state}-${target}`,
           source: state,
           target: target,
           label: symbols.join(', '),
           animated: isActive && status === 'running', // Animate edges out of active state
           type: state === target ? 'step' : 'bezier',
           markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--border-subtle)' },
           style: { stroke: 'var(--border-subtle)', strokeWidth: 2 },
           labelStyle: { fill: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' },
           labelBgStyle: { fill: 'var(--bg-elevated)', fillOpacity: 0.8 },
           labelBgPadding: [4, 4],
           labelBgBorderRadius: 4,
         });
      }
    });
    
    return { nodes: newNodes, edges: newEdges };
  }, [dfa, currentState, status]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges}
        fitView
        colorMode="dark"
        proOptions={{ hideAttribution: true }} // Premium Look
      >
        <Background color="var(--border-subtle)" gap={24} size={2} />
        <Controls position="bottom-left" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
