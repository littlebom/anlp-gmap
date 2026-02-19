'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GalaxyJobInput, GalaxyData, GalaxySearchResult } from './galaxyTypes';
import { computeGalaxyLayout, W, H } from './galaxyLayout';
import { GalaxySidebar } from './GalaxySidebar';
import { GalaxyMinimap } from './GalaxyMinimap';
import { GalaxyTooltip, type TooltipData } from './GalaxyTooltip';

interface GalaxyViewProps {
  jobs: GalaxyJobInput[];
  onJobSelect: (jobId: string) => void;
}

// Dim opacity when a job is hovered — other nodes fade out
const DIM_OPACITY = 0.06;

// Node radii for edge shortening (stop line at node border)
const NODE_R = { cat: 10, job: 10, course: 8, skill: 8 };

// Shorten a line so it stops at the border of each endpoint node
function shortenLine(
  x1: number, y1: number, r1: number,
  x2: number, y2: number, r2: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < r1 + r2) return { x1, y1, x2, y2 }; // too close, skip
  const ux = dx / dist;
  const uy = dy / dist;
  return {
    x1: x1 + ux * r1,
    y1: y1 + uy * r1,
    x2: x2 - ux * r2,
    y2: y2 - uy * r2,
  };
}

// Generate hexagon points string for SVG <polygon>
function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2; // flat-top hexagon
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

