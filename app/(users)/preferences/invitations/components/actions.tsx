import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useCallback, useState } from 'react';
import { IUserInvitations } from '@/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { makeToastError, makeToastSucess } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { useInvitationMutations } from '@/hooks/invitation/useMutation';

interface IProps {
  item: IUserInvitations;
}

export function Actions({ item }: IProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const mutation = useInvitationMutations();

  const handleAccept = useCallback(() => {
    setLoading(true);
    mutation.accept.mutate(
      { id: item._id as string, workspaceId: item.workspace._id as string },
      {
        onSuccess: () => {
          makeToastSucess('Invitation accepted successfully.');
          setIsOpen(false);
          return;
        },
        onError: err => {
          makeToastError(err.message);
          return;
        },
        onSettled: () => {
          setLoading(false);
        },
      }
    );
  }, [item, mutation]);

  const handleReject = useCallback(() => {
    setLoading(true);
    mutation.reject.mutate(
      { id: item._id as string, workspaceId: item.workspace._id as string },
      {
        onSuccess: () => {
          makeToastSucess('Invitation declined successfully.');
          setIsOpen(false);
          return;
        },
        onError: err => {
          makeToastError(err.message);
          return;
        },
        onSettled: () => {
          setLoading(false);
        },
      }
    );
  }, [item, mutation]);

  return (
    <div className="inline-flex flex-row gap-x-2 items-center justify-center">
      <div className="text-center">
        <Button size={'sm'} type="button" variant={'secondary'} disabled={loading} onClick={handleAccept} className="action-button">
          ACCEPT
        </Button>
      </div>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <AlertDialogTrigger className={'w-auto'} disabled={loading} onClick={() => setIsOpen(true)}>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <div className="w-full items-center flex size-4 px-3 gap-1.5 h-8 action-button">DECLINE</div>
              </span>
            </TooltipTrigger>
          </AlertDialogTrigger>
          <TooltipContent
            className="max-w-[200px] text-foreground bg-sidebar font-sans [&_svg]:bg-sidebar [&_svg]:border-b-2 [&_svg]:border-r-2 border-2 border-border [&_svg]:fill-sidebar"
            side="left"
          >
            You are about to decline the invitation. You will not be able to join this workspace unless you are invited again.
          </TooltipContent>
        </Tooltip>

        <AlertDialogContent className="top-[5%] translate-y-0" onClick={e => e.preventDefault()} onContextMenu={e => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl sm:text-2xl font-bold text-start">Decline Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to decline the invitation to <span className="font-bold">{item.workspace.title}</span>
              . You will not be able to join this workspace unless you are invited again.
              <br />
              <br />
              <span>Are you sure you want to proceed?</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
              disabled={loading}
              onClick={() => handleReject()}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
