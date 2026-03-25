import { AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message, retryLabel = 'Try again', onRetry, className }: ErrorStateProps) {
  return (
    <Card className={cn('border-destructive flex flex-col items-center justify-center p-8 text-center gap-3', className)}>
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </Card>
  );
}
