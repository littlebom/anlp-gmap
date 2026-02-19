'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { generatorApi } from '@/lib/api';

interface Lesson {
  title: string;
  titleTh: string;
  description: string;
}

interface Course {
  title: string;
  titleTh: string;
  description: string;
  category: string;
  sfiaLevel: number;
  estimatedHours: number;
  shareable: boolean;
  lessons: Lesson[];
}

interface Dependency {
  prerequisite: string;
  dependent: string;
}

export default function CuratorPage() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const [courses, setCourses] = useState<Course[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [publishResult, setPublishResult] = useState<{ jobId: string; courseCount: number; lessonCount: number } | null>(null);

  useEffect(() => {
    if (jobId) loadJob(jobId);
  }, [jobId]);

  const loadJob = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await generatorApi.getJob(id);
      if (res.data.status === 'PUBLISHED') {
        setIsPublished(true);
      }
      if (res.data.mapData) {
        setCourses(res.data.mapData.courses || []);
        setDependencies(res.data.mapData.dependencies || []);
        setJobTitle(res.data.mapData.jobTitle || res.data.jobTitle);
      }
    } catch {
      setSaveMessage('Failed to load job data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!jobId) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await generatorApi.curatorEdit(jobId, { courses, dependencies });
      setSaveMessage('Saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      setSaveMessage(err.response?.data?.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!jobId) return;
    if (!confirm('Publish this map to production? This will save all courses and lessons to the database. This action cannot be undone.')) return;

    setIsPublishing(true);
    setSaveMessage(null);
    try {
      // Save edits first
      await generatorApi.curatorEdit(jobId, { courses, dependencies });
      // Then publish
      const res = await generatorApi.publish(jobId);
      setIsPublished(true);
      setPublishResult(res.data);
      setSaveMessage('Published successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to publish';
      setSaveMessage(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  const updateCourse = useCallback((index: number, field: string, value: any) => {
    setCourses((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const updateLesson = useCallback((courseIndex: number, lessonIndex: number, field: string, value: string) => {
    setCourses((prev) => {
      const updated = [...prev];
      const lessons = [...updated[courseIndex].lessons];
      lessons[lessonIndex] = { ...lessons[lessonIndex], [field]: value };
      updated[courseIndex] = { ...updated[courseIndex], lessons };
      return updated;
    });
  }, []);

  const addLesson = (courseIndex: number) => {
    setCourses((prev) => {
      const updated = [...prev];
      updated[courseIndex] = {
        ...updated[courseIndex],
        lessons: [
          ...updated[courseIndex].lessons,
          { title: 'New Lesson', titleTh: '', description: '' },
        ],
      };
      return updated;
    });
  };

  const removeLesson = (courseIndex: number, lessonIndex: number) => {
    setCourses((prev) => {
      const updated = [...prev];
      const lessons = updated[courseIndex].lessons.filter((_, i) => i !== lessonIndex);
      updated[courseIndex] = { ...updated[courseIndex], lessons };
      return updated;
    });
  };

  const removeCourse = (index: number) => {
    const title = courses[index].title;
    setCourses((prev) => prev.filter((_, i) => i !== index));
    setDependencies((prev) =>
      prev.filter((d) => d.prerequisite !== title && d.dependent !== title),
    );
    if (selectedIndex === index) setSelectedIndex(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-gray-400">Loading curator data...</div>
      </div>
    );
  }

  if (!jobId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Curator Editor</h1>
        <p className="text-gray-400">
          No job selected. Generate a map first, then come back to edit it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Publish Success Banner */}
      {publishResult && (
        <div className="rounded-xl border border-purple-700/50 bg-purple-900/20 p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">&#10003;</span>
            <div>
              <h3 className="font-semibold text-purple-300">Map Published Successfully!</h3>
              <p className="text-sm text-purple-400">
                Created {publishResult.courseCount} courses and {publishResult.lessonCount} lessons in the database.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Curator Editor</h1>
          <p className="text-sm text-gray-400">
            {jobTitle} &middot; {courses.length} courses
            {isPublished && <span className="ml-2 rounded-full bg-purple-900/50 px-2 py-0.5 text-xs text-purple-300">Published</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && !publishResult && (
            <span className={`text-sm ${saveMessage.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
              {saveMessage}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || isPublished}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing || isPublished}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
          >
            {isPublishing ? 'Publishing...' : isPublished ? 'Published' : 'Publish to Production'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Course List */}
        <div className="col-span-1 space-y-2">
          <h2 className="mb-2 text-sm font-semibold text-gray-300">Courses</h2>
          {courses.map((course, i) => (
            <div
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`cursor-pointer rounded-lg border p-3 transition-all ${
                selectedIndex === i
                  ? 'border-blue-500 bg-blue-950/30'
                  : 'border-gray-800 bg-gray-900 hover:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="text-sm font-medium text-white">{course.title}</div>
                <span className="text-[10px] text-gray-500">L{course.sfiaLevel}</span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {course.category} &middot; {course.lessons.length} lessons
              </div>
            </div>
          ))}
        </div>

        {/* Course Editor */}
        <div className="col-span-2">
          {selectedIndex !== null && courses[selectedIndex] ? (
            <CourseEditor
              course={courses[selectedIndex]}
              index={selectedIndex}
              onUpdate={updateCourse}
              onUpdateLesson={updateLesson}
              onAddLesson={addLesson}
              onRemoveLesson={removeLesson}
              onRemoveCourse={removeCourse}
            />
          ) : (
            <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-gray-800 bg-gray-900">
              <p className="text-gray-500">Select a course to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CourseEditor({
  course,
  index,
  onUpdate,
  onUpdateLesson,
  onAddLesson,
  onRemoveLesson,
  onRemoveCourse,
}: {
  course: Course;
  index: number;
  onUpdate: (index: number, field: string, value: any) => void;
  onUpdateLesson: (courseIndex: number, lessonIndex: number, field: string, value: string) => void;
  onAddLesson: (courseIndex: number) => void;
  onRemoveLesson: (courseIndex: number, lessonIndex: number) => void;
  onRemoveCourse: (index: number) => void;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-gray-800 bg-gray-900 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Edit Course</h2>
        <button
          onClick={() => onRemoveCourse(index)}
          className="rounded bg-red-900/50 px-3 py-1 text-xs text-red-300 hover:bg-red-800/50"
        >
          Delete Course
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Title"
          value={course.title}
          onChange={(v) => onUpdate(index, 'title', v)}
        />
        <Field
          label="Title (Thai)"
          value={course.titleTh || ''}
          onChange={(v) => onUpdate(index, 'titleTh', v)}
        />
      </div>

      <Field
        label="Description"
        value={course.description}
        onChange={(v) => onUpdate(index, 'description', v)}
        multiline
      />

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-xs text-gray-400">Category</label>
          <select
            value={course.category}
            onChange={(e) => onUpdate(index, 'category', e.target.value)}
            className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
          >
            <option value="Technical">Technical</option>
            <option value="Soft">Soft</option>
            <option value="Tool">Tool</option>
          </select>
        </div>
        <Field
          label="SFIA Level (1-7)"
          value={String(course.sfiaLevel)}
          onChange={(v) => onUpdate(index, 'sfiaLevel', parseInt(v) || 1)}
          type="number"
        />
        <Field
          label="Hours"
          value={String(course.estimatedHours)}
          onChange={(v) => onUpdate(index, 'estimatedHours', parseInt(v) || 1)}
          type="number"
        />
      </div>

      {/* Lessons */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-300">
            Lessons ({course.lessons.length})
          </h3>
          <button
            onClick={() => onAddLesson(index)}
            className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500"
          >
            + Add Lesson
          </button>
        </div>
        <div className="space-y-2">
          {course.lessons.map((lesson, li) => (
            <div key={li} className="rounded border border-gray-800 bg-gray-800/50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <input
                    value={lesson.title}
                    onChange={(e) => onUpdateLesson(index, li, 'title', e.target.value)}
                    className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-white"
                    placeholder="Lesson title"
                  />
                  <input
                    value={lesson.description}
                    onChange={(e) => onUpdateLesson(index, li, 'description', e.target.value)}
                    className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-300"
                    placeholder="Description"
                  />
                </div>
                <button
                  onClick={() => onRemoveLesson(index, li)}
                  className="mt-1 text-xs text-red-400 hover:text-red-300"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-400">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
        />
      )}
    </div>
  );
}
