/**
 * galaxyForceResolver.ts
 *
 * Post-processing step that uses d3-force to resolve node overlaps
 * while preserving the seeded random layout structure.
 *
 * Strategy: nested per-cluster simulations (not global) so that
 * resolving overlaps within one cluster never pushes nodes into another.
 */
import {
  forceSimulation,
  forceCollide,
  forceRadial,
  forceX,
  forceY,
  type SimulationNodeDatum,
} from 'd3-force';
import type { GalaxyCategory } from './galaxyTypes';

// ── Collision radii per level ──
const COLLISION_R = { L1: 20, L2: 18, L3: 14, L4: 12 } as const;

// ── Iteration counts per level ──
const TICKS = { L1: 50, L2: 80, L3: 60, L4: 40 } as const;

// ── Anchor strength (pull back toward seeded position) ──
const ANCHOR_STRENGTH = 0.3;

// ── Radial constraint strength (keep nodes near ring) ──
const RADIAL_STRENGTH = 0.05;

// ── ForceNode extends d3's SimulationNodeDatum ──
interface ForceNode extends SimulationNodeDatum {
  ox: number; // original x (seeded position)
  oy: number; // original y (seeded position)
}

// ── Seeded PRNG (mulberry32) — same as galaxyLayout.ts ──
function seededRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h;
}

// ── Average distance from center ──
function avgDist(nodes: { x: number; y: number }[], cx: number, cy: number): number {
  if (nodes.length === 0) return 0;
  let sum = 0;
  for (const n of nodes) {
    const dx = n.x - cx;
    const dy = n.y - cy;
    sum += Math.sqrt(dx * dx + dy * dy);
  }
  return sum / nodes.length;
}

// ── Core: run a d3-force simulation on a set of nodes ──
function runSimulation(
  nodes: ForceNode[],
  collisionR: number,
  ticks: number,
  cx?: number,
  cy?: number,
  ringR?: number,
  seed?: number,
): void {
  if (nodes.length < 2) return; // nothing to resolve

  const sim = forceSimulation<ForceNode>(nodes)
    .force('collide', forceCollide<ForceNode>(collisionR).iterations(3))
    .force('anchorX', forceX<ForceNode>((d) => d.ox).strength(ANCHOR_STRENGTH))
    .force('anchorY', forceY<ForceNode>((d) => d.oy).strength(ANCHOR_STRENGTH));

  // Keep nodes near their ring radius from parent center
  if (cx !== undefined && cy !== undefined && ringR !== undefined && ringR > 0) {
    sim.force('radial', forceRadial<ForceNode>(ringR, cx, cy).strength(RADIAL_STRENGTH));
  }

  // Deterministic random source
  if (seed !== undefined) {
    (sim as any).randomSource(seededRng(seed));
  }

  // Run synchronously — no animation, fixed iterations
  sim.alphaDecay(0).tick(ticks).stop();
}

// ── Shift children by a delta (cascade) ──
function shiftJobs(
  cat: GalaxyCategory,
  dx: number,
  dy: number,
): void {
  for (const job of cat.jobs) {
    job.x += dx;
    job.y += dy;
    for (const course of job.courses) {
      course.x += dx;
      course.y += dy;
      for (const skill of course.skills) {
        skill.x += dx;
        skill.y += dy;
      }
    }
  }
}

function shiftCourses(
  job: GalaxyCategory['jobs'][number],
  dx: number,
  dy: number,
): void {
  for (const course of job.courses) {
    course.x += dx;
    course.y += dy;
    for (const skill of course.skills) {
      skill.x += dx;
      skill.y += dy;
    }
  }
}

function shiftSkills(
  course: GalaxyCategory['jobs'][number]['courses'][number],
  dx: number,
  dy: number,
): void {
  for (const skill of course.skills) {
    skill.x += dx;
    skill.y += dy;
  }
}

// ══════════════════════════════════════════════
// Public API
// ══════════════════════════════════════════════

export function resolveOverlaps(categories: GalaxyCategory[]): void {
  // ── L1: Resolve category-to-category overlaps ──
  if (categories.length >= 2) {
    const catNodes: ForceNode[] = categories.map((c) => ({
      x: c.x,
      y: c.y,
      ox: c.x,
      oy: c.y,
    }));

    runSimulation(catNodes, COLLISION_R.L1, TICKS.L1, undefined, undefined, undefined, 42);

    // Write back + cascade delta to children
    for (let i = 0; i < categories.length; i++) {
      const dx = catNodes[i].x! - categories[i].x;
      const dy = catNodes[i].y! - categories[i].y;
      if (dx !== 0 || dy !== 0) {
        categories[i].x = catNodes[i].x!;
        categories[i].y = catNodes[i].y!;
        shiftJobs(categories[i], dx, dy);
      }
    }
  }

  // ── L2: Per-category job resolution ──
  for (const cat of categories) {
    if (cat.jobs.length < 2) continue;

    const jobNodes: ForceNode[] = cat.jobs.map((j) => ({
      x: j.x,
      y: j.y,
      ox: j.x,
      oy: j.y,
    }));

    const ringR = avgDist(cat.jobs, cat.x, cat.y);
    runSimulation(jobNodes, COLLISION_R.L2, TICKS.L2, cat.x, cat.y, ringR, hashStr(cat.id));

    // Write back + cascade delta to children
    for (let i = 0; i < cat.jobs.length; i++) {
      const dx = jobNodes[i].x! - cat.jobs[i].x;
      const dy = jobNodes[i].y! - cat.jobs[i].y;
      if (dx !== 0 || dy !== 0) {
        cat.jobs[i].x = jobNodes[i].x!;
        cat.jobs[i].y = jobNodes[i].y!;
        shiftCourses(cat.jobs[i], dx, dy);
      }
    }
  }

  // ── L3: Per-job course resolution ──
  for (const cat of categories) {
    for (const job of cat.jobs) {
      if (job.courses.length < 2) continue;

      const courseNodes: ForceNode[] = job.courses.map((c) => ({
        x: c.x,
        y: c.y,
        ox: c.x,
        oy: c.y,
      }));

      const ringR = avgDist(job.courses, job.x, job.y);
      runSimulation(courseNodes, COLLISION_R.L3, TICKS.L3, job.x, job.y, ringR, hashStr(job.id));

      // Write back + cascade delta to children (skills)
      for (let i = 0; i < job.courses.length; i++) {
        const dx = courseNodes[i].x! - job.courses[i].x;
        const dy = courseNodes[i].y! - job.courses[i].y;
        if (dx !== 0 || dy !== 0) {
          job.courses[i].x = courseNodes[i].x!;
          job.courses[i].y = courseNodes[i].y!;
          shiftSkills(job.courses[i], dx, dy);
        }
      }
    }
  }

  // ── L4: Per-course skill resolution ──
  for (const cat of categories) {
    for (const job of cat.jobs) {
      for (const course of job.courses) {
        if (course.skills.length < 2) continue;

        const skillNodes: ForceNode[] = course.skills.map((s) => ({
          x: s.x,
          y: s.y,
          ox: s.x,
          oy: s.y,
        }));

        const ringR = avgDist(course.skills, course.x, course.y);
        runSimulation(
          skillNodes,
          COLLISION_R.L4,
          TICKS.L4,
          course.x,
          course.y,
          ringR,
          hashStr(course.title),
        );

        // Write back (skills have no children)
        for (let i = 0; i < course.skills.length; i++) {
          course.skills[i].x = skillNodes[i].x!;
          course.skills[i].y = skillNodes[i].y!;
        }
      }
    }
  }
}
