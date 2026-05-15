import { Alert, AlertDescription, AlertIcon, AlertTitle, Button, Stack } from '@chakra-ui/react';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
}

export class FeedbackFormErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[FeedbackForm] Unhandled render error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Alert status="error" flexDirection="column" alignItems="flex-start" gap={3} p={4} borderRadius="md">
          <Stack direction="row" align="center">
            <AlertIcon />
            <AlertTitle>Something went wrong</AlertTitle>
          </Stack>
          <AlertDescription>
            {this.props.fallbackMessage ??
              'An unexpected error occurred with this form. You can try resetting below, or contact support if the problem persists.'}
          </AlertDescription>
          <Button size="sm" onClick={this.handleReset}>
            Reset form
          </Button>
        </Alert>
      );
    }

    return this.props.children;
  }
}
