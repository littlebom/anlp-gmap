import { useMemo, useState, useRef, useEffect } from 'react';
import type { GalaxyData, GalaxySearchResult } from './galaxyTypes';

interface GalaxySidebarProps {
  data: GalaxyData | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchClear: () => void;
  onCategoryClick: (catId: string) => void;
  onSearchSelect: (result: GalaxySearchResult) => void;
}

const MAX_RESULTS = 10;

export function GalaxySidebar({
  data,
  searchQuery,
  onSearchChange,
  onSearchClear,
  onCategoryClick,
  onSearchSelect,
}: GalaxySidebarProps) {
  const stats = data?.stats;
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build search index from all levels
  const searchIndex = useMemo<GalaxySearchResult[]>(() => {
    if (!data) return [];
    const results: GalaxySearchResult[] = [];
    for (const cat of data.categories) {
      for (const job of cat.jobs) {
        results.push({
          type: 'job',
          label: job.name,
          catId: cat.id,
          jobId: job.id,
          x: job.x,
          y: job.y,
          color: cat.color,
        });
        for (let ci = 0; ci < job.courses.length; ci++) {
          const course = job.courses[ci];
          results.push({
            type: 'course',
            label: course.title,
            catId: cat.id,
            jobId: job.id,
            courseKey: `${job.id}-${ci}`,
            x: course.x,
            y: course.y,
            color: cat.color,
          });
          for (const skill of course.skills) {
            results.push({
              type: 'skill',
              label: skill.name,
              catId: cat.id,
              jobId: job.id,
              courseKey: `${job.id}-${ci}`,
              x: skill.x,
              y: skill.y,
              color: cat.color,
            });
          }
        }
      }
    }
    return results;
  }, [data]);

  // Filter results based on search query
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (q.length < 2) return [];
    return searchIndex
      .filter((r) => r.label.toLowerCase().includes(q))
      .slice(0, MAX_RESULTS);
  }, [searchQuery, searchIndex]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIdx(-1);
  }, [filtered]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: GalaxySearchResult) => {
    onSearchSelect(result);
    setShowDropdown(false);
    onSearchChange(result.label);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      e.preventDefault();
      handleSelect(filtered[selectedIdx]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const typeIcon = (type: GalaxySearchResult['type']) => {
    switch (type) {
      case 'job': return '⬡';
      case 'course': return '●';
      case 'skill': return '◻';
    }
  };

  const typeBadge = (type: GalaxySearchResult['type']) => {
    switch (type) {
      case 'job': return 'Job';
      case 'course': return 'Course';
      case 'skill': return 'Skill';
    }
  };

  return (
    <aside className="z-30 flex w-64 shrink-0 flex-col border-r border-slate-800 bg-[#0B1120]/80 backdrop-blur-xl">
      {/* Header */}
      <div className="flex h-12 items-center border-b border-slate-800/50 px-4">
        <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-sky-500 to-indigo-500 shadow shadow-sky-500/20">
          <span className="text-[10px]">🌌</span>
        </div>
        <span className="text-sm font-bold tracking-tight text-slate-200">
          Galaxy View
        </span>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pt-3">
        {/* Search with autocomplete */}
        <div className="relative" ref={dropdownRef}>
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
            🔍
          </span>
          <input
            ref={inputRef}
            type="text"
            placeholder="ค้นหา Job, Course, Skill..."
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-lg border border-slate-700/50 bg-slate-800/50 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-600 transition-colors focus:border-sky-500/50 focus:outline-none"
          />
          {searchQuery && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-300"
              onClick={() => {
                onSearchClear();
                setShowDropdown(false);
                inputRef.current?.focus();
              }}
            >
              ✕
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {showDropdown && filtered.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-slate-700/50 bg-slate-900/95 shadow-xl backdrop-blur-lg">
              {filtered.map((result, i) => (
                <button
                  key={`${result.type}-${result.label}-${result.jobId}-${i}`}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                    i === selectedIdx
                      ? 'bg-sky-500/20 text-white'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIdx(i)}
                >
                  {/* Node icon with category color */}
                  <span style={{ color: result.color }} className="text-[11px] leading-none">
                    {typeIcon(result.type)}
                  </span>
                  {/* Label */}
                  <span className="flex-1 truncate">{result.label}</span>
                  {/* Type badge */}
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium ${
                    result.type === 'job'
                      ? 'bg-sky-500/20 text-sky-400'
                      : result.type === 'course'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {typeBadge(result.type)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {showDropdown && searchQuery.length >= 2 && filtered.length === 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-slate-700/50 bg-slate-900/95 px-3 py-3 text-center text-[11px] text-slate-500 shadow-xl backdrop-blur-lg">
              ไม่พบผลลัพธ์
            </div>
          )}
        </div>

        {/* Category list */}
        <div>
          <h3 className="mb-2 px-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
            Categories ({data?.categories.length ?? 0})
          </h3>
          <ul className="space-y-1">
            {data?.categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => onCategoryClick(cat.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-all hover:bg-white/5"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: cat.color }}
                  />
                  <span className="flex-1 truncate text-left text-[11px] text-slate-300">
                    {cat.name}
                  </span>
                  <span className="font-mono text-[9px] text-slate-600">
                    {cat.jobs.length}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Stats */}
        {stats && (
          <div className="space-y-1.5 px-1">
            <h3 className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
              Statistics
            </h3>
            <StatRow label="Total Jobs" value={stats.totalJobs} />
            <StatRow label="Categories" value={stats.totalCategories} />
            <StatRow label="Total Courses" value={stats.totalCourses} />
            <StatRow label="Total Lessons" value={stats.totalLessons} />
            <StatRow
              label="Total Skills"
              value={stats.totalSkills}
              className="text-yellow-400"
            />
          </div>
        )}
      </nav>

      <div className="border-t border-slate-800/50 p-3 text-center text-[10px] text-slate-600">
        Drag to pan &bull; Click to explore
      </div>
    </aside>
  );
}

function StatRow({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="flex justify-between text-[11px]">
      <span className="text-slate-500">{label}</span>
      <span className={`font-bold ${className ?? 'text-slate-200'}`}>{value}</span>
    </div>
  );
}
