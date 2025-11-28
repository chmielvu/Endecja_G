import React, { useRef, useMemo, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useStore } from '../lib/store';
import { Node } from '../types';

const GraphCanvas: React.FC = () => {
  const { nodes, edges, selectNode, isSidebarOpen } = useStore();
  const graphRef = useRef<any>();

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (graphRef.current) {
        graphRef.current.d3Force('charge').strength(-120);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Correctly map 'edges' to 'links' which react-force-graph expects.
  // We create shallow copies of the arrays and objects to avoid mutating the Zustand store state directly,
  // as react-force-graph adds internal properties (x, y, vx, vy) to the objects.
  const graphData = useMemo(() => ({
    nodes: nodes.map(n => ({ ...n })),
    links: edges.map(e => ({ ...e }))
  }), [nodes, edges]);

  // Color Scale Interpolation (Gold to Crimson)
  const getNodeColor = (node: Node) => {
    const t = Math.min(1, Math.max(0, (node.betweenness || 0) * 10)); // Normalize somewhat
    // Gold: #b45309 (180, 83, 9)
    // Crimson: #be123c (190, 18, 60)
    // Navy for Orgs: #1e3a8a
    
    if (node.type === 'organization') return '#1e3a8a';
    if (node.type === 'event') return '#ffffff';
    if (node.type === 'concept') return '#52525b'; // Zinc 600

    // Interpolate for people
    // Simple logic: High centrality = Crimson, Low = Gold
    return t > 0.5 ? '#be123c' : '#b45309';
  };

  return (
    <div className={`flex-1 relative h-full transition-all duration-300 ${isSidebarOpen ? 'mr-96' : ''}`}>
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel={(node: any) => `
${node.label}
---
Degree: ${node.degreeCentrality?.toFixed(4) || 0}
Betweenness: ${node.betweenness?.toFixed(4) || 0}
Closeness: ${node.closeness?.toFixed(4) || 0}
Eigenvector: ${node.eigenvector?.toFixed(4) || 0}
PageRank: ${node.pagerank?.toFixed(4) || 0}
Clustering: ${node.clustering?.toFixed(4) || 0}
Community: ${node.community || 0}
        `.trim()}
        nodeColor={(node: any) => getNodeColor(node)}
        // Size based on PageRank
        nodeVal={(node: any) => Math.max(2, (node.pagerank || 0.01) * 200)} 
        // Border width based on Clustering Coefficient
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const r = Math.sqrt(Math.max(0, (node.pagerank || 0.01) * 200)) * 4; // visual radius approx
          const x = node.x;
          const y = node.y;
          const color = getNodeColor(node);

          // Draw Border (Clustering)
          const clustering = node.clustering || 0;
          if (clustering > 0) {
            const borderWidth = clustering * 7;
            ctx.beginPath();
            ctx.arc(x, y, r + borderWidth, 0, 2 * Math.PI, false);
            ctx.lineWidth = borderWidth;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
          }

          // Draw Node
          ctx.beginPath();
          ctx.arc(x, y, r, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();

          // Draw Label if zoomed in or high importance
          if (globalScale > 1.2 || node.importance > 0.8) {
            const label = node.label;
            const fontSize = 12/globalScale;
            ctx.font = `${fontSize}px Spectral`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillText(label, x, y + r + fontSize);
          }
        }}
        linkColor={() => '#3f3f46'} // Zinc 700
        backgroundColor="#09090b"
        onNodeClick={(node: any) => {
          selectNode(node.id);
          graphRef.current?.centerAt(node.x, node.y, 1000);
          graphRef.current?.zoom(4, 2000);
        }}
        d3VelocityDecay={0.3}
        cooldownTicks={100}
      />
      
      {/* Legend Overlay */}
      <div className="absolute top-6 left-6 pointer-events-none bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10 text-xs font-mono space-y-2">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary"></div><span>Person (High Centrality)</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent"></div><span>Person (Low Centrality)</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-secondary"></div><span>Organization</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 border border-white rounded-full"></div><span>Thick Border = High Clustering</span></div>
      </div>
    </div>
  );
};

export default GraphCanvas;