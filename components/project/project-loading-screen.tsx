import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';
import { LoadStep } from './use-project-loader';

export function ProjectLoadingScreen({ steps, pct }: { steps: LoadStep[]; pct: number }) {
  return (
    <div className="absolute inset-0 z-54 flex flex-col items-center justify-center gap-8 bg-background">
      <div className="flex flex-col items-center gap-4 w-[280px]">
        <div className="w-full h-0.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-foreground rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between w-full">
          <span className="text-xs text-muted-foreground">{steps.find(s => s.active)?.label ?? 'Ready'}</span>
          <span className="text-xs text-muted-foreground">{pct}%</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 w-[280px]">
        {steps.map(step => (
          <div key={step.key} className="flex items-center gap-2.5 text-sm">
            <div
              className={cn(
                'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                step.done && 'border-green-500 bg-green-50',
                step.active && !step.done && 'border-border',
                !step.done && !step.active && 'border-border/40'
              )}
            >
              {step.done && <Check className="w-2.5 h-2.5 text-green-600" />}
              {step.active && !step.done && <Loader2 className="w-2.5 h-2.5 animate-spin text-muted-foreground" />}
            </div>
            <span className={cn('text-muted-foreground', (step.done || step.active) && 'text-foreground')}>{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
