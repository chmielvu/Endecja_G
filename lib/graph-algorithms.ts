import Graph from 'graphology';
import betweennessCentrality from 'graphology-metrics/centrality/betweenness';
import degreeCentrality from 'graphology-metrics/centrality/degree';
import closenessCentrality from 'graphology-metrics/centrality/closeness';
import eigenvectorCentrality from 'graphology-metrics/centrality/eigenvector';
import pagerank from 'graphology-metrics/centrality/pagerank';
import louvain from 'graphology-communities-louvain';
import { Node, Edge } from '../types';

// Helper to calculate local clustering coefficient manually as graphology-metrics 
// might need a specific version or separate import for it.
function calculateClusteringCoefficient(graph: Graph): Record<string, number> {
  const clustering: Record<string, number> = {};
  
  graph.forEachNode((node) => {
    const neighbors = graph.neighbors(node);
    const k = neighbors.length;
    
    if (k < 2) {
      clustering[node] = 0;
      return;
    }
    
    let links = 0;
    for (let i = 0; i < k; i++) {
      for (let j = i + 1; j < k; j++) {
        if (graph.hasEdge(neighbors[i], neighbors[j])) {
          links++;
        }
      }
    }
    
    clustering[node] = (2 * links) / (k * (k - 1));
  });
  
  return clustering;
}

export function computeGraphMetrics(nodes: Node[], edges: Edge[]): Node[] {
  const graph = new Graph({ type: 'undirected' });
  
  // Build graph
  nodes.forEach(n => {
    if (!graph.hasNode(n.id)) graph.addNode(n.id, { ...n });
  });
  
  edges.forEach(e => {
    // Handle cases where source/target might be objects (force-graph mutation) or strings
    const sourceId = typeof e.source === 'object' ? e.source.id : e.source;
    const targetId = typeof e.target === 'object' ? e.target.id : e.target;
    
    if (graph.hasNode(sourceId) && graph.hasNode(targetId) && !graph.hasEdge(sourceId, targetId)) {
      graph.addEdge(sourceId, targetId);
    }
  });

  // 1. Degree Centrality
  const degree = degreeCentrality(graph);

  // 2. Betweenness Centrality
  const betweenness = betweennessCentrality(graph);

  // 3. Closeness Centrality
  const closeness = closenessCentrality(graph);

  // 4. Eigenvector Centrality (Iterative)
  const eigenvector = eigenvectorCentrality(graph, { maxIterations: 1000, tolerance: 1e-6 });

  // 5. PageRank
  const pr = pagerank(graph, { alpha: 0.85 });

  // 6. Local Clustering Coefficient
  const clustering = calculateClusteringCoefficient(graph);

  // 7. Community Detection (Louvain)
  // We map community IDs to a simple integer
  const communities = louvain(graph);

  // Merge back into nodes
  return nodes.map(node => {
    const id = node.id;
    return {
      ...node,
      degreeCentrality: parseFloat(degree[id]?.toFixed(6) || '0'),
      betweenness: parseFloat(betweenness[id]?.toFixed(6) || '0'),
      closeness: parseFloat(closeness[id]?.toFixed(6) || '0'),
      eigenvector: parseFloat(eigenvector[id]?.toFixed(6) || '0'),
      pagerank: parseFloat(pr[id]?.toFixed(6) || '0'),
      clustering: parseFloat(clustering[id]?.toFixed(6) || '0'),
      community: communities[id] || 0
    };
  });
}
