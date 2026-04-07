import React, { useState } from 'react';
import { useProjectMutations } from '@/hooks/project/useProjectMutations';
import { makeToastError, makeToastSucess } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { FolderDownIcon } from 'lucide-react';

const IGNORED_DIRECTORIES = new Set(['node_modules', '.git', '.next', 'dist', 'build']); // due to browser limit

type NodeItem = {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
};

const ImportProject = ({ workspaceId }: { workspaceId: string }) => {
  const { importProject } = useProjectMutations();
  const [status, setStatus] = useState<'idle' | 'scanning' | 'uploading'>('idle');
  const [count, setCount] = useState(0);

  const walkDirectory = async (dirHandle: FileSystemDirectoryHandle, nodes: NodeItem[], currentPath: string = '') => {
    for await (const [name, handle] of dirHandle.entries()) {
      if (IGNORED_DIRECTORIES.has(name)) continue;

      const fullPath = currentPath ? `${currentPath}/${name}` : name;

      if (handle.kind === 'directory') {
        nodes.push({ name, path: fullPath, type: 'folder' });
        await walkDirectory(handle, nodes, fullPath);
      } else if (handle.kind === 'file') {
        try {
          const file = await handle.getFile();
          const content = await file.text();
          const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          nodes.push({ name, path: fullPath, type: 'file', content: normalizedContent });
          setCount(prev => prev + 1);
        } catch (fileErr) {
          console.warn(`Access error: ${fullPath}`, fileErr);
        }
      }
    }
  };

  const handleFolderImport = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker();
      setStatus('scanning');
      setCount(0);

      const nodes: NodeItem[] = [];
      await walkDirectory(dirHandle, nodes);

      if (nodes.length === 0) {
        makeToastError('No readable files found.');
        setStatus('idle');
        return;
      }

      setStatus('uploading');

      importProject.mutate(
        { workspaceId, title: dirHandle.name, nodes },
        {
          onSuccess: () => makeToastSucess('Project imported successfully.'),
          onError: err => makeToastError(err.message),
          onSettled: () => setStatus('idle'),
        }
      );
    } catch (err) {
      setStatus('idle');
      if ((err as Error).name !== 'AbortError') {
        console.error('Import failed', err);
      }
    }
  };

  return (
    <Button className="cursor-pointer" type="button" onClick={handleFolderImport} disabled={status !== 'idle'}>
      <FolderDownIcon className={`h-4 w-4 mr-2 ${status === 'uploading' ? 'animate-bounce' : ''}`} />
      {status === 'scanning' && `Scanning (${count})...`}
      {status === 'uploading' && 'Saving to Cloud...'}
      {status === 'idle' && 'Import Folder'}
    </Button>
  );
};

export default ImportProject;