export function GalaxyView({ jobs, onJobSelect }: GalaxyViewProps) {
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  // Hover highlight state — supports L1 (Category), L2 (Job), L3 (Course)
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(null);
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null);
  const [hoveredCourseKey, setHoveredCourseKey] = useState<string | null>(null);
  const [hoveredCourseJobId, setHoveredCourseJobId] = useState<string | null>(null);

  const galaxyRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const galaxyData: GalaxyData | null = useMemo(() => {
    if (jobs.length === 0) return null;
    return computeGalaxyLayout(jobs);
  }, [jobs]);

  // Center the galaxy on mount
  useEffect(() => {
    const el = galaxyRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setContainerSize({ w: rect.width, h: rect.height });
    setPanX(rect.width / 2 - W / 2);
    setPanY(rect.height / 2 - H / 2);
  }, []);

  // Track container resize
  useEffect(() => {
    const handler = () => {
      const el = galaxyRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        setContainerSize({ w: rect.width, h: rect.height });
      }
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // ── Pan (drag + scroll) ──

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setPanX((x) => x - e.deltaX);
    setPanY((y) => y - e.deltaY);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button, a, input')) return;
      isDragging.current = true;
      dragStart.current = { x: e.clientX - panX, y: e.clientY - panY };
    },
    [panX, panY],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPanX(e.clientX - dragStart.current.x);
    setPanY(e.clientY - dragStart.current.y);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const focusCluster = useCallback(
    (catId: string) => {
      if (!galaxyData) return;
      const cat = galaxyData.categories.find((c) => c.id === catId);
      if (!cat) return;
      const el = galaxyRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPanX(rect.width / 2 - cat.x);
      setPanY(rect.height / 2 - cat.y);
    },
    [galaxyData],
  );

  // Focus + highlight a search result node
  const handleSearchSelect = useCallback(
    (result: GalaxySearchResult) => {
      const el = galaxyRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPanX(rect.width / 2 - result.x);
      setPanY(rect.height / 2 - result.y);
      // Set hover state to highlight the result
      setHoveredCatId(null);
      setHoveredJobId(null);
      setHoveredCourseKey(null);
      setHoveredCourseJobId(null);
      if (result.type === 'job') {
        setHoveredJobId(result.jobId);
      } else if (result.type === 'course' || result.type === 'skill') {
        setHoveredCourseKey(result.courseKey ?? null);
        setHoveredCourseJobId(result.jobId);
      }
    },
    [],
  );

  // Clear search + highlight state
  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
    setHoveredCatId(null);
    setHoveredJobId(null);
    setHoveredCourseKey(null);
    setHoveredCourseJobId(null);
  }, []);

  const searchLower = searchQuery.toLowerCase().trim();

  // Search matching: returns true if any node in the job matches the query
  const jobMatchesSearch = useCallback(
    (jobId: string) => {
      if (!searchLower || !galaxyData) return true;
      for (const cat of galaxyData.categories) {
        for (const job of cat.jobs) {
          if (job.id !== jobId) continue;
          // Match job name
          if (job.name.toLowerCase().includes(searchLower)) return true;
          // Match any course title
          for (const course of job.courses) {
            if (course.title.toLowerCase().includes(searchLower)) return true;
            // Match any skill name
            for (const skill of course.skills) {
              if (skill.name.toLowerCase().includes(searchLower)) return true;
            }
          }
        }
      }
      return false;
    },
    [searchLower, galaxyData],
  );

  // Is anything hovered at all?
  const hasHover = !!(hoveredCatId || hoveredJobId || hoveredCourseKey);

  // Helper: is this element "active" (not dimmed)?
  // catId = category id, jobId = job id, courseKey = "jobId-courseIdx"
  const isActive = (catId: string, jobId?: string, courseKey?: string) => {
    if (!hasHover) return true; // nothing hovered → all active

    // Course-level hover (L3): that course's skills + the course + parent job + parent category
    if (hoveredCourseKey && hoveredCourseJobId) {
      if (courseKey) return courseKey === hoveredCourseKey;
      // Job node: active if it's the parent job
      if (jobId) return jobId === hoveredCourseJobId;
      // Category node: active if this cat owns the parent job
      return galaxyData?.categories.some(
        (c) => c.id === catId && c.jobs.some((j) => j.id === hoveredCourseJobId),
      ) ?? false;
    }

    // Job-level hover (L2): that job + its children + parent category
    if (hoveredJobId) {
      if (courseKey || jobId) {
        // Course/Skill or Job: belongs to hovered job?
        return jobId === hoveredJobId;
      }
      // Category node: find if this cat owns the hovered job
      return galaxyData?.categories.some(
        (c) => c.id === catId && c.jobs.some((j) => j.id === hoveredJobId),
      ) ?? false;
    }

    // Category-level hover (L1): entire category lights up
    if (hoveredCatId) {
      return catId === hoveredCatId;
    }

    return true;
  };

  if (!galaxyData) return null;

  return (
    <div className="fixed inset-0 z-20 flex overflow-hidden bg-[#0B1120]" style={{ paddingTop: '3.5rem' }}>
      {/* Background grid */}
      <div className="galaxy-bg-grid pointer-events-none fixed inset-0 z-0" />

      {/* Sidebar */}
      <GalaxySidebar
        data={galaxyData}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={handleSearchClear}
        onCategoryClick={focusCluster}
        onSearchSelect={handleSearchSelect}
      />

      {/* Main galaxy area */}
      <main className="relative z-10 flex-1">
        {/* Top bar */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-40 flex h-12 items-center justify-between bg-gradient-to-b from-[#0B1120] to-transparent px-5">
          <div className="pointer-events-auto">
            <h1 className="text-sm font-bold tracking-tight text-slate-200">Galaxy View</h1>
            <p className="text-[10px] text-slate-500">Network Constellation</p>
          </div>
        </div>

        {/* Tooltip */}
        <GalaxyTooltip data={tooltip} />

        {/* Galaxy canvas — pan only, no zoom */}
        <div
          ref={galaxyRef}
          className="absolute inset-0 cursor-grab overflow-hidden active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="absolute"
            style={{
              transformOrigin: '0 0',
              transform: `translate(${panX}px,${panY}px)`,
            }}
          >
            {/* ═══ SVG Layer — edges + dots ═══ */}
            <svg
              className="pointer-events-none absolute"
              style={{ width: W, height: H, overflow: 'visible' }}
            >
              <defs>
                <filter id="star-glow" x="-200%" y="-200%" width="500%" height="500%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
                  <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* ── Shared Course edges (golden dashed) — L3↔L3 across jobs ── */}
              {galaxyData.sharedLinks.map((link) => {
                const { nodes } = link;
                // Draw edges between every pair of occurrences
                const edges: React.ReactNode[] = [];
                for (let a = 0; a < nodes.length; a++) {
                  for (let b = a + 1; b < nodes.length; b++) {
                    const na = nodes[a];
                    const nb = nodes[b];
                    // Active if: no hover, or either end's course/job/category is hovered
                    const active = !hasHover
                      || (hoveredCourseKey && (na.courseKey === hoveredCourseKey || nb.courseKey === hoveredCourseKey))
                      || (hoveredJobId && (na.jobId === hoveredJobId || nb.jobId === hoveredJobId))
                      || (hoveredCatId && (na.categoryId === hoveredCatId || nb.categoryId === hoveredCatId));
                    const sl = shortenLine(na.x, na.y, NODE_R.course, nb.x, nb.y, NODE_R.course);
                    edges.push(
                      <line
                        key={`shared-${na.courseKey}-${nb.courseKey}`}
                        x1={sl.x1} y1={sl.y1} x2={sl.x2} y2={sl.y2}
                        stroke={active ? 'rgba(250,204,21,0.35)' : `rgba(250,204,21,${DIM_OPACITY * 0.5})`}
                        strokeWidth={active && hasHover ? '1.2' : '0.8'}
                        strokeDasharray="6"
                        className="galaxy-edge"
                        style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
                      />,
                    );
                  }
                }
                return edges;
              })}

              {/* ── Category → Job edges ── */}
              {galaxyData.categories.map((cat) =>
                cat.jobs.map((job) => {
                  const active = isActive(cat.id, job.id);
                  const matchesSearch = jobMatchesSearch(job.id);
                  const baseOpacity = searchLower ? (matchesSearch ? 0.2 : 0.03) : 0.2;
                  const sl = shortenLine(cat.x, cat.y, NODE_R.cat, job.x, job.y, NODE_R.job);
                  return (
                    <line
                      key={`e-cj-${job.id}`}
                      x1={sl.x1} y1={sl.y1} x2={sl.x2} y2={sl.y2}
                      stroke="white"
                      strokeWidth={active && hasHover ? "1.5" : "1"}
                      strokeOpacity={active ? (hasHover ? 0.5 : baseOpacity) : DIM_OPACITY}
                      style={{ transition: 'stroke-opacity 0.3s, stroke-width 0.3s' }}
                    />
                  );
                }),
              )}

              {/* ── Job → Course edges ── */}
              {galaxyData.categories.map((cat) =>
                cat.jobs.map((job) =>
                  job.courses.map((course, ci) => {
                    const ck = `${job.id}-${ci}`;
                    const active = isActive(cat.id, job.id, ck);
                    const sl = shortenLine(job.x, job.y, NODE_R.job, course.x, course.y, NODE_R.course);
                    return (
                      <line
                        key={`e-jc-${job.id}-${ci}`}
                        x1={sl.x1} y1={sl.y1} x2={sl.x2} y2={sl.y2}
                        stroke="white"
                        strokeWidth={active && hasHover ? "1" : "0.7"}
                        strokeOpacity={active ? (hasHover ? 0.4 : 0.15) : DIM_OPACITY}
                        style={{ transition: 'stroke-opacity 0.3s, stroke-width 0.3s' }}
                      />
                    );
                  }),
                ),
              )}

              {/* ── Course → Skill edges ── */}
              {galaxyData.categories.map((cat) =>
                cat.jobs.map((job) =>
                  job.courses.map((course, ci) => {
                    const ck = `${job.id}-${ci}`;
                    const active = isActive(cat.id, job.id, ck);
                    return course.skills.map((skill, si) => {
                      const sl = shortenLine(course.x, course.y, NODE_R.course, skill.x, skill.y, NODE_R.skill);
                      return (
                      <line
                        key={`e-cs-${job.id}-${ci}-${si}`}
                        x1={sl.x1} y1={sl.y1} x2={sl.x2} y2={sl.y2}
                        stroke="white"
                        strokeWidth={active && hasHover ? "0.8" : "0.5"}
                        strokeOpacity={active ? (hasHover ? 0.3 : 0.1) : DIM_OPACITY}
                        style={{ transition: 'stroke-opacity 0.3s, stroke-width 0.3s' }}
                      />
                      );
                    });
                  }),
                ),
              )}

              {/* ── Skill box nodes + label (SVG) — L4 drawn first (bottom) ── */}
              {galaxyData.categories.map((cat) =>
                cat.jobs.map((job) =>
                  job.courses.map((course, ci) => {
                    const ck = `${job.id}-${ci}`;
                    const active = isActive(cat.id, job.id, ck);
                    return course.skills.map((skill, si) => {
                      const courseColor = cat.color;
                      const boxSize = 12;
                      return (
                        <g key={`sdot-${job.id}-${ci}-${si}`} opacity={active ? (hasHover ? 0.7 : 0.35) : DIM_OPACITY} style={{ transition: 'opacity 0.3s' }}>
                          <rect
                            x={skill.x - boxSize / 2} y={skill.y - boxSize / 2}
                            width={boxSize} height={boxSize}
                            rx="2"
                            fill={courseColor}
                          />
                          <text
                            x={skill.x} y={skill.y + 12}
                            textAnchor="middle"
                            fill={active && hasHover ? '#e2e8f0' : '#475569'}
                            fontSize="9"
                            fontFamily="Inter, sans-serif"
                            style={{ transition: 'fill 0.3s' }}
                          >
                            {skill.name.length > 20 ? skill.name.slice(0, 18) + '...' : skill.name}
                          </text>
                        </g>
                      );
                    });
                  }),
                ),
              )}

              {/* ── Course dots + label (SVG) — L3 ── */}
              {galaxyData.categories.map((cat) =>
                cat.jobs.map((job) =>
                  job.courses.map((course, ci) => {
                    const ck = `${job.id}-${ci}`;
                    const active = isActive(cat.id, job.id, ck);
                    const courseColor = cat.color;
                    return (
                      <g key={`cdot-${job.id}-${ci}`} opacity={active ? (hasHover ? 0.9 : 0.6) : DIM_OPACITY} style={{ transition: 'opacity 0.3s' }}>
                        <circle
                          cx={course.x} cy={course.y} r="6"
                          fill={courseColor}
                        />
                        <text
                          x={course.x} y={course.y + 14}
                          textAnchor="middle"
                          fill={active && hasHover ? '#e2e8f0' : '#64748b'}
                          fontSize="9"
                          fontFamily="Inter, sans-serif"
                          style={{ transition: 'fill 0.3s' }}
                        >
                          {course.title.length > 25 ? course.title.slice(0, 23) + '...' : course.title}
                        </text>
                      </g>
                    );
                  }),
                ),
              )}

              {/* ── Job hexagon nodes + label (SVG) — L2 ── */}
              {galaxyData.categories.map((cat) =>
                cat.jobs.map((job) => {
                  const active = isActive(cat.id, job.id);
                  const matchesSearch = jobMatchesSearch(job.id);
                  const baseOpacity = searchLower ? (matchesSearch ? 0.8 : 0.1) : 0.8;
                  return (
                    <g key={`glow-${job.id}`} opacity={active ? (hasHover ? 1 : baseOpacity) : DIM_OPACITY} style={{ transition: 'opacity 0.3s' }}>
                      <polygon
                        points={hexPoints(job.x, job.y, 8)}
                        fill={cat.color}
                        stroke={active && hasHover ? 'white' : 'none'}
                        strokeWidth="0.8"
                        filter="url(#node-glow)"
                        style={{ transition: 'stroke 0.3s' }}
                      />
                      <text
                        x={job.x} y={job.y + 14}
                        textAnchor="middle"
                        fill={active && hasHover ? '#e2e8f0' : '#94a3b8'}
                        fontSize="9"
                        fontFamily="Inter, sans-serif"
                        style={{ transition: 'fill 0.3s' }}
                      >
                        {job.name.length > 20 ? job.name.slice(0, 18) + '...' : job.name}
                      </text>
                    </g>
                  );
                }),
              )}

              {/* ── Category bright star nodes + label — L1 drawn last (top) ── */}
              {galaxyData.categories.map((cat) => {
                const active = isActive(cat.id);
                return (
                  <g key={`star-${cat.id}`} opacity={active ? 1 : DIM_OPACITY} style={{ transition: 'opacity 0.3s' }}>
                    <g filter="url(#star-glow)">
                      <circle cx={cat.x} cy={cat.y} r="8" fill="white" opacity="0.9" />
                      <circle cx={cat.x} cy={cat.y} r="4" fill={cat.color} />
                    </g>
                    <text
                      x={cat.x} y={cat.y + 18}
                      textAnchor="middle"
                      fill={active && hasHover ? '#ffffff' : cat.color}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="Inter, sans-serif"
                      style={{ transition: 'fill 0.3s' }}
                    >
                      {cat.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* ═══ Interactive DOM Layer — hover targets ═══ */}
            <div className="absolute" style={{ width: W, height: H }}>

              {/* ── Category hover targets ── */}
              {galaxyData.categories.map((cat) => (
                <div
                  key={`cat-hit-${cat.id}`}
                  className="absolute"
                  style={{
                    left: cat.x - 16,
                    top: cat.y - 16,
                    width: 32,
                    height: 32,
                  }}
                >
                  <div
                    className="flex h-full w-full cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-125"
                    onClick={() => focusCluster(cat.id)}
                    onMouseEnter={(e) => {
                      setHoveredCatId(cat.id);
                      setTooltip({
                        title: cat.name,
                        description: `${cat.jobs.length} occupations — Click to explore`,
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }}
                    onMouseLeave={() => {
                      setHoveredCatId(null);
                      setTooltip(null);
                    }}
                  />
                </div>
              ))}

              {/* ── Job hover targets (L2) — triggers highlight ── */}
              {galaxyData.categories.map((cat) =>
                cat.jobs.map((job) => {
                  const matchesSearch = jobMatchesSearch(job.id);
                  const showNode = searchLower ? matchesSearch : true;
                  if (!showNode) return null;
                  return (
                    <div
                      key={`job-hit-${job.id}`}
                      className="absolute"
                      style={{
                        left: job.x - 10,
                        top: job.y - 10,
                        width: 20,
                        height: 20,
                      }}
                    >
                      <div
                        className="flex h-full w-full cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-[2]"
                        onClick={() => onJobSelect(job.id)}
                        onMouseEnter={(e) => {
                          setHoveredJobId(job.id);
                          setTooltip({
                            title: job.name,
                            description: `${job.courseCount} courses · ${job.lessonCount} lessons · ${job.skillCount} skills`,
                            x: e.clientX,
                            y: e.clientY,
                          });
                        }}
                        onMouseLeave={() => {
                          setHoveredJobId(null);
                          setTooltip(null);
                        }}
                      />
                    </div>
                  );
                }),
              )}

              {/* ── Course hover targets (L3) — triggers highlight ── */}
              {galaxyData.categories.map((cat) =>
                cat.jobs.map((job) =>
                  job.courses.map((course, ci) => (
                    <div
                      key={`course-hit-${job.id}-${ci}`}
                      className="absolute"
                      style={{
                        left: course.x - 10,
                        top: course.y - 10,
                        width: 20,
                        height: 20,
                      }}
                    >
                      <div
                        className="flex h-full w-full cursor-default items-center justify-center rounded-full transition-transform hover:scale-[2]"
                        onMouseEnter={(e) => {
                          setHoveredCourseKey(`${job.id}-${ci}`);
                          setHoveredCourseJobId(job.id);
                          setTooltip({
                            title: course.title,
                            description: `${course.category} · Level ${course.sfiaLevel} · ${course.estimatedHours}h · ${course.lessonCount} lessons · ${course.skills.length} skills`,
                            x: e.clientX,
                            y: e.clientY,
                          });
                        }}
                        onMouseLeave={() => {
                          setHoveredCourseKey(null);
                          setHoveredCourseJobId(null);
                          setTooltip(null);
                        }}
                      />
                    </div>
                  )),
                ),
              )}

              {/* ── Skill hover targets ── */}
              {galaxyData.categories.map((cat) =>
                cat.jobs.map((job) =>
                  job.courses.map((course, ci) =>
                    course.skills.map((skill, si) => (
                      <div
                        key={`skill-hit-${job.id}-${ci}-${si}`}
                        className="absolute"
                        style={{
                          left: skill.x - 10,
                          top: skill.y - 10,
                          width: 20,
                          height: 20,
                        }}
                      >
                        <div
                          className="flex h-full w-full cursor-default items-center justify-center rounded-full transition-transform hover:scale-[2]"
                          onMouseEnter={(e) =>
                            setTooltip({
                              title: skill.name,
                              description: `Skill · from ${course.title}`,
                              x: e.clientX,
                              y: e.clientY,
                            })
                          }
                          onMouseLeave={() => setTooltip(null)}
                        />
                      </div>
                    )),
                  ),
                ),
              )}
            </div>
          </div>
        </div>

        {/* Minimap */}
        <GalaxyMinimap
          data={galaxyData}
          panX={panX}
          panY={panY}
          containerWidth={containerSize.w}
          containerHeight={containerSize.h}
        />
      </main>
    </div>
  );
}
