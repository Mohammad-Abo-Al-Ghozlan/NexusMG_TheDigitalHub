import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF4D6D15] border border-[#FF4D6D30]">
            <AlertTriangle className="h-8 w-8 text-[#FF4D6D]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#F0F0FF]">Something went wrong</h2>
            <p className="mt-2 text-sm text-[#8888AA] max-w-sm">
              {this.state.message || 'An unexpected error occurred loading this page.'}
            </p>
          </div>
          <Button onClick={this.handleReset} variant="outline">
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
