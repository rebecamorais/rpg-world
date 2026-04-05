'use client';

import { Spinner } from '@frontend/components/ui/spinner';
import { useThematicLoading } from '@frontend/hooks/useThematicLoading';
import { cn } from '@frontend/lib/utils';

interface LoadingStateProps {
  /**
   * Optional custom message to display below the spinner.
   */
  message?: string;
  /**
   * Whether to show one of the thematic loading messages if no message is provided.
   * Defaults to true.
   */
  thematic?: boolean;
  /**
   * Additional classes for the container.
   */
  className?: string;
  /**
   * If true, renders as a fixed overlay with a dark backdrop.
   */
  fullScreen?: boolean;
}

/**
 * LoadingState: A unified & thematic loading component.
 * Features a centered Spinner and an optional message.
 */
export function LoadingState({
  message,
  thematic = true,
  className,
  fullScreen = false,
}: LoadingStateProps) {
  const displayText = useThematicLoading(message, thematic);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-12',
        fullScreen && 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
        className,
      )}
    >
      <div className="relative">
        <Spinner size="lg" className="text-primary" />
        <div className="bg-primary/20 absolute inset-0 blur-xl filter" />
      </div>

      {displayText && (
        <p className="animate-pulse text-sm font-semibold tracking-wider text-gray-400 italic">
          {displayText}
        </p>
      )}
    </div>
  );
}
