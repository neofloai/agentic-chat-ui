import { Component, type ErrorInfo, type ReactNode } from 'react';

export interface BlockErrorBoundaryProps {
  children: ReactNode;
  /** Rendered instead of a block that threw. */
  fallback: (error: Error) => ReactNode;
  /** Changing this resets the boundary (e.g. the block's data changed). */
  resetKey?: unknown;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  error: Error | null;
  resetKey: unknown;
}

/** Keeps one crashing card from taking the whole thread down. */
export class BlockErrorBoundary extends Component<BlockErrorBoundaryProps, State> {
  override state: State = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: BlockErrorBoundaryProps, state: State): Partial<State> | null {
    if (props.resetKey !== state.resetKey) return { error: null, resetKey: props.resetKey };
    return null;
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  override render(): ReactNode {
    return this.state.error ? this.props.fallback(this.state.error) : this.props.children;
  }
}
