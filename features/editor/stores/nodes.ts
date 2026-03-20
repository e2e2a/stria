import { INode } from '@/types';
import { create } from 'zustand';

interface OperationMove {
  type: 'move';
  draggedId: string;
  fromParentId: string | null;
  toParentId: string | null;
}

interface OperationUpdate {
  type: 'update';
  nodeId: string;
  prev: Partial<INode>;
  next: Partial<INode>;
}
interface OperationCreate {
  type: 'create';
  node: INode;
}

interface OperationDelete {
  type: 'delete';
  node: INode;
  parentId: string | null;
}

type NodeOperation = OperationMove | OperationUpdate | OperationCreate | OperationDelete;

export function findNode(nodes: INode[], id: string): INode | null {
  for (const node of nodes) {
    if (node._id === id) return node;
    if (node.children?.length) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function removeNode(nodes: INode[], id: string): boolean {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node._id === id) {
      nodes.splice(i, 1);
      return true;
    }
    if (node.children?.length) {
      const removed = removeNode(node.children, id);
      if (removed) return true;
    }
  }
  return false;
}

function insertNode(nodes: INode[], nodeToInsert: INode, parentId: string | null) {
  if (parentId === null || parentId === 'root') {
    // insert at root
    nodes.push(nodeToInsert);
    return true;
  }

  for (const node of nodes) {
    if (node._id === parentId) {
      if (!node.children) node.children = [];
      node.children.push(nodeToInsert);
      return true;
    }
    if (node.children?.length) {
      const inserted = insertNode(node.children, nodeToInsert, parentId);
      if (inserted) return true;
    }
  }
  return false;
}

function getSiblings(nodes: INode[], parentId: string | null): INode[] {
  if (parentId === null) return nodes; // root level

  const parent = findNode(nodes, parentId);
  return parent?.children ?? [];
}

interface NodesState {
  pendingScrollHeading: string;
  setPendingScrollHeading(heading: string): void;

  activeDrag: INode | null;
  activeNode: INode | null;
  selectedNode: INode | null;

  nodes: INode[] | null;
  previousOperations: NodeOperation[];

  updateNode: (nodeId: string, changes: Partial<INode>) => void;

  isCreating: { type: 'file' | 'folder'; parentId: string | null } | null;
  isUpdatingNode: INode | null;

  /** UI flags */
  collapseAll: boolean;
  collapseVersion: number;

  setIsCreating(node: { type: 'file' | 'folder'; parentId: string | null } | null): void;
  setIsUpdatingNode(flag: INode | null): void;
  setCollapseAll(flag: boolean): void;

  setActiveDrag(node: INode | null): void;
  setSelectedNode(node: INode | null): void;
  setActiveNode(nodeId: string | null): void;

  setNodes(nodes: INode[] | null): void;

  createNodeWithUndo(node: INode): void;
  deleteNodeWithUndo: (nodeId: string) => void;

  moveNode(dragId: string, targetId: string): void;

  undo(): NodeOperation | null;
  /** Utility to reset editor state */

  clearHistory(): void;
  resetEditor(): void;
}

