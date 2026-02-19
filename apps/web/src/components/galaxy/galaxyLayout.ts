import type {
  GalaxyJobInput,
  GalaxyCategory,
  GalaxyJob,
  GalaxyJobCourse,
  GalaxySkill,
  GalaxySharedLink,
  GalaxyData,
} from './galaxyTypes';
import { categorizeJobs, type CategoryDefinition } from './galaxyCategorize';
import { resolveOverlaps } from './galaxyForceResolver';

const W = 6000;
const H = 4000;
const CENTER_X = W / 2;
const CENTER_Y = H / 2;
const ELLIPSE_RX = 700;
const ELLIPSE_RY = 500;
const CLUSTER_RING_R = 400;
const JOB_RING_MIN = 80;   // minimum distance from category center
const JOB_RING_MAX = 350;  // maximum distance from category center
const COURSE_RING_R = 250;
const SKILL_RING_R = 120;

// Seeded PRNG (mulberry32) — deterministic random for consistent layout
function seededRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Simple string hash for seeding
function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h;
}

export function computeGalaxyLayout(jobs: GalaxyJobInput[]): GalaxyData {
  const categorized = categorizeJobs(jobs);
  const categoryEntries = Array.from(categorized.entries());
  const totalCategories = categoryEntries.length;

  // Position categories in an ellipse
  const categories: GalaxyCategory[] = categoryEntries.map(
    ([, { def, jobs: catJobs }], i) => {
      const rng = seededRng(hashStr(def.id));
      const baseAngle = (i / totalCategories) * Math.PI * 2 - Math.PI / 2;
      const angle = baseAngle + (rng() - 0.5) * 0.3; // jitter ±0.15 rad
      const rx = ELLIPSE_RX * (0.9 + rng() * 0.2); // 90%–110%
      const ry = ELLIPSE_RY * (0.9 + rng() * 0.2);
      const cx = CENTER_X + Math.cos(angle) * rx;
      const cy = CENTER_Y + Math.sin(angle) * ry;

      // Position jobs around category center
      const galaxyJobs = positionJobs(catJobs, def.id, cx, cy);

      return {
        id: def.id,
        name: def.name,
        color: def.color,
        icon: def.icon,
        x: cx,
        y: cy,
        jobs: galaxyJobs,
      };
    },
  );

  // Resolve node overlaps via d3-force (must run BEFORE sharedLinks)
  resolveOverlaps(categories);

  // Compute shared links
  const sharedLinks = computeSharedLinks(categories);

  // Compute stats
  let totalCourses = 0;
  let totalLessons = 0;
  let totalSkills = 0;
  for (const cat of categories) {
    for (const job of cat.jobs) {
      totalCourses += job.courseCount;
      totalLessons += job.lessonCount;
      totalSkills += job.skillCount;
    }
  }

  return {
    categories,
    sharedLinks,
    stats: {
      totalJobs: jobs.length,
      totalCategories,
      totalCourses,
      totalLessons,
      totalSkills,
    },
  };
}

function positionJobs(
  jobs: GalaxyJobInput[],
  categoryId: string,
  cx: number,
  cy: number,
): GalaxyJob[] {
  // Count total unique skills per job to determine ring radius
  const jobSkillCounts = jobs.map((job) => {
    const md = job.mapData;
    const courses = md?.courses ?? [];
    let skillCount = 0;
    for (const c of courses) {
      if (c.lessons) {
        const skillSet = new Set<string>();
        for (const lesson of c.lessons) {
          if (lesson.skills) {
            for (const skill of lesson.skills) {
              skillSet.add(skill);
            }
          }
        }
        skillCount += skillSet.size;
      }
    }
    return skillCount;
  });

  // Find min and max skill counts across jobs in this category
  const maxSkills = Math.max(1, ...jobSkillCounts);
  const minSkills = Math.min(...jobSkillCounts);
  const skillRange = Math.max(1, maxSkills - minSkills);

  return jobs.map((job, i) => {
    const rng = seededRng(hashStr(job.id + categoryId));
    const baseAngle = (i / jobs.length) * Math.PI * 2 - Math.PI / 2;
    const angle = baseAngle + (rng() - 0.5) * 0.8; // jitter angle ±0.4 rad

    // Skill-based radius: more skills → farther from category center
    const skillRatio = (jobSkillCounts[i] - minSkills) / skillRange; // 0..1
    const r = JOB_RING_MIN + skillRatio * (JOB_RING_MAX - JOB_RING_MIN) + rng() * 30; // small jitter
    const jx = cx + Math.cos(angle) * r;
    const jy = cy + Math.sin(angle) * r;

    const md = job.mapData;
    const courses = md?.courses ?? [];
    const sharedCourses = md?.sharedCourses ?? [];

    // Position courses around job
    const galaxyCourses = positionCourses(courses, sharedCourses, jx, jy);

    return {
      id: job.id,
      name: job.jobTitle,
      categoryId,
      x: jx,
      y: jy,
      courseCount: md?.courseCount ?? 0,
      lessonCount: md?.lessonCount ?? 0,
      skillCount: md?.normalizedSkillCount ?? md?.rawSkillCount ?? 0,
      courses: galaxyCourses,
    };
  });
}

