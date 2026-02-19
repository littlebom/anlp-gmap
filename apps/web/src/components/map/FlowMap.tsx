'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { RootNode } from './nodes/RootNode';
import { CourseNode } from './nodes/CourseNode';
import { mapDataToFlow, type MapData, type Course, type CourseNodeData } from './mapDataToFlow';
import { getLayoutedElements } from './layout';

const nodeTypes = {
  rootNode: RootNode,
  courseNode: CourseNode,
};

interface FlowMapProps {
  mapData: MapData;
  onCourseSelect: (course: Course | null) => void;
  selectedCourseTitle: string | null;
}

export function FlowMap({ mapData, onCourseSelect, selectedCourseTitle }: FlowMapProps) {
  const { initialNodes, initialEdges } = useMemo(() => {
    const { nodes: rawNodes, edges: rawEdges } = mapDataToFlow(mapData);
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      rawNodes,
      rawEdges,
      'TB',
    );
    return { initialNodes: layoutedNodes, initialEdges: layoutedEdges };
  }, [mapData]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type === 'courseNode') {
        const courseData = node.data as unknown as CourseNodeData;
        if (selectedCourseTitle === courseData.course.title) {
          onCourseSelect(null);
        } else {
          onCourseSelect(courseData.course);
        }
      }
    },
    [onCourseSelect, selectedCourseTitle],
  );

  const onPaneClick = useCallback(() => {
    onCourseSelect(null);
  }, [onCourseSelect]);

  return (
    <div className="h-[calc(100vh-10rem)] w-full rounded-xl border border-gray-800 bg-gray-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#374151"
        />
        <Controls
          className="!rounded-lg !border-gray-700 !bg-gray-800 [&>button]:!border-gray-700 [&>button]:!bg-gray-800 [&>button]:!text-gray-300 [&>button:hover]:!bg-gray-700"
        />
        <MiniMap
          nodeStrokeColor="#6B7280"
          nodeColor={(node) => {
            if (node.type === 'rootNode') return '#7C3AED';
            const d = node.data as unknown as CourseNodeData | undefined;
            const cat = d?.course?.category;
            if (cat === 'Technical') return '#3B82F6';
            if (cat === 'Soft') return '#22C55E';
            if (cat === 'Tool') return '#F97316';
            return '#6B7280';
          }}
          maskColor="rgba(0, 0, 0, 0.7)"
          className="!rounded-lg !border-gray-700 !bg-gray-900"
        />
      </ReactFlow>
    </div>
  );
}
