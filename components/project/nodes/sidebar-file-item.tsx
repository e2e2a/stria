import { INode } from '@/types';
import { cn } from '@/lib/utils';
import { useNodeStore } from '@/features/editor/stores/nodes';
import { memo, useState } from 'react';
import Image from 'next/image';
import { useNodeMutations } from '@/hooks/node/useNodeMutations';
import { makeToastError } from '@/lib/toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTabStore } from '@/features/editor/stores/tabs';

interface IProps {
  item: INode;
  depth: number;
}

const SidebarFileItemComponent = ({ item, depth }: IProps) => {
  const activeNode = useNodeStore(state => state.activeNode);
  const isUpdatingNode = useNodeStore(state => state.isUpdatingNode);
  const selectedNode = useNodeStore(state => state.selectedNode);
  const setActiveNode = useNodeStore(state => state.setActiveNode);
  const setIsCreating = useNodeStore(state => state.setIsCreating);
  const setIsUpdatingNode = useNodeStore(state => state.setIsUpdatingNode);
  const openTab = useTabStore(state => state.openTab);
  const [title, setTitle] = useState('');
  const [disabled, setDisabled] = useState(false);

  const handleNodeClick = (node: INode) => {
    openTab(node.projectId, node, true);
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
      useTabStore.getState().updateTabNode(item.projectId, item._id, { title: trimmed });
      setIsUpdatingNode(null);
      const payload = {
        _id: item._id,
        pid: item.projectId,
        title: title as string,
      };
      mutation.update.mutate(payload, {
        onError: err => {
          makeToastError(err.message);
          return;
        },
        onSettled: () => {
          setIsUpdatingNode(null);
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
        <Image src={'/images/file.svg'} alt="File Icon" className="w-4.5! h-4.5" width={5} height={5} />
        <div className="truncate bg-transparent w-full">
          <Input
            onBlur={update}
            disabled={disabled}
            autoFocus
            value={title || item?.title || ''}
            onKeyDown={handleKeyDown}
            onChange={e => setTitle(e.target.value)}
            className="h-4 text-sm text-primary-foreground text-start w-full px-0 focus-visible:ring-0 rounded-none"
          />
        </div>
      </div>
    );

  return (
    <Button
      onClick={() => handleNodeClick(item)}
      tabIndex={0}
      className={cn(
        'transition-none pointer-events-auto gap-0 flex duration-0 h-fit leading-none py-0.5 rounded-none bg-transparent active:ring-0 text-inherit border-none outline-none shadow-none focus:outline-none ring-0 focus:ring-0 cursor-pointer w-full justify-start truncate',
        activeNode?._id === item._id
          ? 'bg-accent hover:bg-accent! text-foreground focus:bg-primary focus:text-primary-foreground focus:hover:bg-primary!'
          : 'hover:bg-accent/50! hover:text-accent-foreground',
        selectedNode?._id === item._id ? 'ring-2 active:ring-2 hover:ring-2 ring-inset ring-primary shadow-md shadow-primary/20' : 'active:ring-0'
      )}
      style={{
        paddingLeft: `${depth * 8}px`,
      }}
    >
      <Image src={'/images/file.svg'} alt="File Icon" className="w-4.5! h-4.5" width={5} height={5} />
      <p className="truncate">{item.title}</p>
    </Button>
  );
};

const SidebarFileItem = memo(SidebarFileItemComponent);
export default SidebarFileItem;
