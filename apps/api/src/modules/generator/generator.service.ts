import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma.service';
import { EscoApiService } from '../esco/esco-api.service';
import { OnetService } from '../onet/onet.service';
import { LightcastService } from '../lightcast/lightcast.service';
import {
  AIProviderFactory,
  IAIProvider,
  AIProviderName,
  buildNormalizationPrompt,
  buildClusteringPrompt,
  buildGradingPrompt,
  buildDependencyPrompt,
} from '@anlp/ai-provider';
import { SettingsService } from '../settings/settings.service';
import { z } from 'zod';

// Zod schemas for AI response validation
const NormalizationSchema = z.object({
  skills: z.array(z.object({
    label: z.string(),
    description: z.string(),
    category: z.enum(['Technical', 'Soft', 'Tool']),
    source: z.string().optional(),
  })),
});

const ClusteringSchema = z.object({
  courses: z.array(z.object({
    title: z.string(),
    titleTh: z.string().optional().default(''),
    description: z.string(),
    category: z.enum(['Technical', 'Soft', 'Tool']),
    shareable: z.boolean().optional().default(false),
    lessons: z.array(z.object({
      title: z.string(),
      titleTh: z.string().optional().default(''),
      description: z.string(),
      skills: z.array(z.string()).optional().default([]),
    })),
  })),
});

const GradingSchema = z.object({
  gradedCourses: z.array(z.object({
    title: z.string(),
    sfiaLevel: z.number().min(1).max(7),
    estimatedHours: z.number().optional().default(10),
  })),
});

const DependencySchema = z.object({
  dependencies: z.array(z.object({
    prerequisite: z.string(),
    dependent: z.string(),
  })),
});

type PipelineStep = 'RESEARCH' | 'NORMALIZE' | 'CLUSTER' | 'GRADE' | 'MAP_DEPENDENCIES' | 'VALIDATE';

