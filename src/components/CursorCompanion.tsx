import { useEffect, useRef, useState } from 'react';

interface CursorCompanionProps {
  theme: 'dark' | 'light';
  onNoticeProject?: (id: string, name: string) => boolean | void;
  onMeet?: () => void;
}

type Mood = 'idle' | 'happy' | 'curious' | 'excited' | 'wink';

const IDLE_LINES = [
  'Systems online.',
  'Ready when you are.',
  'Scanning the hangar…',
  'Nice trajectory.',
  'I see pixels.',
];

const HOVER_LINES: Record<string, string[]> = {
  card: ['Ooh, a build!', 'This one looks spicy.', 'Shall we peek?', 'Project lock acquired.'],
  link: ['Outbound vector set.', 'Click if you dare.', 'Hyperlink engaged.'],
  button: ['Affirmative.', 'Button. Tempting.', 'Press me?'],
  filter: ['Sorting the archive…', 'Filter engaged.', 'Narrowing the field.'],
  skill: ['Stack check ✓', 'Familiar tech.', 'Nice toolkit.'],
  input: ['Listening…', 'Type away, pilot.', 'Input channel open.'],
  contact: ['Message protocol ready.', 'Say hello!', 'Transmission window open.'],
  theme: ['Mood lighting?', 'Dark or light — your call.'],
  default: ['Interesting…', 'Hmm.', 'Noted.'],
};

const PROJECT_LINES = [
  (n: string) => `Scanned: ${n}`,
  (n: string) => `${n} — looks solid.`,
  (n: string) => `+XP · noticed ${n}`,
  (n: string) => `Logging ${n}…`,
];

const GREET_LINES = [
  'Hey pilot 👋',
  'Wingman online.',
  "I'll stick with you.",
];

/**
 * Neon pilot-drone companion: face, chat bubbles, XP on project scans.
 */
