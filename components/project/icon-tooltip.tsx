import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface IconTooltipProps {
  children: React.ReactNode;
  label: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export const IconTooltip = ({ children, label, side = 'bottom' }: IconTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-fit h-fit ">{children}</div>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-[200px] z-101 text-foreground bg-sidebar text-center font-sans [&_svg]:bg-sidebar [&_svg]:border-b-[0.1px] [&_svg]:border-r-[0.1px] border-[0.1px] border-border [&_svg]:fill-sidebar"
        >
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
