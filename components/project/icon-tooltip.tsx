import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface IconTooltipProps {
  children: React.ReactNode;
  label: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
  className?: string;
}

export const IconTooltip = ({ children, label, side = 'bottom', disabled = false, className = '' }: IconTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip open={disabled ? false : undefined}>
        <TooltipTrigger asChild>
          <div className={cn('w-fit h-fit ', className)}>{children}</div>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-[200px] z-101 text-foreground bg-sidebar text-center app-font-interface [&_svg]:bg-sidebar [&_svg]:border-b-[0.1px] [&_svg]:border-r-[0.1px] border-[0.1px] border-border [&_svg]:fill-sidebar"
        >
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
