import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-slate-800/50 border-red-500/30 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <CardTitle className="text-white">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-purple-300 text-sm">
                An unexpected error occurred while loading your bubble universe. 
                Don't worry, your bubbles are safe!
              </p>
              
              {import.meta.env.DEV && this.state.error && (
                <details className="text-left bg-slate-900/50 p-3 rounded border border-red-500/20">
                  <summary className="text-red-400 text-xs cursor-pointer mb-2">
                    Error Details (Development Only)
                  </summary>
                  <code className="text-xs text-red-300 break-all">
                    {this.state.error.message}
                  </code>
                </details>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}