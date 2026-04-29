import { INode } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { useNodeStore } from '@/features/editor/stores/nodes';
import { memo, useState } from 'react';
import { useNodeMutations } from '@/hooks/node/useNodeMutations';
import { makeToastError } from '@/lib/toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface IProps {
  item: INode;
  isOpen: boolean;
  depth: number;
}

const SidebarFolderItemComponent = ({ item, isOpen, depth }: IProps) => {
  const activeNode = useNodeStore(state => state.activeNode);
  const isUpdatingNode = useNodeStore(state => state.isUpdatingNode);
  const selectedNode = useNodeStore(state => state.selectedNode);
  const setActiveNode = useNodeStore(state => state.setActiveNode);
  const setIsCreating = useNodeStore(state => state.setIsCreating);
  const setIsUpdatingNode = useNodeStore(state => state.setIsUpdatingNode);
  const [title, setTitle] = useState('');
  const [disabled, setDisabled] = useState(false);

  const handleNodeClick = (node: INode) => {
    setActiveNode(node._id);
    setIsCreating(null);
  };

  const mutation = useNodeMutations();

  const update = () => {
    setDisabled(true);
    const trimmed = title.trim();
    if (!trimmed || item.title === trimmed) {
      setIsUpdatingNode(null);
      return;
    }
    try {
      useNodeStore.getState().updateNode(item._id, { title: trimmed });
      setIsUpdatingNode(null);
      const payload = {
        _id: item._id,
        pid: item.projectId,
        title: title as string,
      };
      mutation.update.mutate(payload, {
        onSuccess: () => {
          setTimeout(() => {
            setIsUpdatingNode(null);
          }, 100);
          return;
        },
        onError: err => {
          makeToastError(err.message);
          return;
        },
        onSettled: () => {
          setDisabled(false);
        },
      });
    } catch (err) {
      console.log('err', err);
      let message = 'Unknown Error';
      if (err instanceof Error) {
        message = err.message;
        console.log('Error message:', err.message);
      } else {
        message = err as string;
        console.log('Unknown error', err);
      }
      makeToastError(message);
    } finally {
      setIsUpdatingNode(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      update();
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsUpdatingNode(null);
    }
  };

  if (isUpdatingNode && isUpdatingNode._id === item._id)
    return (
      <div
        id={`sidebar-edit-item-${item._id}`}
        className={cn(
          "[&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
          'inline-flex items-center transition-none shrink-0 gap-0 duration-0 h-auto leading-none py-0.5 rounded-none bg-transparent active:ring-0 hover:bg-accent text-inherit border-none outline-none shadow-none focus:outline-none ring-0 focus:ring-0 cursor-pointer w-full justify-start truncate'
        )}
        style={{
          paddingLeft: `${depth * 8}px`,
        }}
      >
        <ChevronRight className={`${isOpen ? 'rotate-90' : 'rotate-0'}`} />
        <img src={isOpen ? '/images/opened-folder.svg' : '/images/closed-folder.svg'} alt="Folder Icon" className="w-4.5 h-4.5" />
        <div className="truncate bg-transparent w-full">
          <Input
            onBlur={update}
            autoFocus
            disabled={disabled}
            value={title || item?.title || ''}
            onKeyDown={handleKeyDown}
            onChange={e => setTitle(e.target.value)}
            className="h-4 text-sm text-foreground text-start w-full px-0 focus-visible:ring-0 rounded-none"
          />
        </div>
      </div>
    );

  return (
    <Button
      onClick={() => handleNodeClick(item)}
      tabIndex={0}
      type="button"
      className={cn(
        'transition-none gap-0 flex duration-0 h-auto leading-none py-0.5 rounded-none bg-transparent active:ring-0 text-inherit border-none outline-none shadow-none focus:outline-none ring-0 focus:ring-0 cursor-pointer w-full justify-start truncate',
        activeNode?._id === item._id
          ? 'bg-accent hover:bg-accent text-foreground focus:bg-primary focus:text-primary-foreground focus:hover:bg-primary'
          : 'hover:bg-accent/50! hover:text-accent-foreground',
        selectedNode?._id === item._id ? 'ring-2 active:ring-2 hover:ring-2 ring-inset ring-primary shadow-md shadow-primary/20' : 'active:ring-0'
      )}
      style={{
        paddingLeft: `${depth * 8}px`,
      }}
    >
      <ChevronRight className={`${isOpen ? 'rotate-90' : 'rotate-0'}`} />
      <img src={isOpen ? '/images/opened-folder.svg' : '/images/closed-folder.svg'} alt="Folder Icon" className="w-4.5 h-4.5" />
      <p className="truncate">{title || item.title}</p>
    </Button>
  );
};

const SidebarFolderItem = memo(SidebarFolderItemComponent);
export default SidebarFolderItem;
