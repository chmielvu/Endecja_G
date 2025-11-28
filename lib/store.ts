import { create } from 'zustand';
import { get, set as setIdb } from 'idb-keyval';
import { Node, Edge, ChatMessage, AppStatus } from '../types';
import { INITIAL_DATA } from '../constants';
import { computeGraphMetrics } from './graph-algorithms';
import { geminiService } from '../services/gemini-service';

interface StoreState {
  nodes: Node[];
  edges: Edge[];
  chatHistory: ChatMessage[];
  status: AppStatus;
  isSidebarOpen: boolean;
  selectedNodeId: string | null;
  uploadedText: string;

  // Actions
  init: () => Promise<void>;
  addMessage: (role: 'user' | 'model', content: string) => void;
  updateGraph: (newNodes: Node[], newEdges: Edge[]) => void;
  selectNode: (id: string | null) => void;
  setUploadedText: (text: string) => void;
  toggleSidebar: () => void;
  
  // Async Actions
  sendMessageToDmowski: (content: string) => Promise<void>;
  analyzeAndExpandGraph: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  nodes: [],
  edges: [],
  chatHistory: [],
  status: 'idle',
  isSidebarOpen: false,
  selectedNodeId: null,
  uploadedText: '',

  init: async () => {
    // Try to load from IndexedDB
    const savedNodes = await get('nodes');
    const savedEdges = await get('edges');
    const savedChat = await get('chatHistory');

    let initialNodes = savedNodes || INITIAL_DATA.nodes;
    let initialEdges = savedEdges || INITIAL_DATA.edges;

    // Compute initial metrics
    initialNodes = computeGraphMetrics(initialNodes, initialEdges);

    set({
      nodes: initialNodes,
      edges: initialEdges,
      chatHistory: savedChat || [
        { id: 'init', role: 'model', content: 'Witam. Jestem Roman Dmowski. Słucham Pana.', timestamp: Date.now() }
      ]
    });
  },

  addMessage: (role, content) => {
    set(state => {
      const newHistory = [
        ...state.chatHistory, 
        { id: Math.random().toString(36), role, content, timestamp: Date.now() }
      ];
      setIdb('chatHistory', newHistory); // Persist
      return { chatHistory: newHistory };
    });
  },

  updateGraph: (newNodes, newEdges) => {
    set(state => {
      // Safety check to prevent undefined errors
      const currentNodes = state.nodes || [];
      const safeNewNodes = Array.isArray(newNodes) ? newNodes : [];
      const safeNewEdges = Array.isArray(newEdges) ? newEdges : [];

      // Merge logic: avoid duplicates
      const nodeIds = new Set(currentNodes.map(n => n.id));
      // Ensure we don't try to access .id on null/undefined and prevent filter error
      const filteredNewNodes = safeNewNodes.filter(n => n && n.id && !nodeIds.has(n.id));
      
      const allNodes = [...currentNodes, ...filteredNewNodes];
      const allEdges = [...(state.edges || []), ...safeNewEdges]; 

      // Recompute metrics
      const computedNodes = computeGraphMetrics(allNodes, allEdges);

      // Persist
      setIdb('nodes', computedNodes);
      setIdb('edges', allEdges);

      return { nodes: computedNodes, edges: allEdges };
    });
  },

  selectNode: (id) => set({ selectedNodeId: id }),
  setUploadedText: (text) => set({ uploadedText: text }),
  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),

  sendMessageToDmowski: async (content) => {
    const store = get();
    store.addMessage('user', content);
    set({ status: 'chatting' });

    try {
      const response = await geminiService.chatWithDmowski(store.chatHistory, content);
      store.addMessage('model', response);
    } catch (error) {
      store.addMessage('model', "Przepraszam, ale chwilowo nie mogę odpowiedzieć (Błąd API).");
      console.error(error);
    } finally {
      set({ status: 'idle' });
    }
  },

  analyzeAndExpandGraph: async () => {
    const store = get();
    set({ status: 'analyzing' });

    try {
      const result = await geminiService.analyzeGraphAndExpand(
        store.nodes, 
        store.edges, 
        store.uploadedText
      );
      
      if (result.nodes && result.nodes.length > 0) {
        store.updateGraph(result.nodes, result.edges);
      }
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Analysis failed. check API Key.");
    } finally {
      set({ status: 'idle' });
    }
  }
}));