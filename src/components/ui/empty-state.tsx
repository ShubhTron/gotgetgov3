import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
}

export function EmptyState({ icon, title, description, ctaLabel, onCta, className }: EmptyStateProps) {
  return (
    <Card className={cn('border-dashed flex flex-col items-center justify-center p-8 text-center gap-3', className)}>
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {ctaLabel && onCta && (
        <Button onClick={onCta} size="sm" className="mt-1">
          {ctaLabel}
        </Button>
      )}
    </Card>
  );
}
