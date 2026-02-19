'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGeneratorStore } from '@/stores/generator-store';

const PIPELINE_STEPS = [
  { key: 'RESEARCH', label: 'Research', desc: 'Gathering skills from ESCO, O*NET, Lightcast' },
  { key: 'NORMALIZE', label: 'Normalize', desc: 'AI merging and standardizing skills' },
  { key: 'CLUSTER', label: 'Cluster', desc: 'AI grouping skills into courses' },
  { key: 'GRADE', label: 'Grade', desc: 'Assigning SFIA difficulty levels' },
  { key: 'MAP_DEPENDENCIES', label: 'Dependencies', desc: 'Creating learning path order' },
  { key: 'VALIDATE', label: 'Validate', desc: 'Checking for cycles and validation' },
];

export default function GeneratePage() {
  const router = useRouter();
  const { generate, currentJob, isGenerating, jobs, loadJobs, error, clearError } =
    useGeneratorStore();
  const [jobTitle, setJobTitle] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) return;
    try {
      await generate(jobTitle.trim());
    } catch {
      // Error handled in store
    }
  };

  const getCurrentStepIndex = () => {
    if (!currentJob?.currentStep) return -1;
    return PIPELINE_STEPS.findIndex((s) => s.key === currentJob.currentStep);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Generate Learning Map</h1>
        <p className="mt-1 text-sm text-gray-400">
          Enter a job title and AI will create a structured learning map with courses and lessons
        </p>
      </div>

      {/* Generate Form */}
      <form onSubmit={handleGenerate} className="flex gap-3">
        <input
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="e.g. Data Scientist, Frontend Developer, DevOps Engineer"
          className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          disabled={isGenerating}
        />
        <button
          type="submit"
          disabled={isGenerating || !jobTitle.trim()}
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
      </form>

      {error && (
        <div className="rounded-lg bg-red-900/50 p-4 text-sm text-red-300">
          {error}
          <button onClick={clearError} className="ml-2 text-red-400 hover:text-red-200">
            Dismiss
          </button>
        </div>
      )}

      {/* Pipeline Progress */}
      {currentJob && currentJob.status === 'PROCESSING' && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Generating: {currentJob.jobTitle}
          </h2>
          <div className="space-y-3">
            {PIPELINE_STEPS.map((step, i) => {
              const currentIdx = getCurrentStepIndex();
              const isComplete = i < currentIdx;
              const isCurrent = i === currentIdx;
              const isPending = i > currentIdx;

              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      isComplete
                        ? 'bg-green-600 text-white'
                        : isCurrent
                          ? 'animate-pulse bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-500'
                    }`}
                  >
                    {isComplete ? '\u2713' : i + 1}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${isCurrent ? 'text-blue-400' : isPending ? 'text-gray-500' : 'text-green-400'}`}>
                      {step.label}
                    </div>
                    <div className="text-xs text-gray-500">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Result */}
      {currentJob && currentJob.status === 'COMPLETED' && currentJob.mapData && (
        <div className="rounded-xl border border-green-800/50 bg-green-900/20 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-green-400">
              Generation Complete: {currentJob.jobTitle}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/map?jobId=${currentJob.id}`)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                View Map
              </button>
              <button
                onClick={() => router.push(`/curator?jobId=${currentJob.id}`)}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
              >
                Edit in Curator
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Stat label="Courses" value={currentJob.mapData.courseCount} />
            <Stat label="Lessons" value={currentJob.mapData.lessonCount} />
            <Stat label="Skills (raw)" value={currentJob.mapData.rawSkillCount} />
            <Stat label="Dependencies" value={currentJob.mapData.dependencies?.length ?? 0} />
          </div>
        </div>
      )}

      {/* Failed */}
      {currentJob && currentJob.status === 'FAILED' && (
        <div className="rounded-xl border border-red-800/50 bg-red-900/20 p-6">
          <h2 className="text-lg font-semibold text-red-400">Generation Failed</h2>
          <p className="mt-2 text-sm text-red-300">{currentJob.error}</p>
        </div>
      )}

      {/* Job History */}
      {jobs.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-white">Generation History</h2>
          <div className="space-y-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 p-4"
              >
                <div>
                  <div className="font-medium text-white">{job.jobTitle}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(job.createdAt).toLocaleString('th-TH')}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={job.status} />
                  {(job.status === 'COMPLETED' || job.status === 'PUBLISHED') && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/map?jobId=${job.id}`)}
                        className="rounded bg-gray-700 px-3 py-1 text-xs text-gray-300 hover:bg-gray-600"
                      >
                        View
                      </button>
                      {job.status !== 'PUBLISHED' && (
                        <button
                          onClick={() => router.push(`/curator?jobId=${job.id}`)}
                          className="rounded bg-gray-700 px-3 py-1 text-xs text-gray-300 hover:bg-gray-600"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-gray-800/50 p-3 text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-900/50 text-yellow-300',
    PROCESSING: 'bg-blue-900/50 text-blue-300',
    COMPLETED: 'bg-green-900/50 text-green-300',
    FAILED: 'bg-red-900/50 text-red-300',
    PUBLISHED: 'bg-purple-900/50 text-purple-300',
  };

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${colors[status] || 'bg-gray-800 text-gray-400'}`}>
      {status}
    </span>
  );
}
