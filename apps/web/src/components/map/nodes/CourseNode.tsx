import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { CourseNodeData } from '../mapDataToFlow';

const CATEGORY_STYLES: Record<string, { border: string; bg: string; dot: string }> = {
  Technical: {
    border: 'border-blue-600/60',
    bg: 'bg-blue-950/60',
    dot: 'bg-blue-400',
  },
  Soft: {
    border: 'border-green-600/60',
    bg: 'bg-green-950/60',
    dot: 'bg-green-400',
  },
  Tool: {
    border: 'border-orange-600/60',
    bg: 'bg-orange-950/60',
    dot: 'bg-orange-400',
  },
};

export function CourseNode({ data, selected }: NodeProps) {
  const { course, isShared } = data as unknown as CourseNodeData;
  const style = CATEGORY_STYLES[course.category] ?? CATEGORY_STYLES.Technical;

  return (
    <div
      className={`w-[260px] rounded-xl border-2 p-4 shadow-md transition-all ${style.border} ${style.bg} ${
        selected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-950' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !bg-gray-400" />
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !bg-gray-400" />

      {/* Header: category dot + badges */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
          <span className="text-[10px] uppercase tracking-wider text-gray-400">
            {course.category}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isShared && (
            <span className="rounded bg-yellow-900/50 px-1.5 py-0.5 text-[10px] text-yellow-300">
              Shared
            </span>
          )}
          <span className="rounded-full bg-purple-900/60 px-2 py-0.5 text-[10px] font-bold text-purple-300">
            L{course.sfiaLevel}
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="text-sm font-semibold leading-tight text-white">
        {course.title}
      </div>
      {course.titleTh && (
        <div className="mt-0.5 text-xs text-gray-500">{course.titleTh}</div>
      )}

      {/* Footer */}
      <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400">
        <span>{course.lessons.length} lessons</span>
        <span>&middot;</span>
        <span>{course.estimatedHours}h</span>
      </div>
    </div>
  );
}
