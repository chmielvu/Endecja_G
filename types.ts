export interface Node {
  id: string;
  label: string;
  type: 'person' | 'organization' | 'event' | 'concept' | 'publication';
  dates?: string;
  description?: string;
  importance: number;
  
  // Computed metrics
  degreeCentrality?: number;
  betweenness?: number;
  closeness?: number;
  eigenvector?: number;
  pagerank?: number;
  clustering?: number;
  community?: number;
  
  // Force graph props
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface Edge {
  source: string | Node; // ForceGraph can mutate this to object
  target: string | Node;
  label?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export type AppStatus = 'idle' | 'analyzing' | 'chatting' | 'updating';
