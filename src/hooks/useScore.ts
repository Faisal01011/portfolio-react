import { useCallback, useEffect, useRef, useState } from 'react';

export type AchievementId =
  | 'explorer'
  | 'deep_diver'
  | 'filter_master'
  | 'theme_hopper'
  | 'messenger'
  | 'surge'
  | 'buddy'
  | 'scout';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  points: number;
}

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  explorer: {
    id: 'explorer',
    title: 'Explorer',
    description: 'Opened your first project details',
    points: 50,
  },
  deep_diver: {
    id: 'deep_diver',
    title: 'Deep Diver',
    description: 'Inspected 3 different projects',
    points: 120,
  },
  filter_master: {
    id: 'filter_master',
    title: 'Filter Master',
    description: 'Tried every project filter',
    points: 80,
  },
  theme_hopper: {
    id: 'theme_hopper',
    title: 'Theme Hopper',
    description: 'Switched between light and dark mode',
    points: 40,
  },
  messenger: {
    id: 'messenger',
    title: 'Messenger',
    description: 'Sent a contact message',
    points: 150,
  },
  surge: {
    id: 'surge',
    title: 'SURGE',
    description: 'Discovered the Konami secret',
    points: 200,
  },
  buddy: {
    id: 'buddy',
    title: 'Wingman',
    description: 'Met your neon companion',
    points: 25,
  },
  scout: {
    id: 'scout',
    title: 'Scout',
    description: 'Companion scanned 4 projects',
    points: 100,
  },
};

const STORAGE_KEY = 'faisal-portfolio-score';

interface ScoreState {
  score: number;
  unlocked: AchievementId[];
  viewedProjects: string[];
  filtersUsed: string[];
  themeToggled: boolean;
  noticedProjects: string[];
  metBuddy: boolean;
}

function loadState(): ScoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ScoreState>;
      return {
        score: parsed.score ?? 0,
        unlocked: parsed.unlocked ?? [],
        viewedProjects: parsed.viewedProjects ?? [],
        filtersUsed: parsed.filtersUsed ?? [],
        themeToggled: parsed.themeToggled ?? false,
        noticedProjects: parsed.noticedProjects ?? [],
        metBuddy: parsed.metBuddy ?? false,
      };
    }
  } catch {
    /* ignore */
  }
  return {
    score: 0,
    unlocked: [],
    viewedProjects: [],
    filtersUsed: [],
    themeToggled: false,
    noticedProjects: [],
    metBuddy: false,
  };
}

export function useScore() {
  const [state, setState] = useState<ScoreState>(loadState);
  const [lastAchievement, setLastAchievement] = useState<Achievement | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2400);
  }, []);

  const unlock = useCallback(
    (id: AchievementId) => {
      setState((prev) => {
        if (prev.unlocked.includes(id)) return prev;
        const ach = ACHIEVEMENTS[id];
        setLastAchievement(ach);
        showToast(`🏆 ${ach.title}  +${ach.points} XP`);
        return {
          ...prev,
          unlocked: [...prev.unlocked, id],
          score: prev.score + ach.points,
        };
      });
    },
    [showToast],
  );

  const addPoints = useCallback(
    (pts: number, reason?: string) => {
      setState((prev) => ({ ...prev, score: prev.score + pts }));
      if (reason) showToast(`+${pts} XP · ${reason}`);
    },
    [showToast],
  );

  const viewProject = useCallback(
    (projectId: string) => {
      setState((prev) => {
        if (prev.viewedProjects.includes(projectId)) return prev;
        const nextViewed = [...prev.viewedProjects, projectId];
        const next = { ...prev, viewedProjects: nextViewed, score: prev.score + 15 };

        queueMicrotask(() => {
          if (nextViewed.length === 1) unlock('explorer');
          if (nextViewed.length >= 3) unlock('deep_diver');
        });

        return next;
      });
    },
    [unlock],
  );

  /** Companion scanned a project card (hover) */
  const noticeProject = useCallback(
    (projectId: string, projectName: string) => {
      let isNew = false;
      setState((prev) => {
        if (prev.noticedProjects.includes(projectId)) return prev;
        isNew = true;
        const nextNoticed = [...prev.noticedProjects, projectId];
        const next = {
          ...prev,
          noticedProjects: nextNoticed,
          score: prev.score + 8,
        };
        queueMicrotask(() => {
          if (nextNoticed.length >= 4) unlock('scout');
        });
        return next;
      });
      if (isNew) {
        // Toast is optional; companion bubble will speak instead
        void projectName;
      }
      return isNew;
    },
    [unlock],
  );

  const meetBuddy = useCallback(() => {
    setState((prev) => {
      if (prev.metBuddy) return prev;
      queueMicrotask(() => unlock('buddy'));
      return { ...prev, metBuddy: true };
    });
  }, [unlock]);

  const useFilter = useCallback(
    (filter: string) => {
      setState((prev) => {
        if (prev.filtersUsed.includes(filter) || filter === 'all') return prev;
        const nextFilters = [...prev.filtersUsed, filter];
        const next = { ...prev, filtersUsed: nextFilters, score: prev.score + 10 };
        if (nextFilters.length >= 5) {
          queueMicrotask(() => unlock('filter_master'));
        }
        return next;
      });
    },
    [unlock],
  );

  const markThemeToggle = useCallback(() => {
    setState((prev) => {
      if (prev.themeToggled) return prev;
      queueMicrotask(() => unlock('theme_hopper'));
      return { ...prev, themeToggled: true };
    });
  }, [unlock]);

  const markContactSent = useCallback(() => {
    unlock('messenger');
  }, [unlock]);

  const markSurge = useCallback(() => {
    unlock('surge');
  }, [unlock]);

  return {
    score: state.score,
    unlocked: state.unlocked,
    lastAchievement,
    toastMsg,
    showToast,
    addPoints,
    viewProject,
    noticeProject,
    meetBuddy,
    useFilter,
    markThemeToggle,
    markContactSent,
    markSurge,
  };
}
