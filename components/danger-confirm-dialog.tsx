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
import { useNodeMutations } from '@/hooks/node/useNodeMutations';
import { makeToastError } from '@/lib/toast';
import { INode } from '@/types';
import { useState } from 'react';
import { useNodeStore } from '@/features/editor/stores/nodes';

interface IProps {
  triggerTitle: string;
  title: string;
  description: string;
  node: INode;
}
export function DangerConfirmDialog({ triggerTitle, title, description, node }: IProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const mutation = useNodeMutations();
  const onTrash = async () => {
    setIsLoading(true);
    mutation.trash.mutate(
      { _id: node._id as string, pid: node.projectId },
      {
        onSuccess: () => {
          useNodeStore.getState().deleteNodeWithUndo(node._id);
          setIsOpen(false);
          setIsLoading(false);
          return;
        },
        onError: err => {
          makeToastError(err.message);
          return;
        },
        onSettled: () => {
          setIsOpen(false);
          setIsLoading(false);
        },
      }
    );
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger
        className="w-full py-1.5 flex items-center pl-8 cursor-pointer hover:bg-destructive/10 text-destructive font-semibold!"
        onClick={() => setIsOpen(true)}
      >
        {triggerTitle}
      </AlertDialogTrigger>
      <AlertDialogContent onClick={e => e.preventDefault()} onContextMenu={e => e.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-foreground hover:bg-destructive/80 cursor-pointer"
            disabled={isLoading}
            onClick={e => {
              e.preventDefault();
              onTrash();
            }}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
