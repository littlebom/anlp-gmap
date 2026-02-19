'use client';

import { create } from 'zustand';
import { generatorApi } from '@/lib/api';

interface GeneratorJob {
  id: string;
  jobTitle: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PUBLISHED';
  currentStep: string | null;
  mapData: any;
  nodeCount: number | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface GeneratorState {
  jobs: GeneratorJob[];
  currentJob: GeneratorJob | null;
  isGenerating: boolean;
  error: string | null;

  generate: (jobTitle: string) => Promise<string>;
  pollJob: (id: string) => Promise<void>;
  loadJobs: () => Promise<void>;
  setCurrentJob: (job: GeneratorJob | null) => void;
  clearError: () => void;
}

export const useGeneratorStore = create<GeneratorState>((set, get) => ({
  jobs: [],
  currentJob: null,
  isGenerating: false,
  error: null,

  generate: async (jobTitle) => {
    set({ isGenerating: true, error: null });
    try {
      const res = await generatorApi.generate(jobTitle);
      const jobId = res.data.jobId;

      // Start polling
      get().pollJob(jobId);

      return jobId;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Generation failed',
        isGenerating: false,
      });
      throw err;
    }
  },

  pollJob: async (id) => {
    const poll = async () => {
      try {
        const res = await generatorApi.getJob(id);
        const job = res.data;
        set({ currentJob: job });

        if (job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'PUBLISHED') {
          set({ isGenerating: false });
          get().loadJobs(); // Refresh job list
          return;
        }

        // Continue polling every 2 seconds
        setTimeout(poll, 2000);
      } catch {
        set({ isGenerating: false });
      }
    };

    poll();
  },

  loadJobs: async () => {
    try {
      const res = await generatorApi.listJobs();
      set({ jobs: res.data.data });
    } catch {
      // Silently fail
    }
  },

  setCurrentJob: (job) => set({ currentJob: job }),
  clearError: () => set({ error: null }),
}));
