/**
 * Core mathematical engine for the Deterministic Finite Automaton (DFA) Simulator.
 * Strictly decoupled from any UI/React concerns.
 *
 * It represents the formal 5-tuple: (Q, Σ, δ, q0, F)
 */

export type StateId = string;
export type Symbol = string;

export interface DFADefinition {
  states: StateId[];                                      // Q
  alphabet: Symbol[];                                     // Σ
  transitions: Record<StateId, Record<Symbol, StateId>>;  // δ mapping
  startState: StateId;                                    // q0
  acceptStates: StateId[];                                // F
}

/**
 * Represents a single execution frame in time.
 * Allowing the UI to completely decouple rendering speed from computation logic.
 */
export interface IterationState {
  stepIndex: number;
  currentState: StateId;
  inputSymbol: Symbol | null;
  nextState: StateId | null;
  remainingInput: string;
  isAccepted: boolean | null;
  status: 'pending' | 'running' | 'accepted' | 'rejected' | 'error';
  errorMessage?: string;
}

export class DFAEngine {
  private definition: DFADefinition;

  constructor(definition: DFADefinition) {
    this.definition = definition;
    this.validateDefinition();
  }

  /**
   * Validates the 5-tuples for structural and logical correctness.
   * Throws an error to cleanly kill setup if the abstract machine definition is invalid.
   */
  private validateDefinition(): void {
    const { states, alphabet, transitions, startState, acceptStates } = this.definition;

    if (!states.includes(startState)) {
      throw new Error(`Invalid Machine: Start state '${startState}' is not in the states set.`);
    }

    const invalidAcceptStates = acceptStates.filter(s => !states.includes(s));
    if (invalidAcceptStates.length > 0) {
      throw new Error(`Invalid Machine: Accept states [${invalidAcceptStates.join(', ')}] are not in the states set.`);
    }

    for (const [state, stateTransitions] of Object.entries(transitions)) {
      if (!states.includes(state)) {
        throw new Error(`Invalid Machine: Transition defined for unknown state '${state}'.`);
      }
      for (const [symbol, targetState] of Object.entries(stateTransitions)) {
        if (!alphabet.includes(symbol)) {
          throw new Error(`Invalid Machine: Transition symbol '${symbol}' is not in the valid alphabet.`);
        }
        if (!states.includes(targetState)) {
          throw new Error(`Invalid Machine: Transition points to unknown target state '${targetState}'.`);
        }
      }
    }
  }

  /**
   * Computes a full step-by-step trace of the DFA executing a given input string.
   * Conceptually, this is the entire 'under the hood' lifeblood of the visualizer.
   */
  public computeTrace(input: string): IterationState[] {
    const trace: IterationState[] = [];
    let currentState = this.definition.startState;
    
    // Step 0: The machine at rest before consuming characters
    trace.push({
      stepIndex: 0,
      currentState,
      inputSymbol: null,
      nextState: null,
      remainingInput: input,
      isAccepted: null,
      status: 'pending'
    });

    // Step 1 to N: Processing each character linearly
    for (let i = 0; i < input.length; i++) {
        const symbol = input[i];
        const remainingInput = input.substring(i + 1);
        
        // Ensure character respects the alphabet
        if (!this.definition.alphabet.includes(symbol)) {
          trace.push({
            stepIndex: i + 1,
            currentState,
            inputSymbol: symbol,
            nextState: null,
            remainingInput,
            isAccepted: false,
            status: 'error',
            errorMessage: `Computation Fault: Symbol '${symbol}' not found in defined alphabet.`
          });
          return trace;
        }

        const stateTransitions = this.definition.transitions[currentState];
        
        // If missing a transition, drop into an implicit dead state and reject.
        if (!stateTransitions || !(symbol in stateTransitions)) {
          trace.push({
            stepIndex: i + 1,
            currentState,
            inputSymbol: symbol,
            nextState: null,
            remainingInput,
            isAccepted: false,
            status: 'rejected',
            errorMessage: `Implicit Dead State: No transition for state '${currentState}' on symbol '${symbol}'`
          });
          return trace;
        }

        const nextState = stateTransitions[symbol];
        
        trace.push({
          stepIndex: i + 1,
          currentState,
          inputSymbol: symbol,
          nextState,
          remainingInput,
          isAccepted: null,
          status: 'running'
        });

        currentState = nextState;
    }

    // Halting phase: Output condition check
    const isAccepted = this.definition.acceptStates.includes(currentState);
    trace.push({
      stepIndex: input.length + 1,
      currentState,
      inputSymbol: null,
      nextState: null,
      remainingInput: "",
      isAccepted,
      status: isAccepted ? 'accepted' : 'rejected'
    });

    return trace;
  }
}
