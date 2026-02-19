export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface IGenerationJob {
  id: string;
  jobTitle: string;
  status: JobStatus;
  currentStep?: PipelineStep;
  mapData?: unknown;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export type PipelineStep =
  | 'RESEARCH'
  | 'NORMALIZE'
  | 'CLUSTER'
  | 'GRADE'
  | 'MAP_DEPENDENCIES'
  | 'VALIDATE';

export interface INormalizedSkill {
  label: string;
  description: string;
  category: 'TECHNICAL' | 'SOFT' | 'TOOL';
}

export interface IRawSkillData {
  source: 'ESCO' | 'ONET' | 'LIGHTCAST';
  skills: string[];
}
