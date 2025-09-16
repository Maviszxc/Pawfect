"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

class WebSocketErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error) {
    console.error("WebSocket connection error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 text-red-800 rounded-lg">
          <h2>Connection Error</h2>
          <p>{this.state.errorMessage}</p>
          <button onClick={() => window.location.reload()}>
            Retry Connection
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WebSocketErrorBoundary;
