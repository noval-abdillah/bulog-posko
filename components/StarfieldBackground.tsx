/**
 * components/StarfieldBackground.tsx
 * Animasi 3D Starfield & Bintang Jatuh (Meteor Shower) berbasis Canvas HTML5.
 * Super ringan, 60FPS, dengan efek kedalaman Z-axis & paralaks interaktif.
 */
"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  pz: number;
  size: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export default function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        targetMouseX = e.touches[0].clientX;
        targetMouseY = e.touches[0].clientY;
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);

    // Inisialisasi 3D Stars
    const numStars = 400;
    const stars: Star[] = [];
    const colors = ["#FFFFFF", "#E2E8F0", "#38BDF8", "#60A5FA", "#93C5FD"];

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * width,
        pz: width,
        size: Math.random() * 1.5 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Inisialisasi Bintang Jatuh (Shooting Stars)
    const shootingStars: ShootingStar[] = [];

    const createShootingStar = () => {
      if (shootingStars.length < 3 && Math.random() < 0.03) {
        shootingStars.push({
          x: Math.random() * width * 0.8,
          y: Math.random() * height * 0.4,
          length: Math.random() * 80 + 50,
          speed: Math.random() * 10 + 12,
          angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2, // ~45 deg
          opacity: 1,
          life: 0,
          maxLife: Math.random() * 30 + 25,
        });
      }
    };

    const speed = 2.5;

    const render = () => {
      // Smoothing kursor mouse/touch
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const offsetX = (mouseX - width / 2) * 0.15;
      const offsetY = (mouseY - height / 2) * 0.15;

      // Deep Space background gradient
      const bgGrad = ctx.createRadialGradient(
        width / 2 + offsetX,
        height / 2 + offsetY,
        10,
        width / 2,
        height / 2,
        Math.max(width, height)
      );
      bgGrad.addColorStop(0, "#0F172A");
      bgGrad.addColorStop(0.5, "#07264B");
      bgGrad.addColorStop(1, "#020617");

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Render 3D Stars
      const cx = width / 2 + offsetX;
      const cy = height / 2 + offsetY;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        star.pz = star.z;
        star.z -= speed;

        if (star.z <= 0) {
          star.z = width;
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
          star.pz = star.z;
        }

        const k = 256 / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const pk = 256 / star.pz;
          const ppx = star.x * pk + cx;
          const ppy = star.y * pk + cy;

          const size = Math.max(0.5, (1 - star.z / width) * star.size * 2.5);
          const alpha = Math.min(1, Math.max(0.1, (1 - star.z / width) * 1.5));

          // Draw star streak (garis meluncur 3D)
          ctx.beginPath();
          ctx.moveTo(ppx, ppy);
          ctx.lineTo(px, py);
          ctx.strokeStyle = star.color;
          ctx.globalAlpha = alpha * 0.6;
          ctx.lineWidth = size * 0.8;
          ctx.stroke();

          // Draw star glow dot
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = alpha;
          ctx.shadowBlur = size * 3;
          ctx.shadowColor = star.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      ctx.globalAlpha = 1;

      // Render Shooting Stars (Bintang Jatuh)
      createShootingStar();

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];

        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.life++;

        const alpha = Math.max(0, 1 - ss.life / ss.maxLife);

        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;

        const starGrad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
        starGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        starGrad.addColorStop(0.3, `rgba(56, 189, 248, ${alpha * 0.8})`);
        starGrad.addColorStop(1, `rgba(56, 189, 248, 0)`);

        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = starGrad;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#38BDF8";
        ctx.stroke();
        ctx.shadowBlur = 0;

        if (ss.life >= ss.maxLife) {
          shootingStars.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
