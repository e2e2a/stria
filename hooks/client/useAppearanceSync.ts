import { useEffect, useRef, useState } from 'react';
import { useEditorSettings } from '@/features/editor/stores/setting';
import { useNodeMutations } from '@/hooks/node/useNodeMutations';
import { useNodeByIdQuery } from '../node/useNodeQuery';
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
  return (res && 'data' in res ? res.data : res) as INode | null;
};

interface UseSettingsSyncProps {
  projectId: string;
  nData: { nodes: INode[] } | undefined | null;
}

export function useSettingsSync({ projectId, nData }: UseSettingsSyncProps) {
  const fileName = 'appearance.json';

  const settingsStore = useEditorSettings();
  const mutation = useNodeMutations();

  const hasInitializedRef = useRef(false);
  const lastSavedContentRef = useRef<string | null>(null);
  const mutationRef = useRef(mutation);
  const rootNodesRef = useRef<INode[]>([]);

  mutationRef.current = mutation;

  const rootNodes: INode[] = Array.isArray(nData?.nodes) ? nData.nodes : Object.values(nData?.nodes ?? {});
  rootNodesRef.current = rootNodes;

  const rootFolder = findChild(rootNodes, '.mondreymd', 'folder');
  const optionsFolder = findChild(rootFolder?.children, 'options', 'folder');
  const settingsNode = findChild(optionsFolder?.children, fileName, 'file');

  const queryId = settingsNode?._id ?? '';
  const { data: fetchedNode, isSuccess, isLoading: isNodeLoading } = useNodeByIdQuery(queryId);

  const [isSettingsReady, setIsSettingsReady] = useState(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (rootNodes.length === 0) return;

    if (settingsNode && (!isSuccess || !fetchedNode)) return;

    if (fetchedNode?.content) {
      try {
        settingsStore.initSettings(JSON.parse(fetchedNode.content) as Parameters<typeof settingsStore.initSettings>[0]);
        lastSavedContentRef.current = fetchedNode.content;
      } catch (e) {
        console.error(`Failed to parse ${fileName}:`, e);
      }
    }

    hasInitializedRef.current = true;
    setIsSettingsReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootNodes.length, settingsNode, fetchedNode, isSuccess]);

  const currentSettings = {
    theme: settingsStore.theme,
    accentColor: settingsStore.accentColor,
    inlineTitle: settingsStore.inlineTitle,
    tabTitleBar: settingsStore.tabTitleBar,
  };

  const jsonString = JSON.stringify(currentSettings, null, 2);

  useEffect(() => {
    if (!hasInitializedRef.current) return;
    if (lastSavedContentRef.current === jsonString) return;

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

        mut.update.mutate({ _id: guaranteedFile._id, pid: projectId, content: jsonString });
        lastSavedContentRef.current = jsonString;
      } catch (e) {
        console.error(`Sync Error for ${fileName}:`, e);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [jsonString, projectId]);

  const isPending = rootNodes.length === 0 || (!!settingsNode && (isNodeLoading || !isSuccess));
  const noFileFirstTime = !settingsNode && rootNodes.length > 0;

  return { isSettingsLoading: !isSettingsReady && !noFileFirstTime && isPending };
}
