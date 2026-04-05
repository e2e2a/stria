import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SquarePen } from 'lucide-react';
import { Button } from '@/components/ui/button';
const Page = () => {
  const id: string | undefined = undefined;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild disabled={true}>
          <div className="w-fit h-fit ">
            <Button className="px-2! py-1! border border-transparent" variant={'ghost'} disabled={true}>
              <SquarePen className="h-6! w-6!" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side={'bottom'}
          className="max-w-[200px] z-101 text-foreground bg-sidebar text-center font-sans [&_svg]:bg-sidebar [&_svg]:border-b-[0.1px] [&_svg]:border-r-[0.1px] border-[0.1px] border-border [&_svg]:fill-sidebar"
        >
          123
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default Page;
