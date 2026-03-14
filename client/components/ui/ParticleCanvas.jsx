'use client';
import { useEffect, useRef } from 'react';

export default function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const N = 80;
    let W, H;
    let mouse = { x: -9999, y: -9999 };
    let particles = [];
    let animId;

    function isDark() {
      return document.documentElement.classList.contains('dark');
    }

    function getColors() {
      return isDark()
        ? [{ r: 14, g: 116, b: 144 }, { r: 30, g: 58, b: 138 }]
        : [{ r: 195, g: 176, b: 145 }, { r: 210, g: 196, b: 168 }];
    }

    function resize() {
      const parent = canvas.parentElement;
      W = canvas.width = parent?.offsetWidth || window.innerWidth;
      H = canvas.height = parent?.offsetHeight || window.innerHeight;
    }

    function mkP() {
      const cols = getColors();
      const c = cols[Math.random() < 0.65 ? 0 : 1];
      return {
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: 0.8 + Math.random() * 1.2, alpha: 0.38 + Math.random() * 0.42,
        pulse: Math.random() * Math.PI * 2, pulseSpeed: 0.012 + Math.random() * 0.018,
        cr: c.r, cg: c.g, cb: c.b,
      };
    }

    function init() {
      resize();
      particles = Array.from({ length: N }, mkP);
    }

    const AR = 165, AS = 0.022, RR = 50, RS = 0.09, MS = 3.2, FR = 0.92, LD = 115;

    function tick() {
      ctx.clearRect(0, 0, W, H);
      const dark = isDark();
      const targetCols = dark
        ? [{ r: 14, g: 116, b: 144 }, { r: 30, g: 58, b: 138 }]
        : [{ r: 195, g: 176, b: 145 }, { r: 210, g: 196, b: 168 }];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.pulse += p.pulseSpeed;
        const t = i % 2 === 0 ? 0 : 1;
        p.cr += (targetCols[t].r - p.cr) * 0.04;
        p.cg += (targetCols[t].g - p.cg) * 0.04;
        p.cb += (targetCols[t].b - p.cb) * 0.04;

        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < RR) {
          p.vx -= (dx / dist) * RS * (1 - dist / RR);
          p.vy -= (dy / dist) * RS * (1 - dist / RR);
        } else if (dist < AR) {
          const pull = AS * (1 - dist / AR);
          p.vx += (dx / dist) * pull;
          p.vy += (dy / dist) * pull;
        }
        p.vx *= FR;
        p.vy *= FR;
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > MS) { p.vx = (p.vx / spd) * MS; p.vy = (p.vy / spd) * MS; }
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        const glow = 0.5 + 0.5 * Math.sin(p.pulse);
        const near = dist < AR ? (1 - dist / AR) : 0;
        const fa = Math.min(1, p.alpha * (0.6 + 0.4 * glow) + near * 0.5);
        const fr = p.r * (1 + near * 0.8);
        ctx.beginPath();
        ctx.arc(p.x, p.y, fr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.round(p.cr)},${Math.round(p.cg)},${Math.round(p.cb)},${fa})`;
        ctx.fill();
      }

      // Lines between particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < LD) {
            const alpha = (1 - d / LD) * 0.18;
            const mr = Math.round((a.cr + b.cr) / 2);
            const mg = Math.round((a.cg + b.cg) / 2);
            const mb = Math.round((a.cb + b.cb) / 2);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${mr},${mg},${mb},${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Mouse lines
      if (mouse.x > 0) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < AR) {
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = `rgba(${Math.round(p.cr)},${Math.round(p.cg)},${Math.round(p.cb)},${(1 - d / AR) * 0.28})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = dark ? 'rgba(56,189,248,0.9)' : 'rgba(14,165,233,0.7)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 20, 0, Math.PI * 2);
        ctx.strokeStyle = dark ? 'rgba(56,189,248,0.25)' : 'rgba(180,180,180,0.45)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      animId = requestAnimationFrame(tick);
    }

    const handleMouseMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const handleMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    canvas.parentElement?.addEventListener('mousemove', handleMouseMove);
    canvas.parentElement?.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', resize);

    init();
    tick();

    return () => {
      cancelAnimationFrame(animId);
      canvas.parentElement?.removeEventListener('mousemove', handleMouseMove);
      canvas.parentElement?.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} id="bg" className="absolute inset-0 w-full h-full z-0" />;
}
