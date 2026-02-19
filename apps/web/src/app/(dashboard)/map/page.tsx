'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { generatorApi } from '@/lib/api';
import type { Course, MapData } from '@/components/map/mapDataToFlow';
import type { GalaxyJobInput } from '@/components/galaxy/galaxyTypes';

const FlowMap = dynamic(
  () => import('@/components/map/FlowMap').then((m) => ({ default: m.FlowMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center rounded-xl border border-gray-800 bg-gray-950">
        <div className="text-gray-400">Loading map...</div>
      </div>
    ),
  },
);

const GalaxyView = dynamic(
  () =>
    import('@/components/galaxy/GalaxyView').then((m) => ({
      default: m.GalaxyView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-gray-400">Loading galaxy...</div>
      </div>
    ),
  },
);

interface JobSummary {
  id: string;
  jobTitle: string;
  status: string;
  nodeCount: number;
  createdAt: string;
  completedAt?: string;
  mapData?: MapData;
}

export default function MapPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get('jobId');

  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load completed jobs list
  const loadJobs = useCallback(async () => {
    try {
      const res = await generatorApi.listJobs(1, 50);
      const completed = (res.data.data ?? res.data).filter(
        (j: JobSummary) => j.status === 'COMPLETED',
      );
      setJobs(completed);
    } catch {
      // silent — jobs list is optional
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    if (jobId) loadMapData(jobId);
  }, [jobId]);

  const loadMapData = async (id: string) => {
    setIsLoading(true);
    setError(null);
    setSelectedCourse(null);
    try {
      const res = await generatorApi.getJob(id);
      if (res.data.status === 'COMPLETED' && res.data.mapData) {
        setMapData(res.data.mapData);
      } else {
        setError('Map data not available. Job may still be processing.');
      }
    } catch {
      setError('Failed to load map data');
    } finally {
      setIsLoading(false);
    }
  };

  const selectJob = (id: string) => {
    router.push(`/map?jobId=${id}`);
  };

  const goBack = () => {
    setMapData(null);
    setSelectedCourse(null);
    setError(null);
    router.push('/map');
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-gray-400">Loading map...</div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="text-red-400">{error}</div>
        <button onClick={goBack} className="text-sm text-blue-400 hover:text-blue-300">
          &larr; Back to all maps
        </button>
      </div>
    );
  }

  // ── Galaxy View (no jobId selected) ──
  if (!jobId || !mapData) {
    if (jobs.length === 0) {
      return (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-white">Learning Maps</h1>
          <div className="rounded-xl border border-dashed border-gray-700 p-12 text-center">
            <p className="text-gray-500">No completed maps yet.</p>
            <a
              href="/generate"
              className="mt-2 inline-block text-sm text-blue-400 hover:text-blue-300"
            >
              Generate your first learning map &rarr;
            </a>
          </div>
        </div>
      );
    }

    return (
      <GalaxyView
        jobs={jobs as unknown as GalaxyJobInput[]}
        onJobSelect={selectJob}
      />
    );
  }

  // ── Map graph view ──
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={goBack}
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            &larr; All Maps
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white capitalize">{mapData.jobTitle}</h1>
            <p className="text-sm text-gray-400">
              {mapData.courseCount} courses &middot; {mapData.lessonCount} lessons &middot;{' '}
              {mapData.dependencies?.length || 0} dependencies
            </p>
          </div>
        </div>
      </div>

      {/* React Flow Graph */}
      <FlowMap
        mapData={mapData}
        onCourseSelect={setSelectedCourse}
        selectedCourseTitle={selectedCourse?.title ?? null}
      />

      {/* Course Detail Side Panel */}
      {selectedCourse && (
        <div className="fixed inset-y-0 right-0 z-50 w-96 overflow-y-auto border-l border-gray-800 bg-gray-900 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{selectedCourse.title}</h2>
            <button
              onClick={() => setSelectedCourse(null)}
              className="text-gray-400 hover:text-white"
            >
              &times;
            </button>
          </div>
          {selectedCourse.titleTh && (
            <p className="text-sm text-gray-400">{selectedCourse.titleTh}</p>
          )}
          <p className="mt-2 text-sm text-gray-300">{selectedCourse.description}</p>

          <div className="mt-4 flex gap-2">
            <Badge text={selectedCourse.category} color="blue" />
            <Badge text={`Level ${selectedCourse.sfiaLevel}`} color="purple" />
            <Badge text={`${selectedCourse.estimatedHours}h`} color="gray" />
          </div>

          <h3 className="mt-6 mb-2 text-sm font-semibold text-gray-300">
            Lessons ({selectedCourse.lessons.length})
          </h3>
          <div className="space-y-2">
            {selectedCourse.lessons.map((lesson, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-800 bg-gray-800/50 p-3"
              >
                <div className="text-sm font-medium text-white">{lesson.title}</div>
                {lesson.titleTh && (
                  <div className="text-xs text-gray-500">{lesson.titleTh}</div>
                )}
                <div className="mt-1 text-xs text-gray-400">{lesson.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-900/50 text-blue-300',
    purple: 'bg-purple-900/50 text-purple-300',
    green: 'bg-green-900/50 text-green-300',
    orange: 'bg-orange-900/50 text-orange-300',
    gray: 'bg-gray-800 text-gray-300',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${colors[color] || colors.gray}`}>
      {text}
    </span>
  );
}
