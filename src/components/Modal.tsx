import { useEffect } from 'react';
import type { Project } from '../data/projects';

interface ModalProps {
  project: Project | null;
  onClose: () => void;
}

export default function Modal({ project, onClose }: ModalProps) {
  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div className="modal-overlay open" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <h2 id="modal-title">
          {project.icon} {project.name}
        </h2>
        <div className="modal-tags">
          {project.tags.map((t) => (
            <span key={t} className={`tag ${t}`}>
              {t}
            </span>
          ))}
        </div>
        <p>{project.long}</p>
        <ul>
          {project.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
        <div className="modal-actions">
          {project.demo && (
            <a
              className="btn btn-primary"
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open live demo
            </a>
          )}
          <a
            className="btn btn-ghost"
            href={project.repo}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
