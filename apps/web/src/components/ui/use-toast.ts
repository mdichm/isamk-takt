'use client';

import { toast as sonnerToast } from 'sonner';

export function useToast() {
  return {
    toast: (props: {
      title?: string;
      description?: string;
      variant?: 'default' | 'destructive';
    }) => {
      sonnerToast(props.title ?? '', {
        description: props.description,
        className: props.variant === 'destructive' ? 'border-destructive' : undefined,
      });
    },
  };
}