export const useNodeStore = create<NodesState>(set => ({
  // Add to your store definition
  pendingScrollHeading: '',
  setPendingScrollHeading: (heading: string) => set({ pendingScrollHeading: heading }),

  nodes: null,
  previousOperations: [],
  activeNode: null,
  activeDrag: null,
  selectedNode: null,
  updateNode: (nodeId: string, changes: Partial<INode>) => {
    set(state => {
      if (!state.nodes) return state;
      const nodes = structuredClone(state.nodes);

      // const node = nodes.find(n => n._id === nodeId);
      // if (!node) return state;
      const node = findNode(nodes, nodeId);
      if (!node) return state;

      const siblings = getSiblings(nodes, node.parentId);

      const siblingConflict = siblings.find(
        n => n.parentId === node.parentId && n.type === node.type && n.title?.toLowerCase() === changes.title?.toLowerCase()
      );

      if (siblingConflict) throw new Error(`A ${node.type} named "${changes.title}" already exists`);

      const prev = { ...node };
      Object.assign(node, changes);
      // to update left sidebar content
      const activeNode = state.activeNode?._id === nodeId ? { ...state.activeNode, ...changes } : state.activeNode;
      const selectedNode = state.selectedNode?._id === nodeId ? { ...state.selectedNode, ...changes } : state.selectedNode;
      return {
        nodes,
        selectedNode,
        previousOperations: [...state.previousOperations, { type: 'update', nodeId, prev, next: changes }],
        activeNode,
      };
    });
  },
  isCreating: null,
  isUpdatingNode: null,
  collapseAll: false,
  collapseVersion: 0,

  setSelectedNode: node => set({ selectedNode: node }),
  // setActiveNode: node => set({ activeNode: node }),
  setActiveNode: nodeId => {
    set(state => {
      if (!nodeId) return { activeNode: null };
      if (!state.nodes) return state;

      // Reuse your existing recursive findNode function
      const node = findNode(state.nodes, nodeId);
      return { activeNode: node };
    });
  },
  setActiveDrag: node => set({ activeDrag: node }),

  setIsCreating: flag => set({ isCreating: flag }),
  setIsUpdatingNode: flag => set({ isUpdatingNode: flag }),

  setNodes: nodes => set({ nodes }),

  setCollapseAll: () => {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith('sidebar-folder-open')) {
        localStorage.removeItem(key);
        // localStorage.setItem(key, 'false');
      }
    }

    set(state => ({ collapseVersion: state.collapseVersion + 1 }));
  },

  createNodeWithUndo: (node: INode) => {
    set(state => {
      if (!state.nodes) state.nodes = [];
      const nodes = structuredClone(state.nodes);
      insertNode(nodes, node, node.parentId);

      return {
        nodes,
        previousOperations: [...state.previousOperations, { type: 'create', node }],
      };
    });
  },

  deleteNodeWithUndo: (nodeId: string) => {
    set(state => {
      if (!state.nodes) return state;
      const nodes = structuredClone(state.nodes);

      const nodeToDelete = findNode(nodes, nodeId);
      if (!nodeToDelete) return state;

      const parentId = nodeToDelete.parentId;
      removeNode(nodes, nodeId);

      return {
        nodes,
        previousOperations: [...state.previousOperations, { type: 'delete', node: nodeToDelete, parentId }],
      };
    });
  },

  moveNode: (draggedId: string, targetId: string) => {
    set(state => {
      if (!state.nodes) return state;

      // deep clone → safe sandbox
      const nodes = structuredClone(state.nodes);

      const dragged = findNode(nodes, draggedId);
      if (!dragged) return state;

      const fromParentId = dragged.parentId;
      const newParentId = targetId === 'root' ? null : targetId;

      if (fromParentId === newParentId) return state;

      const siblings = getSiblings(nodes, newParentId);

      const siblingConflict = siblings.find(
        n => n._id !== draggedId && n.type === dragged.type && n.title?.toLowerCase() === dragged.title?.toLowerCase()
      );

      if (siblingConflict) throw new Error(`Cannot move: ${dragged.type} named "${dragged.title}" already exists.`);

      removeNode(nodes, draggedId);

      const movedNode: INode = {
        ...dragged,
        parentId: newParentId,
      };

      insertNode(nodes, movedNode, newParentId);

      // 3️⃣ PUSH UNDO OP (order matters)
      return {
        nodes,
        previousOperations: [
          ...state.previousOperations,
          {
            type: 'move',
            draggedId,
            fromParentId,
            toParentId: newParentId,
          },
        ],
      };
    });
  },

  undo: () => {
    let undone: NodeOperation | null = null;
    let error: string | null = null;

    set(state => {
      if (!state.nodes || state.previousOperations.length === 0) return state;

      const operations = [...state.previousOperations];
      const op = operations.pop()!;
      undone = op;

      const nodes = structuredClone(state.nodes);

      // ================= MOVE UNDO =================
      if (op.type === 'move') {
        const dragged = findNode(nodes, op.draggedId);
        if (!dragged) {
          error = 'Cannot undo: node missing';
          return state;
        }

        const targetParentId = op.fromParentId;

        // parent must exist (or root)
        if (targetParentId !== null && !findNode(nodes, targetParentId)) {
          error = 'Cannot undo: original parent missing';
          return state;
        }

        const siblings = getSiblings(nodes, targetParentId);
        const conflict = siblings.find(n => n._id !== dragged._id && n.type === dragged.type && n.title?.toLowerCase() === dragged.title?.toLowerCase());

        if (conflict) {
          error = 'Cannot undo: title conflict';
          return state;
        }

        removeNode(nodes, dragged._id);
        insertNode(nodes, { ...dragged, parentId: targetParentId }, targetParentId);
      }

      // ================= UPDATE UNDO =================
      if (op.type === 'update') {
        const node = findNode(nodes, op.nodeId);
        if (!node) {
          error = 'Cannot undo update: node missing';
          return state;
        }

        const prev = op.prev;
        const rollbackParentId = prev.parentId ?? node.parentId;
        const rollbackTitle = prev.title ?? node.title;
        const rollbackType = prev.type ?? node.type;

        const siblings = getSiblings(nodes, rollbackParentId);
        const conflict = siblings.find(n => n._id !== node._id && n.type === rollbackType && n.title?.toLowerCase() === rollbackTitle?.toLowerCase());

        if (conflict) {
          error = 'Cannot undo update: title conflict';
          return state;
        }

        Object.assign(node, prev);
      }

      // ================= CREATE UNDO =================
      if (op.type === 'create') {
        const createdNodeId = op.node._id;
        const removed = removeNode(nodes, createdNodeId);

        if (!removed) {
          error = 'Cannot undo create: node missing';
          return state;
        }
      }

      // ================= DELETE UNDO =================
      if (op.type === 'delete') {
        const nodeToRestore = op.node;
        const targetParentId = op.parentId;

        // 1. Structural Integrity: Verify parent still exists if not root
        if (targetParentId !== null && !findNode(nodes, targetParentId)) {
          error = 'Cannot undo delete: original parent folder no longer exists';
          return state;
        }

        // 2. Collision Detection: Get siblings at the target level
        // Your getSiblings helper handles parentId === null correctly by returning root nodes
        const siblings = getSiblings(nodes, targetParentId);

        const nameConflict = siblings.find(n => n.type === nodeToRestore.type && n.title?.toLowerCase() === nodeToRestore.title?.toLowerCase());

        if (nameConflict) {
          error = `Cannot undo: a ${nodeToRestore.type} named "${nodeToRestore.title}" already exists in that location`;
          return state;
        }

        if (findNode(nodes, nodeToRestore._id)) {
          error = 'Cannot undo: a node with this internal ID already exists';
          return state;
        }

        // 4. Perform Restoration
        insertNode(nodes, nodeToRestore, targetParentId);
      }

      return { nodes, previousOperations: operations };
    });

    if (error) {
      throw new Error(error);
    }

    return undone;
  },

  clearHistory: () => set({ previousOperations: [] }),

  resetEditor: () => set({ activeNode: null, activeDrag: null, isCreating: null, isUpdatingNode: null }),
}));