export default function CursorCompanion({
  theme,
  onNoticeProject,
  onMeet,
}: CursorCompanionProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mouse = useRef({ x: -100, y: -100 });
  const pos = useRef({ x: -100, y: -100 });
  const vel = useRef({ x: 0, y: 0 });
  const trail = useRef<{ x: number; y: number }[]>(
    Array.from({ length: 6 }, () => ({ x: -100, y: -100 })),
  );
  const hovering = useRef(false);
  const raf = useRef(0);
  const reducedMotion = useRef(false);
  const lastBubbleAt = useRef(0);
  const lastIdleAt = useRef(0);
  const noticedSet = useRef(new Set<string>());
  const metRef = useRef(false);
  const bubbleTimer = useRef<number | null>(null);

  const [bubble, setBubble] = useState<string | null>(null);
  const [mood, setMood] = useState<Mood>('idle');
  const [visible, setVisible] = useState(false);

  const speak = (text: string, nextMood: Mood = 'happy', holdMs = 2200) => {
    const now = Date.now();
    // Don't spam bubbles
    if (now - lastBubbleAt.current < 900 && bubble) return;
    lastBubbleAt.current = now;
    setBubble(text);
    setMood(nextMood);
    if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => {
      setBubble(null);
      setMood('idle');
    }, holdMs);
  };

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (fine && !reducedMotion.current) {
      document.documentElement.classList.add('has-companion');
      setVisible(true);
    }

    const classify = (el: Element | null): { kind: string; projectId?: string; projectName?: string } => {
      if (!el) return { kind: 'default' };
      const card = el.closest('.card');
      if (card) {
        const h3 = card.querySelector('h3');
        const name = h3?.textContent?.trim() || 'project';
        // derive id from heading or data attr if present
        const id =
          (card as HTMLElement).dataset.id ||
          name.toLowerCase().replace(/\s+/g, '-');
        return { kind: 'card', projectId: id, projectName: name };
      }
      if (el.closest('#contact, .contact-form, .contact-box')) return { kind: 'contact' };
      if (el.closest('.theme-toggle')) return { kind: 'theme' };
      if (el.closest('.filter-btn')) return { kind: 'filter' };
      if (el.closest('.skill')) return { kind: 'skill' };
      if (el.closest('input, textarea')) return { kind: 'input' };
      if (el.closest('button')) return { kind: 'button' };
      if (el.closest('a')) return { kind: 'link' };
      return { kind: 'default' };
    };

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;

      // First movement → meet buddy
      if (!metRef.current) {
        metRef.current = true;
        onMeet?.();
        window.setTimeout(() => {
          speak(GREET_LINES[Math.floor(Math.random() * GREET_LINES.length)], 'excited', 2600);
        }, 400);
      }

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const info = classify(el);
      const interactive = info.kind !== 'default' || !!el?.closest('a, button, input, textarea, select, [role="button"]');
      hovering.current = interactive;

      if (coreRef.current) {
        coreRef.current.classList.toggle('is-hover', interactive);
        coreRef.current.dataset.mood = mood;
      }

      // Notice project cards → XP + bubble
      if (info.kind === 'card' && info.projectId && info.projectName) {
        if (!noticedSet.current.has(info.projectId)) {
          noticedSet.current.add(info.projectId);
          const isNew = onNoticeProject?.(info.projectId, info.projectName);
          const lineFn = PROJECT_LINES[Math.floor(Math.random() * PROJECT_LINES.length)];
          speak(lineFn(info.projectName), 'curious', 2400);
          if (isNew === false) {
            // already noticed before (persisted) — still react mildly
          }
        }
      } else if (interactive && Date.now() - lastBubbleAt.current > 3500) {
        const pool = HOVER_LINES[info.kind] || HOVER_LINES.default;
        speak(pool[Math.floor(Math.random() * pool.length)], info.kind === 'contact' ? 'excited' : 'happy', 1800);
      }
    };

    const onLeave = () => {
      mouse.current.x = -200;
      mouse.current.y = -200;
      hovering.current = false;
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      const mx = mouse.current.x;
      const my = mouse.current.y;
      const ease = hovering.current ? 0.22 : 0.14;
      pos.current.x = lerp(pos.current.x, mx, ease);
      pos.current.y = lerp(pos.current.y, my, ease);
      vel.current.x = mx - pos.current.x;
      vel.current.y = my - pos.current.y;
      const speed = Math.min(Math.hypot(vel.current.x, vel.current.y), 40);

      trail.current[0].x = lerp(trail.current[0].x, pos.current.x, 0.35);
      trail.current[0].y = lerp(trail.current[0].y, pos.current.y, 0.35);
      for (let i = 1; i < trail.current.length; i++) {
        trail.current[i].x = lerp(trail.current[i].x, trail.current[i - 1].x, 0.28);
        trail.current[i].y = lerp(trail.current[i].y, trail.current[i - 1].y, 0.28);
      }

      const root = rootRef.current;
      if (root) {
        const ox = hovering.current ? 20 : 16;
        const oy = hovering.current ? -10 : -6;
        root.style.transform = `translate3d(${pos.current.x + ox}px, ${pos.current.y + oy}px, 0)`;
        const tilt = Math.max(-18, Math.min(18, vel.current.x * 0.4));
        if (coreRef.current) {
          coreRef.current.style.transform = `rotate(${tilt}deg) scale(${hovering.current ? 1.18 : 1})`;
          coreRef.current.style.setProperty('--pulse', String(0.45 + speed / 80));
        }
      }

      trailRefs.current.forEach((node, i) => {
        if (!node) return;
        const t = trail.current[i];
        const scale = 1 - i * 0.12;
        const opacity = 0.55 - i * 0.08;
        node.style.transform = `translate3d(${t.x}px, ${t.y}px, 0) scale(${scale})`;
        node.style.opacity = String(Math.max(0, opacity));
      });

      // Occasional idle chatter when still
      const now = Date.now();
      if (
        speed < 2 &&
        metRef.current &&
        !bubble &&
        now - lastIdleAt.current > 9000 &&
        now - lastBubbleAt.current > 5000
      ) {
        lastIdleAt.current = now;
        speak(IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)], 'idle', 2000);
      }

      raf.current = requestAnimationFrame(tick);
    };

    if (!reducedMotion.current) {
      raf.current = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.documentElement.classList.remove('has-companion');
      if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, onNoticeProject, onMeet]);

  // Sync mood class on core
  useEffect(() => {
    if (coreRef.current) coreRef.current.dataset.mood = mood;
  }, [mood]);

  if (!visible) return null;

  return (
    <div className="companion-layer" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="companion-trail"
          ref={(el) => {
            trailRefs.current[i] = el;
          }}
        />
      ))}

      <div className="companion" ref={rootRef}>
        {/* Chat bubble */}
        {bubble && (
          <div className={`companion-bubble ${mood}`}>
            <span>{bubble}</span>
          </div>
        )}

        <div className="companion-core" ref={coreRef} data-mood={mood}>
          <div className="companion-ring" />
          {/* Face */}
          <div className="companion-face">
            <span className="eye left" />
            <span className="eye right" />
            <span className="mouth" />
          </div>
          <div className="companion-wing left" />
          <div className="companion-wing right" />
          <div className="companion-spark" />
        </div>
      </div>
    </div>
  );
}
