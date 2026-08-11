import { useEffect, useRef } from 'react';
// theme via prop

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  hue: number;
  reset: (init?: boolean) => void;
  update: () => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

export default function ParticleBackground({ theme }: { theme: 'dark' | 'light' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    let raf = 0;
    let running = true;

    const isDark = theme === 'dark';

    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
    }

    function makeParticle(): Particle {
      const p: Particle = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 1,
        alpha: 0.3,
        hue: 180,
        reset(init = false) {
          this.x = Math.random() * w;
          this.y = init ? Math.random() * h : h + 10;
          this.vy = -(0.12 + Math.random() * 0.4);
          this.vx = (Math.random() - 0.5) * 0.28;
          this.size = 0.5 + Math.random() * 1.7;
          this.alpha = 0.12 + Math.random() * 0.4;
          this.hue = Math.random() > 0.65 ? 190 : 175;
        },
        update() {
          this.x += this.vx;
          this.y += this.vy;
          if (this.y < -10 || this.x < -20 || this.x > w + 20) this.reset();
        },
        draw(c) {
          c.beginPath();
          c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          if (isDark) {
            c.fillStyle = `hsla(${this.hue}, 100%, 70%, ${this.alpha})`;
          } else {
            c.fillStyle = `hsla(${this.hue}, 70%, 40%, ${this.alpha * 0.7})`;
          }
          c.fill();
        },
      };
      p.reset(true);
      return p;
    }

    function init() {
      resize();
      const count = Math.min(90, Math.floor((w * h) / 18000));
      particles = Array.from({ length: count }, () => makeParticle());
    }

    function drawLinks() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx!.strokeStyle = isDark
              ? `rgba(95, 242, 255, ${0.07 * (1 - dist / 110)})`
              : `rgba(30, 120, 160, ${0.08 * (1 - dist / 110)})`;
            ctx!.lineWidth = 0.6;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }
    }

    function frame() {
      if (!running) return;
      ctx!.clearRect(0, 0, w, h);

      const gx = w * 0.7;
      const gy = h * 0.2;
      const g = ctx!.createRadialGradient(gx, gy, 0, gx, gy, w * 0.55);
      g.addColorStop(0, isDark ? 'rgba(95, 242, 255, 0.04)' : 'rgba(40, 140, 180, 0.05)');
      g.addColorStop(1, 'transparent');
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, w, h);

      particles.forEach((p) => {
        p.update();
        p.draw(ctx!);
      });
      drawLinks();
      raf = requestAnimationFrame(frame);
    }

    init();
    frame();
    window.addEventListener('resize', resize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [theme]);

  return <canvas id="bg-canvas" ref={canvasRef} aria-hidden />;
}
