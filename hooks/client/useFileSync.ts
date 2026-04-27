import { useEffect, useRef, useState } from 'react';
import { useNodeMutations } from '@/hooks/node/useNodeMutations';
import { useNodeByIdQuery } from '../node/useNodeQuery'; // Adjust path as needed
import { INode } from '@/types';

const findChild = (nodes: INode[] | undefined, title: string, type: 'folder' | 'file'): INode | undefined => {
  return nodes?.find(n => n.title === title && n.type === type);
};

const ensureNode = async (
  mutation: ReturnType<typeof useNodeMutations>,
  projectId: string,
  parentId: string | null,
  title: string,
  type: 'folder' | 'file',
  children?: INode[]
): Promise<INode | null> => {
  const existing = findChild(children, title, type);
  if (existing) return existing;
  const res = await mutation.create.mutateAsync({ projectId, parentId, type, title }).catch(() => null);
  if (!res) return null;
  return 'data' in res ? res.data : res;
};

export interface UseFileSyncProps {
  projectId: string;
  nData: { nodes: INode[] | Record<string, INode> } | undefined | null;
  fileName: string;
  fileContent: string;
  onInit: (content: string) => void;
}

export function useFileSync({ projectId, nData, fileName, fileContent, onInit }: UseFileSyncProps) {
  const mutation = useNodeMutations();
  const hasInitializedRef = useRef(false);
  const lastSavedContentRef = useRef<string | null>(null);

  const mutationRef = useRef(mutation);
  const rootNodesRef = useRef<INode[]>([]);
  const onInitRef = useRef(onInit);

  const rootNodes: INode[] = Array.isArray(nData?.nodes) ? nData.nodes : Object.values(nData?.nodes ?? {});

  // FIX: Update refs safely after the render phase to satisfy React Strict Mode
  useEffect(() => {
    mutationRef.current = mutation;
    rootNodesRef.current = rootNodes;
    onInitRef.current = onInit;
  });

  const rootFolder = findChild(rootNodes, '.mondreymd', 'folder');
  const optionsFolder = findChild(rootFolder?.children, 'options', 'folder');
  const targetNode = findChild(optionsFolder?.children, fileName, 'file');

  const queryId = targetNode?._id ?? '';
  const { data: fetchedNode, isSuccess, isLoading: isNodeLoading } = useNodeByIdQuery(queryId);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (hasInitializedRef.current || rootNodes.length === 0) return;
    if (targetNode && (!isSuccess || !fetchedNode)) return;

    if (fetchedNode?.content) {
      try {
        onInitRef.current(fetchedNode.content);
        lastSavedContentRef.current = fetchedNode.content;
      } catch (e) {
        console.error(`Failed to parse ${fileName}:`, e);
      }
    }

    hasInitializedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsReady(true);
  }, [rootNodes.length, targetNode, fetchedNode, isSuccess, fileName]);

  useEffect(() => {
    if (!hasInitializedRef.current || lastSavedContentRef.current === fileContent) return;

    const timer = setTimeout(async () => {
      try {
        const nodes = rootNodesRef.current;
        const mut = mutationRef.current;
        const guaranteedRoot = await ensureNode(mut, projectId, null, '.mondreymd', 'folder', nodes);
        if (!guaranteedRoot?._id) return;

        const guaranteedOptions = await ensureNode(mut, projectId, guaranteedRoot._id, 'options', 'folder', guaranteedRoot.children);
        if (!guaranteedOptions?._id) return;

        const guaranteedFile = await ensureNode(mut, projectId, guaranteedOptions._id, fileName, 'file', guaranteedOptions.children);
        if (!guaranteedFile?._id) return;

        mut.update.mutate({ _id: guaranteedFile._id, pid: projectId, content: fileContent });
        lastSavedContentRef.current = fileContent;
      } catch (e) {
        console.error(`Sync Error for ${fileName}:`, e);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [fileContent, projectId, fileName]);

  const isPending = rootNodes.length === 0 || (!!targetNode && (isNodeLoading || !isSuccess));
  const noFileFirstTime = !targetNode && rootNodes.length > 0;

  return { isLoading: !isReady && !noFileFirstTime && isPending };
}
