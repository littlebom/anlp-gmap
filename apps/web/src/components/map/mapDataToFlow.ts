import { type Node, type Edge } from '@xyflow/react';

export interface Course {
  title: string;
  titleTh?: string;
  description: string;
  category: string;
  sfiaLevel: number;
  estimatedHours: number;
  shareable?: boolean;
  lessons: Array<{
    title: string;
    titleTh?: string;
    description: string;
    skills?: string[];
  }>;
}

export interface MapData {
  jobTitle: string;
  courses: Course[];
  dependencies: Array<{ prerequisite: string; dependent: string }>;
  sharedCourses: string[];
  courseCount: number;
  lessonCount: number;
}

export interface RootNodeData {
  label: string;
  courseCount: number;
  lessonCount: number;
  [key: string]: unknown;
}

export interface CourseNodeData {
  course: Course;
  isShared: boolean;
  [key: string]: unknown;
}

const titleToId = (title: string) =>
  `course-${title.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`;

export function mapDataToFlow(mapData: MapData): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const rootId = 'root';

  // Root node
  nodes.push({
    id: rootId,
    type: 'rootNode',
    position: { x: 0, y: 0 },
    data: {
      label: mapData.jobTitle,
      courseCount: mapData.courseCount,
      lessonCount: mapData.lessonCount,
    } as RootNodeData,
  });

  // Courses that have a prerequisite (they are "dependent" in at least one dependency)
  const coursesWithPrerequisites = new Set(
    (mapData.dependencies ?? []).map((d) => d.dependent),
  );

  // Course nodes
  for (const course of mapData.courses) {
    const nodeId = titleToId(course.title);
    const isShared = mapData.sharedCourses?.includes(course.title) ?? false;

    nodes.push({
      id: nodeId,
      type: 'courseNode',
      position: { x: 0, y: 0 },
      data: {
        course,
        isShared,
      } as CourseNodeData,
    });

    // Only connect root to entry-point courses (no prerequisite)
    if (!coursesWithPrerequisites.has(course.title)) {
      edges.push({
        id: `root-to-${nodeId}`,
        source: rootId,
        target: nodeId,
        type: 'smoothstep',
        style: { stroke: '#4B5563', strokeWidth: 1.5 },
        animated: false,
      });
    }
  }

  // Dependency edges
  for (const dep of mapData.dependencies ?? []) {
    const sourceId = titleToId(dep.prerequisite);
    const targetId = titleToId(dep.dependent);
    edges.push({
      id: `dep-${sourceId}-to-${targetId}`,
      source: sourceId,
      target: targetId,
      type: 'smoothstep',
      style: { stroke: '#3B82F6', strokeWidth: 2 },
      animated: true,
    });
  }

  return { nodes, edges };
}