function positionCourses(
  courses: GalaxyJobInput['mapData'] extends infer T
    ? T extends { courses: infer C }
      ? C
      : never
    : never,
  sharedCourses: string[],
  jx: number,
  jy: number,
): GalaxyJobCourse[] {
  if (!Array.isArray(courses)) return [];

  return courses.map((c, i) => {
    const rng = seededRng(hashStr(c.title + jx));
    const baseAngle = (i / courses.length) * Math.PI * 2 - Math.PI / 2;
    const angle = baseAngle + (rng() - 0.5) * 1.0; // jitter angle ±0.5 rad
    const r = COURSE_RING_R * (0.6 + rng() * 0.5); // 60%–110% of radius
    const cx = jx + Math.cos(angle) * r;
    const cy = jy + Math.sin(angle) * r;

    // Collect unique skills from all lessons
    const skillSet = new Set<string>();
    if (c.lessons) {
      for (const lesson of c.lessons) {
        if (lesson.skills) {
          for (const skill of lesson.skills) {
            skillSet.add(skill);
          }
        }
      }
    }

    // Position skills scattered around the course
    const uniqueSkills = Array.from(skillSet);
    const skills: GalaxySkill[] = uniqueSkills.map((name, si) => {
      const sRng = seededRng(hashStr(name + c.title));
      const sBaseAngle = (si / uniqueSkills.length) * Math.PI * 2 - Math.PI / 2;
      const sAngle = sBaseAngle + (sRng() - 0.5) * 1.2; // jitter ±0.6 rad
      const sR = SKILL_RING_R * (0.5 + sRng() * 0.6); // 50%–110% of radius
      return {
        name,
        x: cx + Math.cos(sAngle) * sR,
        y: cy + Math.sin(sAngle) * sR,
      };
    });

    return {
      title: c.title,
      category: c.category,
      sfiaLevel: c.sfiaLevel,
      estimatedHours: c.estimatedHours,
      lessonCount: c.lessons?.length ?? 0,
      isShared: sharedCourses.includes(c.title),
      x: cx,
      y: cy,
      skills,
    };
  });
}

function computeSharedLinks(categories: GalaxyCategory[]): GalaxySharedLink[] {
  // Build map: courseTitle (lowercase) → all occurrences across jobs
  const courseMap = new Map<string, GalaxySharedLink['nodes']>();

  for (const cat of categories) {
    for (const job of cat.jobs) {
      for (let ci = 0; ci < job.courses.length; ci++) {
        const course = job.courses[ci];
        const key = course.title.toLowerCase();
        if (!courseMap.has(key)) {
          courseMap.set(key, []);
        }
        courseMap.get(key)!.push({
          jobId: job.id,
          categoryId: cat.id,
          courseKey: `${job.id}-${ci}`,
          x: course.x,
          y: course.y,
        });
      }
    }
  }

  // Only keep courses that appear in 2+ different jobs
  const links: GalaxySharedLink[] = [];
  for (const [title, nodes] of courseMap) {
    const uniqueJobs = new Set(nodes.map((n) => n.jobId));
    if (uniqueJobs.size >= 2) {
      links.push({ courseTitle: title, nodes });
    }
  }

  return links;
}

export { W, H, CLUSTER_RING_R };
