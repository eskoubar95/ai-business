"use client";

import { useRef, useEffect } from "react";

interface Letter {
  char: string;
  color: string;
  targetColor: string;
  colorProgress: number;
}

interface LetterGlitchProps {
  glitchColors?: string[];
  className?: string;
  glitchSpeed?: number;
  centerVignette?: boolean;
  outerVignette?: boolean;
  smooth?: boolean;
  characters?: string;
}

export default function LetterGlitch({
  glitchColors = ["#2b4539", "#61dca3", "#61b3dc"],
  className = "",
  glitchSpeed = 50,
  centerVignette = false,
  outerVignette = true,
  smooth = true,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789",
}: LetterGlitchProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const letters = useRef<Letter[]>([]);
  const grid = useRef({ columns: 0, rows: 0 });
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const lastGlitchTime = useRef(Date.now());

  const lettersAndSymbols = Array.from(characters);
  const fontSize = 16;
  const charWidth = 10;
  const charHeight = 20;

  const getRandomChar = () =>
    lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)] ?? "A";
  const getRandomColor = () =>
    glitchColors[Math.floor(Math.random() * glitchColors.length)] ?? glitchColors[0]!;

  function hexToRgb(hex: string) {
    const shorthand = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthand, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1]!, 16),
          g: parseInt(result[2]!, 16),
          b: parseInt(result[3]!, 16),
        }
      : null;
  }

  function interpolateColor(
    start: { r: number; g: number; b: number },
    end: { r: number; g: number; b: number },
    factor: number,
  ) {
    return `rgb(${Math.round(start.r + (end.r - start.r) * factor)},${Math.round(start.g + (end.g - start.g) * factor)},${Math.round(start.b + (end.b - start.b) * factor)})`;
  }

  function initializeLetters(columns: number, rows: number) {
    grid.current = { columns, rows };
    letters.current = Array.from({ length: columns * rows }, () => ({
      char: getRandomChar(),
      color: getRandomColor(),
      targetColor: getRandomColor(),
      colorProgress: 1,
    }));
  }

  function drawLetters() {
    const ctx = context.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas || letters.current.length === 0) return;
    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = "top";
    letters.current.forEach((letter, index) => {
      const x = (index % grid.current.columns) * charWidth;
      const y = Math.floor(index / grid.current.columns) * charHeight;
      ctx.fillStyle = letter.color;
      ctx.fillText(letter.char, x, y);
    });
  }

  function updateLetters() {
    const count = Math.max(1, Math.floor(letters.current.length * 0.05));
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * letters.current.length);
      const letter = letters.current[idx];
      if (!letter) continue;
      letter.char = getRandomChar();
      letter.targetColor = getRandomColor();
      if (!smooth) {
        letter.color = letter.targetColor;
        letter.colorProgress = 1;
      } else {
        letter.colorProgress = 0;
      }
    }
  }

  function handleSmoothTransitions() {
    let needsRedraw = false;
    letters.current.forEach((letter) => {
      if (letter.colorProgress < 1) {
        letter.colorProgress = Math.min(1, letter.colorProgress + 0.05);
        const s = hexToRgb(letter.color);
        const e = hexToRgb(letter.targetColor);
        if (s && e) {
          letter.color = interpolateColor(s, e, letter.colorProgress);
          needsRedraw = true;
        }
      }
    });
    if (needsRedraw) drawLetters();
  }

  function resizeCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    if (context.current) context.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    const columns = Math.ceil(rect.width / charWidth);
    const rows = Math.ceil(rect.height / charHeight);
    initializeLetters(columns, rows);
    drawLetters();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    context.current = canvas.getContext("2d");
    resizeCanvas();

    function animate() {
      const now = Date.now();
      if (now - lastGlitchTime.current >= glitchSpeed) {
        updateLetters();
        drawLetters();
        lastGlitchTime.current = now;
      }
      if (smooth) handleSmoothTransitions();
      animationRef.current = requestAnimationFrame(animate);
    }
    animate();

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        resizeCanvas();
        animate();
      }, 100);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glitchSpeed, smooth]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-black ${className}`}>
      <canvas ref={canvasRef} className="block w-full h-full" />
      {outerVignette && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,0,0,1) 100%)",
          }}
        />
      )}
      {centerVignette && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%)",
          }}
        />
      )}
    </div>
  );
}
