'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';

import { ImageUploadField } from '@/components/dashboard/image-upload-field';

interface Project {
  id: string;
  pageId: string;
  title: string;
  url: string;
  imageUrl: string | null;
  description: string;
  sortOrder: number | null;
  enabled: boolean | null;
}

function DragHandle() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="shrink-0"
    >
      <circle cx="5" cy="3" r="1.5" />
      <circle cx="11" cy="3" r="1.5" />
      <circle cx="5" cy="8" r="1.5" />
      <circle cx="11" cy="8" r="1.5" />
      <circle cx="5" cy="13" r="1.5" />
      <circle cx="11" cy="13" r="1.5" />
    </svg>
  );
}

function ProjectCard({
  project,
  onRemove,
  isOverlay,
}: {
  project: Project;
  onRemove: (id: string) => void;
  isOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isOverlay) {
    return (
      <div className="rounded-2xl border border-white/30 bg-karte-bg/90 p-5  backdrop-blur-xl">
        {project.imageUrl && (
          <div
            className="mb-4 h-40 w-full rounded-xl bg-cover bg-center"
            style={{ backgroundImage: `url(${project.imageUrl})` }}
          />
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-1 text-white/60 cursor-grabbing">
              <DragHandle />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-karte-text">
                {project.title}
              </p>
              <p className="break-all text-sm text-blue-300 sm:truncate">
                {project.url}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg border border-karte-border-emphasis px-3 py-1.5 text-sm text-red-400 transition sm:flex-none"
          >
            Remove
          </button>
        </div>
        <p className="mt-4 text-sm leading-6 text-karte-text-2">
          {project.description}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl bg-white/[0.025] p-5 transition hover:bg-white/[0.04] ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {project.imageUrl && (
        <div
          className="mb-4 h-40 w-full rounded-xl bg-cover bg-center"
          style={{ backgroundImage: `url(${project.imageUrl})` }}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            className="mt-1 text-white/30 hover:text-white/60 cursor-grab active:cursor-grabbing touch-none"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <DragHandle />
          </button>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-karte-text">
              {project.title}
            </p>
            <p className="break-all text-sm text-blue-300 sm:truncate">
              {project.url}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(project.id)}
          className="shrink-0 rounded-lg border border-karte-border-emphasis px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/10"
        >
          Remove
        </button>
      </div>

      <p className="mt-4 text-sm leading-6 text-karte-text-2">
        {project.description}
      </p>
    </div>
  );
}

export function ProjectEditor({
  pageId,
  initialProjects,
}: {
  pageId: string;
  initialProjects: Project[];
}) {
  const [projects, setProjects] = useState<Project[]>(
    [...initialProjects].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    ),
  );
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeProject = activeId
    ? projects.find((p) => p.id === activeId) ?? null
    : null;

  function normalizeProjects(items: Project[]) {
    return [...items].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );
  }

  async function persistOrder(nextProjects: Project[]) {
    const res = await fetch(`/api/pages/${pageId}/projects`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderedProjectIds: nextProjects.map((project) => project.id),
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to reorder projects');
    }

    setProjects(
      nextProjects.map((project, index) => ({
        ...project,
        sortOrder: index,
      })),
    );
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const previousProjects = [...projects];
    const nextProjects = arrayMove(projects, oldIndex, newIndex);
    setProjects(nextProjects);

    try {
      await persistOrder(nextProjects);
    } catch {
      setProjects(previousProjects);
      alert('Failed to reorder projects');
    }
  }

  async function addProject(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim() || !description.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          url,
          imageUrl: imageUrl.trim() || undefined,
          description,
        }),
      });

      if (!res.ok) throw new Error('Failed to add project');

      const newProject = await res.json();
      setProjects((prev) => normalizeProjects([...prev, newProject]));
      setTitle('');
      setUrl('');
      setImageUrl('');
      setDescription('');
    } catch {
      alert('Failed to add project');
    } finally {
      setLoading(false);
    }
  }

  async function removeProject(projectId: string) {
    try {
      const res = await fetch(`/api/pages/${pageId}/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete project');

      setProjects((prev) => prev.filter((project) => project.id !== projectId));
    } catch {
      alert('Failed to remove project');
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addProject} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Project title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg bg-white/[0.045] px-4 py-2.5 text-sm text-karte-text placeholder:text-karte-text-4 outline-none ring-1 ring-inset ring-transparent transition-all duration-200 ease-[var(--karte-ease)] hover:bg-white/[0.06] focus:bg-white/[0.06] focus:ring-karte-accent/35"
            required
          />
          <input
            type="url"
            placeholder="https://example.com/project"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="rounded-lg bg-white/[0.045] px-4 py-2.5 text-sm text-karte-text placeholder:text-karte-text-4 outline-none ring-1 ring-inset ring-transparent transition-all duration-200 ease-[var(--karte-ease)] hover:bg-white/[0.06] focus:bg-white/[0.06] focus:ring-karte-accent/35"
            required
          />
        </div>

        <ImageUploadField
          pageId={pageId}
          kind="project"
          label="Project Image"
          value={imageUrl}
          onChange={setImageUrl}
          onUploadingChange={setUploadingImage}
          placeholder="https://example.com/project.jpg"
          helpText="Upload a local screenshot or cover image, or paste a public URL."
        />

        <textarea
          rows={3}
          placeholder="What is this project? What should visitors know?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg bg-white/[0.045] px-4 py-3 text-sm text-karte-text placeholder:text-karte-text-4 outline-none ring-1 ring-inset ring-transparent transition-all duration-200 ease-[var(--karte-ease)] hover:bg-white/[0.06] focus:bg-white/[0.06] focus:ring-karte-accent/35"
          required
        />

        <button
          type="submit"
          disabled={loading || uploadingImage}
          className="w-full rounded-lg bg-white px-6 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-100 disabled:opacity-50 sm:w-auto"
        >
          {uploadingImage ? 'Uploading image...' : loading ? 'Adding...' : 'Add Project'}
        </button>
      </form>

      <hr className="border-karte-border" />

      {projects.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.02] p-8 text-center">
          <p className="text-karte-text-3">
            No projects yet. Add your first one above.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={projects.map((p) => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onRemove={removeProject}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeProject ? (
              <ProjectCard
                project={activeProject}
                onRemove={() => {}}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