@Injectable()
export class GeneratorService {
  private readonly logger = new Logger(GeneratorService.name);
  private aiProvider: IAIProvider;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly escoApiService: EscoApiService,
    private readonly onetService: OnetService,
    private readonly lightcastService: LightcastService,
    private readonly settingsService: SettingsService,
  ) {
    // Initial load from .env (will be refreshed before each job)
    const providerName = this.configService.get<AIProviderName>('AI_PROVIDER', 'gemini');
    const keyMap: Record<string, string> = {
      gemini: 'API_KEY_GEMINI',
      openai: 'API_KEY_OPENAI',
      claude: 'API_KEY_CLAUDE',
      ollama: 'OLLAMA_BASE_URL',
    };
    const apiKey = this.configService.get<string>(keyMap[providerName] || '', '');

    this.aiProvider = AIProviderFactory.create(providerName, {
      apiKey: apiKey || 'http://localhost:11434',
      model: providerName === 'ollama'
        ? this.configService.get<string>('OLLAMA_MODEL', 'llama3.1')
        : undefined,
    });
    this.logger.log(`Generator using AI provider: ${providerName}`);
  }

  /**
   * Refresh AI provider from DB settings (hot-reload)
   */
  async refreshAiProvider(): Promise<void> {
    const providerName = (await this.settingsService.get('AI_PROVIDER')) as AIProviderName || 'gemini';
    const keyMap: Record<string, string> = {
      gemini: 'API_KEY_GEMINI',
      openai: 'API_KEY_OPENAI',
      claude: 'API_KEY_CLAUDE',
      ollama: 'OLLAMA_BASE_URL',
    };
    const apiKey = await this.settingsService.get(keyMap[providerName] || '');

    this.aiProvider = AIProviderFactory.create(providerName, {
      apiKey: apiKey || 'http://localhost:11434',
      model: providerName === 'ollama'
        ? (await this.settingsService.get('OLLAMA_MODEL')) || 'llama3.1'
        : undefined,
    });
    this.logger.log(`AI provider refreshed: ${providerName}`);
  }

  async createGenerationJob(jobTitle: string): Promise<string> {
    const record = await this.prisma.generatedMap.create({
      data: {
        jobTitle,
        status: 'PENDING',
        currentStep: 'RESEARCH',
      },
    });

    // Start processing async (fire and forget)
    this.processJob(record.id, jobTitle).catch((error) => {
      this.logger.error(`Job ${record.id} failed:`, error);
    });

    return record.id;
  }

  async getJobStatus(id: string): Promise<any> {
    const job = await this.prisma.generatedMap.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async getAllJobs(page = 1, limit = 20): Promise<any> {
    const [jobs, total] = await Promise.all([
      this.prisma.generatedMap.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.generatedMap.count(),
    ]);

    return {
      data: jobs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async curatorEdit(id: string, courses: any[], dependencies?: any[]) {
    const job = await this.prisma.generatedMap.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== 'COMPLETED') {
      throw new Error('Can only edit completed jobs');
    }

    const existingData = job.mapData as any;
    if (!existingData) throw new Error('No map data found');

    // Update courses in the map data
    existingData.courses = courses;
    if (dependencies) {
      existingData.dependencies = dependencies;
    }

    // Detect shared courses
    existingData.sharedCourses = this.detectSharedCourses(courses);
    existingData.courseCount = courses.length;
    existingData.lessonCount = courses.reduce(
      (sum: number, c: any) => sum + (c.lessons?.length || 0),
      0,
    );

    await this.prisma.generatedMap.update({
      where: { id },
      data: {
        mapData: existingData,
        nodeCount: existingData.courseCount,
      },
    });

    return existingData;
  }

  async publishMap(
    id: string,
    jobGroupId?: string,
  ): Promise<{ jobId: string; courseCount: number; lessonCount: number }> {
    // 1. Load and validate
    const genMap = await this.prisma.generatedMap.findUnique({ where: { id } });
    if (!genMap) throw new NotFoundException('Generated map not found');
    if (genMap.status !== 'COMPLETED') {
      throw new BadRequestException('Can only publish completed maps');
    }
    if (genMap.publishedJobId) {
      throw new ConflictException('This map has already been published');
    }

    const mapData = genMap.mapData as any;
    if (!mapData?.courses?.length) {
      throw new BadRequestException('Map has no courses to publish');
    }

    // 2. Resolve JobGroup
    let resolvedJobGroupId: string;
    if (jobGroupId) {
      const group = await this.prisma.jobGroup.findUnique({ where: { id: jobGroupId } });
      if (!group) throw new NotFoundException('Job group not found');
      resolvedJobGroupId = group.id;
    } else {
      const defaultGroup = await this.prisma.jobGroup.upsert({
        where: { id: 'jg-ai-generated' },
        update: {},
        create: {
          id: 'jg-ai-generated',
          name: 'AI Generated',
          nameTh: 'สร้างโดย AI',
          description: 'Job roles generated by the AI pipeline',
          icon: 'sparkles',
          color: '#8B5CF6',
        },
      });
      resolvedJobGroupId = defaultGroup.id;
    }

    // 3. Execute in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create Job
      const job = await tx.job.create({
        data: {
          title: mapData.jobTitle,
          jobGroupId: resolvedJobGroupId,
          source: 'AI',
        },
      });

      const courseTitleToId = new Map<string, string>();
      const sharedCourseTitles = new Set<string>(mapData.sharedCourses || []);
      let totalLessons = 0;

      // Create Courses + Lessons
      for (let ci = 0; ci < mapData.courses.length; ci++) {
        const courseData = mapData.courses[ci];

        const categoryMap: Record<string, string> = {
          technical: 'TECHNICAL',
          soft: 'SOFT',
          tool: 'TOOL',
        };
        const category = categoryMap[courseData.category?.toLowerCase()] || 'TECHNICAL';

        const course = await tx.course.create({
          data: {
            title: courseData.title,
            titleTh: courseData.titleTh || null,
            description: courseData.description || null,
            category: category as any,
            sfiaLevel: courseData.sfiaLevel || null,
            estimatedHours: courseData.estimatedHours || null,
            isShared: sharedCourseTitles.has(courseData.title),
            status: 'DRAFT',
            sortOrder: ci,
          },
        });

        courseTitleToId.set(courseData.title, course.id);

        // Link course to job
        await tx.jobCourse.create({
          data: {
            jobId: job.id,
            courseId: course.id,
            relationType: 'CORE',
            sortOrder: ci,
          },
        });

        // Create lessons
        const lessons = courseData.lessons || [];
        for (let li = 0; li < lessons.length; li++) {
          await tx.lesson.create({
            data: {
              title: lessons[li].title,
              titleTh: lessons[li].titleTh || null,
              description: lessons[li].description || null,
              courseId: course.id,
              contentType: 'TEXT',
              sortOrder: li,
            },
          });
          totalLessons++;
        }
      }

      // Create CourseDependencies
      const dependencies = mapData.dependencies || [];
      for (const dep of dependencies) {
        const prereqId = courseTitleToId.get(dep.prerequisite);
        const depId = courseTitleToId.get(dep.dependent);
        if (prereqId && depId && prereqId !== depId) {
          await tx.courseDependency.create({
            data: {
              prerequisiteCourseId: prereqId,
              dependentCourseId: depId,
            },
          });
        }
      }

      // Update GeneratedMap
      await tx.generatedMap.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishedJobId: job.id,
          publishedAt: new Date(),
        },
      });

      return {
        jobId: job.id,
        courseCount: mapData.courses.length,
        lessonCount: totalLessons,
      };
    });

    this.logger.log(
      `[${id}] Published as Job ${result.jobId}: ${result.courseCount} courses, ${result.lessonCount} lessons`,
    );
    return result;
  }

  // ==========================================
  // Pipeline Execution
  // ==========================================

  private async processJob(jobId: string, jobTitle: string): Promise<void> {
    try {
      // Hot-reload AI provider from DB settings before each job
      await this.refreshAiProvider();

      await this.updateStep(jobId, 'PROCESSING', 'RESEARCH');

      // Step 1: Research — Gather skills from external APIs
      this.logger.log(`[${jobId}] Step 1: Research`);
      const rawSkills = await this.stepResearch(jobTitle);
      this.logger.log(`[${jobId}] Research complete: ${rawSkills.length} raw skills`);

      if (rawSkills.length === 0) {
        rawSkills.push(jobTitle); // fallback
      }

      // Step 2: Normalize — AI merges duplicates, standardizes, infers missing
      await this.updateStep(jobId, 'PROCESSING', 'NORMALIZE');
      this.logger.log(`[${jobId}] Step 2: Normalize`);
      const normalizedSkills = await this.stepNormalize(jobTitle, rawSkills);
      this.logger.log(`[${jobId}] Normalize complete: ${normalizedSkills.length} skills`);

      // Step 3: Cluster — AI groups skills into courses with lessons
      await this.updateStep(jobId, 'PROCESSING', 'CLUSTER');
      this.logger.log(`[${jobId}] Step 3: Cluster`);
      const courses = await this.stepCluster(jobTitle, normalizedSkills);
      this.logger.log(`[${jobId}] Cluster complete: ${courses.length} courses`);

      // Step 4: Grade — AI assigns SFIA levels
      await this.updateStep(jobId, 'PROCESSING', 'GRADE');
      this.logger.log(`[${jobId}] Step 4: Grade`);
      const gradedCourses = await this.stepGrade(jobTitle, courses);
      this.logger.log(`[${jobId}] Grade complete`);

      // Step 5: Map Dependencies — AI creates DAG
      await this.updateStep(jobId, 'PROCESSING', 'MAP_DEPENDENCIES');
      this.logger.log(`[${jobId}] Step 5: Map Dependencies`);
      const dependencies = await this.stepMapDependencies(jobTitle, gradedCourses);
      this.logger.log(`[${jobId}] Map Dependencies complete: ${dependencies.length} edges`);

      // Step 6: Validate — Check for cycles, detect shared courses
      await this.updateStep(jobId, 'PROCESSING', 'VALIDATE');
      this.logger.log(`[${jobId}] Step 6: Validate`);
      const validDependencies = this.stepValidate(gradedCourses, dependencies);
      this.logger.log(`[${jobId}] Validate complete: ${validDependencies.length} valid edges`);

      // Detect shared courses
      const sharedCourses = this.detectSharedCourses(gradedCourses);

      // Build final map data
      const mapData = {
        jobTitle,
        courses: gradedCourses,
        dependencies: validDependencies,
        sharedCourses,
        rawSkillCount: rawSkills.length,
        normalizedSkillCount: normalizedSkills.length,
        courseCount: gradedCourses.length,
        lessonCount: gradedCourses.reduce(
          (sum: number, c: any) => sum + (c.lessons?.length || 0),
          0,
        ),
        generatedAt: new Date().toISOString(),
      };

      // Save completed result
      await this.prisma.generatedMap.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          currentStep: null,
          mapData,
          nodeCount: gradedCourses.length,
          completedAt: new Date(),
        },
      });

      this.logger.log(`[${jobId}] Pipeline complete!`);
    } catch (error: any) {
      this.logger.error(`[${jobId}] Pipeline failed: ${error.message}`);
      await this.prisma.generatedMap.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error: error.message || 'Unknown error',
        },
      });
    }
  }

  private async updateStep(jobId: string, status: string, step: PipelineStep) {
    await this.prisma.generatedMap.update({
      where: { id: jobId },
      data: { status: status as any, currentStep: step },
    });
  }

  // ==========================================
  // Step 1: Research
  // ==========================================

  private async stepResearch(jobTitle: string): Promise<string[]> {
    const skills: string[] = [];

    // ESCO
    try {
      const escoResults = await this.escoApiService.searchOccupation(jobTitle);
      if (escoResults.length > 0) {
        const escoSkills = await this.escoApiService.getSkills(escoResults[0].uri);
        skills.push(...escoSkills.map((s) => s.title));
        this.logger.log(`ESCO provided ${escoSkills.length} skills`);
      }
    } catch (e) {
      this.logger.warn('ESCO adapter failed (non-critical)');
    }

    // O*NET
    try {
      const onetResults = await this.onetService.searchCareers(jobTitle);
      if (onetResults.length > 0) {
        const topCode = onetResults[0].code;
        const [onetSkills, onetKnowledge] = await Promise.all([
          this.onetService.getSkills(topCode),
          this.onetService.getKnowledge(topCode),
        ]);
        skills.push(...onetSkills.map((s) => s.name));
        skills.push(...onetKnowledge.map((k) => k.name));
        this.logger.log(`O*NET provided ${onetSkills.length + onetKnowledge.length} skills`);
      }
    } catch (e) {
      this.logger.warn('O*NET adapter failed (non-critical)');
    }

    // Lightcast
    try {
      const lightcastSkills = await this.lightcastService.extractSkills(jobTitle);
      skills.push(...lightcastSkills.map((s) => s.name));
      this.logger.log(`Lightcast provided ${lightcastSkills.length} skills`);
    } catch (e) {
      this.logger.warn('Lightcast adapter failed (non-critical)');
    }

    // Deduplicate
    return [...new Set(skills)];
  }

  // ==========================================
  // Step 2: Normalize
  // ==========================================

  private async stepNormalize(
    jobTitle: string,
    rawSkills: string[],
  ): Promise<Array<{ label: string; description: string; category: string }>> {
    const prompt = buildNormalizationPrompt(jobTitle, rawSkills);
    const result = await this.aiProvider.completeJSON(prompt, NormalizationSchema, {
      temperature: 0.3,
      maxTokens: 8192,
    });

    if (!result.skills || result.skills.length === 0) {
      this.logger.warn('AI returned empty skills, generating fallback from raw skills');
      return rawSkills.slice(0, 20).map((s) => ({
        label: s,
        description: `Skill related to ${jobTitle}`,
        category: 'Technical' as const,
      }));
    }

    return result.skills;
  }

  // ==========================================
  // Step 3: Cluster
  // ==========================================

  private async stepCluster(
    jobTitle: string,
    skills: Array<{ label: string; description: string; category: string }>,
  ): Promise<any[]> {
    const prompt = buildClusteringPrompt(jobTitle, skills);
    const result = await this.aiProvider.completeJSON(prompt, ClusteringSchema, {
      temperature: 0.5,
      maxTokens: 16384,
    });
    return result.courses;
  }

  // ==========================================
  // Step 4: Grade
  // ==========================================

  private async stepGrade(jobTitle: string, courses: any[]): Promise<any[]> {
    const gradingInput = courses.map((c) => ({
      title: c.title,
      description: c.description,
      category: c.category,
      lessonCount: c.lessons?.length || 0,
    }));

    const prompt = buildGradingPrompt(jobTitle, gradingInput);
    const result = await this.aiProvider.completeJSON(prompt, GradingSchema, {
      temperature: 0.3,
      maxTokens: 2048,
    });

    // Merge grading results back into courses
    const gradeMap = new Map(
      result.gradedCourses.map((g) => [g.title, g]),
    );

    return courses.map((course) => {
      const grade = gradeMap.get(course.title);
      return {
        ...course,
        sfiaLevel: grade?.sfiaLevel ?? 3,
        estimatedHours: grade?.estimatedHours ?? 10,
      };
    });
  }

  // ==========================================
  // Step 5: Map Dependencies
  // ==========================================

  private async stepMapDependencies(
    jobTitle: string,
    courses: any[],
  ): Promise<Array<{ prerequisite: string; dependent: string }>> {
    const depInput = courses.map((c) => ({
      title: c.title,
      sfiaLevel: c.sfiaLevel,
      category: c.category,
    }));

    const prompt = buildDependencyPrompt(jobTitle, depInput);
    const result = await this.aiProvider.completeJSON(prompt, DependencySchema, {
      temperature: 0.3,
      maxTokens: 2048,
    });

    return result.dependencies;
  }

  // ==========================================
  // Step 6: Validate
  // ==========================================

  private stepValidate(
    courses: any[],
    dependencies: Array<{ prerequisite: string; dependent: string }>,
  ): Array<{ prerequisite: string; dependent: string }> {
    const courseTitles = new Set(courses.map((c) => c.title));

    // Filter out edges referencing non-existent courses
    const validEdges = dependencies.filter(
      (d) => courseTitles.has(d.prerequisite) && courseTitles.has(d.dependent),
    );

    // Remove cycles using DFS
    return this.removeCycles(validEdges);
  }

  private removeCycles(
    edges: Array<{ prerequisite: string; dependent: string }>,
  ): Array<{ prerequisite: string; dependent: string }> {
    // Build adjacency list
    const graph = new Map<string, string[]>();
    for (const edge of edges) {
      if (!graph.has(edge.prerequisite)) graph.set(edge.prerequisite, []);
      graph.get(edge.prerequisite)!.push(edge.dependent);
    }

    const visited = new Set<string>();
    const inStack = new Set<string>();
    const cycleEdges = new Set<number>();

    const dfs = (node: string): boolean => {
      visited.add(node);
      inStack.add(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (inStack.has(neighbor)) {
          // Found a cycle — mark the edge that causes it
          const edgeIdx = edges.findIndex(
            (e) => e.prerequisite === node && e.dependent === neighbor,
          );
          if (edgeIdx >= 0) cycleEdges.add(edgeIdx);
          return true;
        }
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        }
      }

      inStack.delete(node);
      return false;
    };

    // Run DFS from all nodes
    const allNodes = new Set<string>();
    for (const e of edges) {
      allNodes.add(e.prerequisite);
      allNodes.add(e.dependent);
    }

    for (const node of allNodes) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    // Return edges without cycle-causing ones
    return edges.filter((_, i) => !cycleEdges.has(i));
  }

  // ==========================================
  // Shared Course Detection
  // ==========================================

  private detectSharedCourses(courses: any[]): string[] {
    const shareableKeywords = [
      'git', 'version control', 'sql', 'database', 'communication',
      'problem solving', 'teamwork', 'agile', 'scrum', 'testing',
      'debugging', 'documentation', 'security', 'devops', 'ci/cd',
      'linux', 'command line', 'data structures', 'algorithms',
    ];

    return courses
      .filter((c) => {
        if (c.shareable === true) return true;
        const titleLower = c.title.toLowerCase();
        return shareableKeywords.some((kw) => titleLower.includes(kw));
      })
      .map((c) => c.title);
  }
}
