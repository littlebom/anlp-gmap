import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { RootNodeData } from '../mapDataToFlow';

export function RootNode({ data }: NodeProps) {
  const { label, courseCount, lessonCount } = data as unknown as RootNodeData;

  return (
    <div className="rounded-xl border-2 border-purple-500 bg-purple-950/80 px-6 py-4 text-center shadow-lg shadow-purple-500/20">
      <div className="text-lg font-bold capitalize text-white">{label}</div>
      <div className="mt-1 text-xs text-purple-300">
        {courseCount} courses &middot; {lessonCount} lessons
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !bg-purple-400"
      />
    </div>
  );
}
