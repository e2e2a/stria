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
import { ContextMenuItem } from './ui/context-menu';
import { useNodeStore } from '@/features/editor/stores/nodes';
interface IProps {
  triggerTitle: string;
  title: string;
  description: string;
  node: INode;
}
export function DangerConfirmDialog({ triggerTitle, title, description, node }: IProps) {
  const [isOpen, setIsOpen] = useState(false);
  const mutation = useNodeMutations();
  const onTrash = async () => {
    mutation.trash.mutate(
      { _id: node._id as string, pid: node.projectId },
      {
        onSuccess: () => {
          useNodeStore.getState().deleteNodeWithUndo(node._id);
          setIsOpen(false);
          return;
        },
        onError: err => {
          makeToastError(err.message);
          return;
        },
        onSettled: () => {
          setIsOpen(false);
        },
      }
    );
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger className="w-full py-1.5 flex items-center pl-8 cursor-pointer" onClick={() => setIsOpen(true)} asChild>
        <span>{triggerTitle}</span>
      </AlertDialogTrigger>
      <AlertDialogContent onClick={e => e.preventDefault()} onContextMenu={e => e.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-blue-500 hover:bg-blue-500/90"
            onClick={e => {
              e.preventDefault();
              onTrash();
              // setIsOpen(false);
            }}
            asChild
          >
            <ContextMenuItem className=" cursor-pointer ">Continue</ContextMenuItem>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
