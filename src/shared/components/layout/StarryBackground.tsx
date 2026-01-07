import React, { useEffect, useRef } from 'react';

interface Star {
    x: number;
    y: number;
    size: number;
    opacity: number;
    speed: number;
}

/**
 * StarryBackground - Animated starfield background for pre-login pages
 * Matches Charviam.com design with subtle twinkling stars
 */
export const StarryBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const starsRef = useRef<Star[]>([]);
    const animationRef = useRef<number>();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initStars();
        };

        const initStars = () => {
            const starCount = Math.floor((canvas.width * canvas.height) / 8000);
            starsRef.current = Array.from({ length: starCount }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.5 + 0.3,
                speed: Math.random() * 0.0005 + 0.0002,
            }));
        };

        const animate = (time: number) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            starsRef.current.forEach((star) => {
                // Subtle twinkling effect
                const twinkle = Math.sin(time * star.speed * 10) * 0.3 + 0.7;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
                ctx.fill();
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        animationRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ background: 'transparent' }}
        />
    );
};
