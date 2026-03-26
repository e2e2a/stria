import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IWorkspaceMember } from '@/types';
import { Trash, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { makeToastError, makeToastSucess } from '@/lib/toast';
import { useState } from 'react';
import { useGetMyWorkspaceMembership } from '@/hooks/workspasceMember/useQueries';
import { useWorkspaceMemberMutations } from '@/hooks/workspasceMember/useMutation';
import { useInvitationMutations } from '@/hooks/invitation/useMutation';

interface IProps {
  item: IWorkspaceMember;
  workspaceId: string;
}

function RemoveMemberContent({ item }: { item: IWorkspaceMember }) {
  return (
    <AlertDialogDescription className="text-start">
      {item.user ? (
        <>
          This action cannot be undone. This will remove <span className="font-bold">{item.email}</span> from this project. They will immediately lose
          access to all files and data.
        </>
      ) : (
        <>
          This action cannot be undone. This will cancel the invitation for <span className="font-bold">{item.email}</span>. They will not be able to join
          the project unless invited again.
        </>
      )}
    </AlertDialogDescription>
  );
}

export default function TrashDialog({ item, workspaceId }: IProps) {
  const { data: mData } = useGetMyWorkspaceMembership(workspaceId);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const canTrash = mData?.permissions?.canDeleteProjectInvite;

  const memberMutation = useWorkspaceMemberMutations();
  const invitationMutation = useInvitationMutations();

  const handleTrashMember = () => {
    memberMutation.trash.mutate(
      { wid: workspaceId, mid: item._id },
      {
        onSuccess: () => {
          makeToastSucess('User has been deleted');
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
  };

  const handleTrashInvitation = () => {
    invitationMutation.trash.mutate(
      { id: item._id, workspaceId },
      {
        onSuccess: () => {
          makeToastSucess('User invitaion has been deleted');
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
  };

  const onSubmit = () => {
    setLoading(true);
    if (item.status === 'accepted') return handleTrashMember();
    return handleTrashInvitation();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <AlertDialogTrigger className={'w-auto'} disabled={!canTrash} onClick={() => setIsOpen(true)}>
          <TooltipTrigger asChild>
            <span tabIndex={0}>
              <div
                className={`${
                  !canTrash ? 'opacity-50 cursor-not-allowed bg-secondary border-border rounded-md' : 'action-button'
                } w-full items-center flex size-4 px-2 gap-1.5 h-8`}
              >
                <Trash className="h-4 w-4" />
              </div>
            </span>
          </TooltipTrigger>
        </AlertDialogTrigger>
        <TooltipContent
          className="max-w-[200px] text-foreground bg-sidebar font-sans [&_svg]:bg-sidebar [&_svg]:border-b-2 [&_svg]:border-r-2 border-2 border-border [&_svg]:fill-sidebar"
          side="top"
        >
          {!canTrash && 'You do not have permission'}
          {canTrash && item.status === 'accepted' && 'You are about to remove the user.'}
          {canTrash && item.status !== 'accepted' && 'You are about to remove the user invitation.'}
        </TooltipContent>
      </Tooltip>
      <AlertDialogContent className="flex sm:flex-row gap-x-1 flex-col rounded-md">
        <div className="place-items-center sm:place-items-start">
          <div className="bg-red-200 rounded-full p-1 flex items-center justify-center h-8 w-8">
            <TriangleAlert className="text-red-600 h-5 w-5" />
          </div>
        </div>
        <div className="flex flex-col">
          <AlertDialogHeader className="gap-y-3">
            <AlertDialogTitle className="sm:text-xl text-start font-bold">
              Are you sure you want to remove the user{item.user ? '' : ' invitation'}?
            </AlertDialogTitle>
            <RemoveMemberContent item={item} />
          </AlertDialogHeader>
          <span className="my-3">Are you sure you wish to proceed?</span>
          <AlertDialogFooter className="mt-5">
            <AlertDialogCancel type="button" className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <Button className="bg-red-500 hover:bg-red-500/90 cursor-pointer" disabled={loading} onClick={onSubmit} type="submit">
              Continue
            </Button>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
