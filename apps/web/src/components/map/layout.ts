import dagre from 'dagre';
import { type Node, type Edge } from '@xyflow/react';

const NODE_WIDTH = 280;
const NODE_HEIGHT = 120;
const ROOT_NODE_WIDTH = 200;
const ROOT_NODE_HEIGHT = 80;

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB',
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 60,
    ranksep: 100,
    marginx: 40,
    marginy: 40,
  });

  for (const node of nodes) {
    const isRoot = node.type === 'rootNode';
    g.setNode(node.id, {
      width: isRoot ? ROOT_NODE_WIDTH : NODE_WIDTH,
      height: isRoot ? ROOT_NODE_HEIGHT : NODE_HEIGHT,
    });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const dagreNode = g.node(node.id);
    const isRoot = node.type === 'rootNode';
    const width = isRoot ? ROOT_NODE_WIDTH : NODE_WIDTH;
    const height = isRoot ? ROOT_NODE_HEIGHT : NODE_HEIGHT;

    return {
      ...node,
      position: {
        x: dagreNode.x - width / 2,
        y: dagreNode.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
