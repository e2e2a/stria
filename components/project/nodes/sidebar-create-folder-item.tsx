import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { useNodeStore } from '@/features/editor/stores/nodes';
import { useState } from 'react';
import { useNodeMutations } from '@/hooks/node/useNodeMutations';
import { makeToastError } from '@/lib/toast';
import { useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';

interface IProps {
  depth: number;
}

const SidebarCreateFolderItem = ({ depth }: IProps) => {
  const isCreating = useNodeStore(state => state.isCreating);
  const setIsCreating = useNodeStore(state => state.setIsCreating);
  const params = useParams();
  const pid = params.pid || '';
  const [title, setTitle] = useState('');
  const [disabled, setDisabled] = useState(false);

  const mutation = useNodeMutations();

  const create = () => {
    if (!isCreating) return;
    setDisabled(true);
    const trimmed = title.trim();
    if (!trimmed) {
      setIsCreating(null);
      return;
    }

    const payload = {
      projectId: pid,
      parentId: isCreating.parentId,
      type: isCreating.type,
      title: title as string,
    };
    mutation.create.mutate(payload, {
      onSuccess: data => {
        setTimeout(() => {
          setIsCreating(null);
        }, 100);
        useNodeStore.getState().createNodeWithUndo('data' in data ? data.data : data);
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
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      create();
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsCreating(null);
    }
  };

  return (
    <div
      id={`sidebar-creating-folder-item`}
      className={cn(
        "[&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
        'inline-flex items-center transition-none shrink-0 gap-0 duration-0 h-auto leading-none py-0.5 rounded-none bg-transparent active:ring-0 hover:bg-accent text-inherit border-none outline-none shadow-none focus:outline-none ring-0 focus:ring-0 cursor-pointer w-full justify-start truncate'
      )}
      style={{
        paddingLeft: `${depth * 8}px`,
      }}
    >
      <ChevronRight className="rotate-0" />
      <img src="/images/closed-folder.svg" alt="Folder Icon" className="w-4.5 h-4.5" />
      <div className="truncate bg-transparent w-full">
        <Input
          onBlur={create}
          autoFocus
          onKeyDown={handleKeyDown}
          disabled={disabled}
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="h-4 text-sm text-primary-foreground text-start w-full px-0 focus-visible:ring-0 rounded-none"
        />
      </div>
    </div>
  );
};

export default SidebarCreateFolderItem;
