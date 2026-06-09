"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  baseR: number;
  baseOpacity: number;
  color: [number, number, number];
  twinkleSpeed: number;
  phase: number;
  driftX: number;
  driftY: number;
  flashTimer: number;
  flashDuration: number;
  flashPeak: number;
  flashing: boolean;
  spikeAngle: number;
};

type Meteor = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  speed: number;
  thickness: number;
  life: number;
  maxLife: number;
};

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function noise1D(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}

function fbm(x: number, octaves: number) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;

  for (let index = 0; index < octaves; index += 1) {
    value += amplitude * noise1D(x * frequency);
    amplitude *= 0.5;
    frequency *= 2.1;
  }

  return value;
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, style: string | CanvasGradient) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = style;
  ctx.fill();
}

function milkyPath(t: number, width: number, height: number): [number, number] {
  const x = -width * 0.1 + width * 1.2 * t;
  const wobble = fbm(t * 8, 4) * height * 0.06 - height * 0.03;
  const curve = Math.sin(t * Math.PI * 1.1) * height * 0.1;
  const y = height * 0.9 - height * 0.95 * t + curve + wobble;
  return [x, y];
}

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotionQuery.matches) {
      const staticCanvas = canvas;
      const staticCtx = ctx;

      function drawStaticBackground() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = window.innerWidth;
        const height = window.innerHeight;
        staticCanvas.width = Math.floor(width * dpr);
        staticCanvas.height = Math.floor(height * dpr);
        staticCanvas.style.width = `${width}px`;
        staticCanvas.style.height = `${height}px`;
        staticCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const background = staticCtx.createLinearGradient(0, 0, 0, height);
        background.addColorStop(0, "#050510");
        background.addColorStop(1, "#071426");
        staticCtx.fillStyle = background;
        staticCtx.fillRect(0, 0, width, height);

        for (let index = 0; index < Math.floor((width * height) / 14000); index += 1) {
          const x = hash(index * 11.7) * width;
          const y = hash(index * 23.3) * height;
          const radius = hash(index * 5.1) * 1.1 + 0.25;
          const alpha = hash(index * 9.2) * 0.42 + 0.2;
          dot(staticCtx, x, y, radius, `rgba(220,240,255,${alpha})`);
        }
      }

      drawStaticBackground();
      window.addEventListener("resize", drawStaticBackground);

      return () => {
        window.removeEventListener("resize", drawStaticBackground);
      };
    }

    const milkyCanvas = document.createElement("canvas");
    const milkyCtx = milkyCanvas.getContext("2d") as CanvasRenderingContext2D;
    const glowCanvas = document.createElement("canvas");
    const glowCtx = glowCanvas.getContext("2d") as CanvasRenderingContext2D;
    const detailCanvas = document.createElement("canvas");
    const detailCtx = detailCanvas.getContext("2d") as CanvasRenderingContext2D;
    if (!milkyCtx || !glowCtx || !detailCtx) return;

    const canvasEl: HTMLCanvasElement = canvas;
    const renderCtx: CanvasRenderingContext2D = ctx;
    const milkyRenderCtx: CanvasRenderingContext2D = milkyCtx;
    const glowRenderCtx: CanvasRenderingContext2D = glowCtx;
    const detailRenderCtx: CanvasRenderingContext2D = detailCtx;

    const pad = 90;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrame = 0;
    let stars: Star[] = [];
    let meteors: Meteor[] = [];
    let milkyOffset = 0;

    function createStars() {
      const density = 0.00012;
      const count = Math.floor(width * height * density);

      stars = Array.from({ length: count }, () => {
        const type = Math.random();
        let baseR = 0;
        let color: [number, number, number] = [255, 255, 255];
        let twinkleSpeed = 0;

        if (type < 0.62) {
          baseR = Math.random() * 0.8 + 0.2;
          color = [255, 255, 255];
          twinkleSpeed = Math.random() * 0.003 + 0.0012;
        } else if (type < 0.86) {
          baseR = Math.random() * 1 + 0.5;
          color = [180, 220, 255];
          twinkleSpeed = Math.random() * 0.004 + 0.0015;
        } else {
          baseR = Math.random() * 1.3 + 0.8;
          color = [56, 249, 215];
          twinkleSpeed = Math.random() * 0.004 + 0.0015;
        }

        return {
          x: Math.random() * width,
          y: Math.random() * height,
          baseR,
          baseOpacity: Math.random() * 0.5 + 0.22,
          color,
          twinkleSpeed,
          phase: Math.random() * Math.PI * 2,
          driftX: (Math.random() - 0.5) * 0.22,
          driftY: (Math.random() - 0.5) * 0.12,
          flashTimer: 0,
          flashDuration: 0,
          flashPeak: 0,
          flashing: false,
          spikeAngle: Math.random() * Math.PI * 0.5
        };
      });
    }

    function drawMilkyWay() {
      const w = milkyCanvas.width;
      const h = milkyCanvas.height;
      const steps = 1000;

      milkyCtx.clearRect(0, 0, w, h);
      glowCanvas.width = w;
      glowCanvas.height = h;
      detailCanvas.width = w;
      detailCanvas.height = h;
      glowCtx.clearRect(0, 0, w, h);
      detailCtx.clearRect(0, 0, w, h);

      for (let i = 0; i < steps; i += 1) {
        const t = i / steps;
        const [cx, cy] = milkyPath(t, w, h);
        const intensity = Math.pow(Math.sin(t * Math.PI), 0.54);
        const bandWidth = (150 + intensity * 150) * (0.72 + fbm(t * 5 + 10, 3) * 0.55);

        for (let j = 0; j < 5; j += 1) {
          const seed = i * 40 + j;
          const angle = hash(seed) * Math.PI * 2;
          const dist = Math.pow(hash(seed + 2000), 0.42) * bandWidth;
          const px = cx + Math.cos(angle) * dist;
          const py = cy + Math.sin(angle) * dist * 0.45;
          const size = hash(seed + 4000) * 12 + 6;
          const falloff = 1 - dist / bandWidth;
          const alpha = falloff * falloff * 0.04 * intensity;
          const roll = hash(seed + 6000);
          const color = roll < 0.44 ? [65, 100, 180] : roll < 0.74 ? [82, 80, 160] : [45, 92, 150];

          dot(glowCtx, px, py, size, `rgba(${color[0]},${color[1]},${color[2]},${alpha})`);
        }
      }

      for (let i = 0; i < steps; i += 1) {
        const t = i / steps;
        const [cx, cy] = milkyPath(t, w, h);
        const intensity = Math.pow(Math.sin(t * Math.PI), 0.72);
        const densityNoise = fbm(t * 12, 4);
        const coreWidth = (70 + intensity * 82) * (0.62 + densityNoise * 0.8);

        for (let j = 0; j < 28; j += 1) {
          const seed = i * 120 + j + 20000;
          const angle = hash(seed) * Math.PI * 2;
          const dist = Math.pow(hash(seed + 1000), 0.65) * coreWidth;
          const px = cx + Math.cos(angle) * dist;
          const py = cy + Math.sin(angle) * dist * 0.4;
          const distRatio = dist / coreWidth;
          const size = hash(seed + 3000) * 1.8 + 0.22;
          const alpha = Math.pow(1 - distRatio, 1.2) * 0.12 * intensity * (0.5 + densityNoise * 0.5);
          const temp = hash(seed + 5000);
          let color: [number, number, number];

          if (distRatio < 0.3) {
            color = temp < 0.42 ? [255, 242, 225] : [245, 246, 255];
          } else if (distRatio < 0.62) {
            color = temp < 0.52 ? [205, 222, 255] : [218, 205, 245];
          } else {
            color = temp < 0.5 ? [150, 176, 240] : [120, 158, 215];
          }

          dot(detailCtx, px, py, size, `rgba(${color[0]},${color[1]},${color[2]},${alpha})`);
        }
      }

      for (let i = 0; i < steps; i += 1) {
        const t = i / steps;
        const [cx, cy] = milkyPath(t, w, h);
        const intensity = Math.pow(Math.sin(t * Math.PI), 1.5);
        const spineNoise = fbm(t * 15 + 5, 3);
        const spineWidth = (12 + intensity * 18) * (0.5 + spineNoise * 0.5);

        for (let j = 0; j < 8; j += 1) {
          const seed = i * 50 + j + 60000;
          const angle = hash(seed) * Math.PI * 2;
          const dist = Math.pow(hash(seed + 700), 1.5) * spineWidth;
          const px = cx + Math.cos(angle) * dist;
          const py = cy + Math.sin(angle) * dist * 0.35;
          const size = hash(seed + 800) * 0.9 + 0.2;
          const alpha = Math.pow(1 - dist / spineWidth, 1.5) * 0.19 * intensity * (0.6 + spineNoise * 0.4);

          dot(detailCtx, px, py, size, `rgba(245,240,255,${alpha})`);
        }
      }

      detailCtx.globalCompositeOperation = "destination-out";
      for (let i = 0; i < steps; i += 1) {
        const t = i / steps;
        const density = fbm(t * 10 + 3.7, 4);
        if (density <= 0.45) continue;

        const [cx, cy] = milkyPath(t, w, h);
        const intensity = Math.sin(t * Math.PI);
        const offset = (fbm(t * 20, 3) - 0.5) * 30;
        const size = (density - 0.45) * 80 + 3;
        const alpha = intensity * (density - 0.45) * 0.78;

        dot(detailCtx, cx + offset, cy + offset * 0.3, size, `rgba(0,0,0,${alpha})`);
      }
      detailCtx.globalCompositeOperation = "source-over";

      for (let i = 0; i < 300; i += 1) {
        const t = hash(i + 90000);
        const [cx, cy] = milkyPath(t, w, h);
        const intensity = Math.pow(Math.sin(t * Math.PI), 0.5);
        const spread = (30 + intensity * 40) * (0.5 + hash(i + 91000) * 0.5);
        const angle = hash(i + 92000) * Math.PI * 2;
        const dist = Math.pow(hash(i + 93000), 0.8) * spread;
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist * 0.4;
        const size = hash(i + 94000) * 1.5 + 0.5;
        const alpha = (1 - dist / spread) * intensity * 0.48;

        dot(detailCtx, px, py, size, `rgba(240,245,255,${alpha})`);
        if (size > 1.2) dot(detailCtx, px, py, size * 2.5, `rgba(200,220,255,${alpha * 0.08})`);
      }

      function blend(source: HTMLCanvasElement, alpha: number, blur: number) {
        milkyCtx.globalAlpha = alpha;
        milkyCtx.filter = `blur(${blur}px)`;
        milkyCtx.drawImage(source, 0, 0);
      }

      blend(glowCanvas, 0.42, 16);
      blend(glowCanvas, 0.45, 8);
      blend(detailCanvas, 0.52, 1.5);
      blend(detailCanvas, 0.25, 5);
      milkyCtx.filter = "none";
      milkyCtx.globalAlpha = 1;
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvasEl.width = Math.floor(width * dpr);
      canvasEl.height = Math.floor(height * dpr);
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      milkyCanvas.width = width + pad * 2;
      milkyCanvas.height = height + pad * 2;
      drawMilkyWay();
      createStars();
    }

    function spawnMeteor() {
      if (meteors.length >= 5) return;

      const len = 70 + Math.random() * 210;
      const speed = 5 + Math.random() * 8;
      const edge = Math.floor(Math.random() * 4);
      let x = 0;
      let y = 0;

      if (edge === 0) {
        x = Math.random() * width;
        y = -len;
      } else if (edge === 1) {
        x = width + len;
        y = Math.random() * height;
      } else if (edge === 2) {
        x = Math.random() * width;
        y = height + len;
      } else {
        x = -len;
        y = Math.random() * height;
      }

      const targetX = width * (0.18 + Math.random() * 0.64);
      const targetY = height * (0.18 + Math.random() * 0.64);
      const dx = targetX - x;
      const dy = targetY - y;
      const distance = Math.hypot(dx, dy) || 1;
      const vx = dx / distance;
      const vy = dy / distance;
      const maxLife = Math.ceil((Math.hypot(width, height) + len * 2) / speed);

      meteors.push({
        x,
        y,
        vx,
        vy,
        len,
        speed,
        thickness: 0.4 + Math.random() * 1.1,
        life: 0,
        maxLife
      });
    }

    function drawMeteors() {
      if (Math.random() < 0.012) spawnMeteor();
      meteors = meteors.filter((meteor) => meteor.life < meteor.maxLife);

      for (const meteor of meteors) {
        meteor.life += 1;
        meteor.x += meteor.vx * meteor.speed;
        meteor.y += meteor.vy * meteor.speed;

        const fadeIn = Math.min(meteor.life / 8, 1);
        const fadeOut = Math.max(1 - (meteor.life - meteor.maxLife + 16) / 16, 0);
        const opacity = fadeIn * fadeOut;
        const tailX = meteor.x - meteor.vx * meteor.len;
        const tailY = meteor.y - meteor.vy * meteor.len;
        const gradient = ctx.createLinearGradient(tailX, tailY, meteor.x, meteor.y);

        gradient.addColorStop(0, "rgba(255,255,255,0)");
        gradient.addColorStop(0.7, `rgba(180,220,255,${opacity * 0.42})`);
        gradient.addColorStop(1, `rgba(255,255,255,${opacity * 0.9})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(meteor.x, meteor.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = meteor.thickness;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }

    function drawStars() {
      ctx.clearRect(0, 0, width, height);

      const background = ctx.createLinearGradient(0, 0, 0, height);
      background.addColorStop(0, "#050510");
      background.addColorStop(1, "#071426");
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);

      milkyOffset += 0.11;
      const milkyX = Math.sin(milkyOffset * 0.004) * 54 - pad;
      const milkyY = Math.cos(milkyOffset * 0.003) * 28 - pad;
      ctx.drawImage(milkyCanvas, milkyX, milkyY);

      const time = Date.now() * 0.001;
      for (const star of stars) {
        star.x += star.driftX;
        star.y += star.driftY;

        if (star.x < -10) star.x = width + 10;
        if (star.x > width + 10) star.x = -10;
        if (star.y < -10) star.y = height + 10;
        if (star.y > height + 10) star.y = -10;

        let opacity = star.baseOpacity * (0.55 + 0.45 * Math.sin(time * star.twinkleSpeed * 60 + star.phase));
        let radius = star.baseR;
        let flash = 0;

        if (star.flashing) {
          star.flashTimer += 1;
          const progress = star.flashTimer / star.flashDuration;
          flash = Math.sin(progress * Math.PI) * star.flashPeak;
          opacity = Math.min(1, opacity + flash * 0.75);
          radius = star.baseR * (1 + flash * 0.55);
          if (star.flashTimer >= star.flashDuration) {
            star.flashing = false;
          }
        } else if (Math.random() < 0.00032) {
          star.flashing = true;
          star.flashTimer = 0;
          star.flashDuration = 40 + Math.floor(Math.random() * 70);
          star.flashPeak = 0.18 + Math.random() * 0.72;
        }

        const [r, g, b] = star.color;
        dot(ctx, star.x, star.y, radius, `rgba(${r},${g},${b},${opacity})`);
        if (radius > 1.2) dot(ctx, star.x, star.y, radius * 3, `rgba(${r},${g},${b},${opacity * 0.08})`);

        if (star.flashing && flash > 0.15) {
          const spikeLen = radius * (3 + flash * 6);
          const spikeWidth = radius * (0.2 + flash * 0.25);
          const spikeAlpha = opacity * flash * 0.55;

          ctx.save();
          ctx.translate(star.x, star.y);
          ctx.rotate(star.spikeAngle);
          ctx.fillStyle = `rgba(${r},${g},${b},${spikeAlpha})`;

          for (let index = 0; index < 4; index += 1) {
            ctx.beginPath();
            ctx.moveTo(0, -spikeWidth);
            ctx.lineTo(spikeLen, 0);
            ctx.lineTo(0, spikeWidth);
            ctx.lineTo(-spikeLen, 0);
            ctx.closePath();
            ctx.fill();
            ctx.rotate(Math.PI / 4);
          }

          ctx.restore();
          const glowRadius = radius * (2.5 + flash * 4);
          const gradient = ctx.createRadialGradient(star.x, star.y, radius, star.x, star.y, glowRadius);
          gradient.addColorStop(0, `rgba(${r},${g},${b},${flash * 0.14})`);
          gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
          dot(ctx, star.x, star.y, glowRadius, gradient);
        }
      }

      drawMeteors();
      animationFrame = requestAnimationFrame(drawStars);
    }

    function onVisibilityChange() {
      if (document.hidden) {
        cancelAnimationFrame(animationFrame);
      } else {
        animationFrame = requestAnimationFrame(drawStars);
      }
    }

    resize();
    animationFrame = requestAnimationFrame(drawStars);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotionQuery.matches) return;

    function onMove(event: MouseEvent) {
      document.documentElement.style.setProperty("--mouse-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--mouse-y", `${event.clientY}px`);
      document.documentElement.classList.add("has-mouse");
    }

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="starfield" aria-hidden="true" />
      <div className="cursor-glow" aria-hidden="true" />
    </>
  );
}
