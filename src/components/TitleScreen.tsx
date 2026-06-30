import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface TitleScreenProps {
  onStart: () => void;
}

export function TitleScreen({ onStart }: TitleScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let bgImage: HTMLImageElement | null = null;
    let opacity = 0;
    let time = 0;
    let useProcedural = false;

    const draw = () => {
      // Calculate aspect ratio to cover the canvas
      const canvasRatio = canvas.width / canvas.height;
      
      if (useProcedural) {
        // Procedural Telvanni Outpost & Swamp (Animated)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const width = canvas.width;
        const height = canvas.height;

        // 1. Sky (Sunset to Night gradient horizontally)
        const skyGrad = ctx.createLinearGradient(0, 0, width, 0);
        skyGrad.addColorStop(0, '#dcb274'); // Sunset yellow/orange
        skyGrad.addColorStop(0.2, '#c78a63'); // Warm sunset
        skyGrad.addColorStop(0.5, '#7f635f'); // Transition dusk
        skyGrad.addColorStop(0.8, '#46495d'); // Night sky
        skyGrad.addColorStop(1, '#2c3243'); // Darker night
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        // Stars (slowly twinkling)
        ctx.fillStyle = 'white';
        for(let i = 0; i < 150; i++) {
            const px = (i * 937) % width;
            const py = (i * 751) % (height * 0.6);
            const size = (i % 2) * 0.8 + 0.2;
            const twinkle = Math.sin(time * 0.02 + i) * 0.5 + 0.5;
            ctx.globalAlpha = twinkle * 0.8;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // Shooting Stars (occasionally on the right side)
        if (time % 400 > 380) {
            const progress = (time % 400) - 380;
            const sx = width * 0.7 + (time % 100) * 2 - progress * 25;
            const sy = height * 0.05 + progress * 15;
            ctx.strokeStyle = 'rgba(255, 255, 255, ' + Math.max(0, 1 - progress/20) + ')';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + 50, sy - 30);
            ctx.stroke();
        }

        // 2. Twin Moons (Masser and Secunda) - Moving across sky
        const moonSpeed = time * 0.05;
        
        // Masser (Large red moon)
        const masserX = width * 0.85 - (moonSpeed % (width * 1.5));
        const masserY = height * 0.2 + Math.sin(moonSpeed * 0.01) * 30;
        
        ctx.fillStyle = 'rgba(235, 140, 160, 0.9)';
        ctx.beginPath();
        ctx.arc(masserX, masserY, height * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        // Masser craters/ornate detail
        ctx.fillStyle = 'rgba(200, 100, 120, 0.3)';
        ctx.beginPath();
        ctx.arc(masserX - height * 0.02, masserY - height * 0.01, height * 0.02, 0, Math.PI * 2);
        ctx.arc(masserX + height * 0.02, masserY + height * 0.02, height * 0.015, 0, Math.PI * 2);
        ctx.fill();
        
        // Ornate contour lines on Masser
        ctx.strokeStyle = 'rgba(255, 180, 200, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(masserX, masserY, height * 0.07, Math.PI * 0.8, Math.PI * 1.5);
        ctx.stroke();

        // Secunda (Smaller silver moon)
        const secundaX = masserX + width * 0.08;
        const secundaY = masserY - height * 0.05;
        ctx.fillStyle = 'rgba(200, 210, 220, 0.9)';
        ctx.beginPath();
        ctx.arc(secundaX, secundaY, height * 0.03, 0, Math.PI * 2);
        ctx.fill();

        // Sun Glow (Left)
        const sunGrad = ctx.createRadialGradient(width * 0.2, height * 0.4, 0, width * 0.2, height * 0.4, height * 0.4);
        sunGrad.addColorStop(0, 'rgba(255, 240, 200, 0.8)');
        sunGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
        ctx.fillStyle = sunGrad;
        ctx.fillRect(0, 0, width, height);

        // 3. Clouds/Smoke in Sky
        ctx.fillStyle = 'rgba(100, 80, 70, 0.2)';
        for(let i = 0; i < 4; i++) {
            const driftX = (time * 0.1 + i * 300) % (width + 600) - 300;
            ctx.beginPath();
            ctx.ellipse(driftX, height * 0.2 + (i * 20), 400, 60, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 4. Distant Volcano (Center - Red Mountain)
        // Main Cone
        ctx.fillStyle = '#654f46';
        ctx.beginPath();
        ctx.moveTo(width * 0.35, height * 0.6);
        ctx.lineTo(width * 0.58, height * 0.25);
        ctx.lineTo(width * 0.62, height * 0.25);
        ctx.lineTo(width * 0.85, height * 0.6);
        ctx.fill();
        
        // Volcano Ridges (Detail)
        ctx.strokeStyle = 'rgba(70, 50, 40, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width * 0.58, height * 0.25);
        ctx.lineTo(width * 0.45, height * 0.6);
        ctx.moveTo(width * 0.6, height * 0.25);
        ctx.lineTo(width * 0.6, height * 0.6);
        ctx.moveTo(width * 0.62, height * 0.25);
        ctx.lineTo(width * 0.75, height * 0.6);
        ctx.stroke();

        // Magma vents on the side
        ctx.strokeStyle = 'rgba(255, 120, 50, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(width * 0.59, height * 0.28);
        ctx.lineTo(width * 0.57, height * 0.35);
        ctx.lineTo(width * 0.58, height * 0.4);
        ctx.stroke();

        // Lava glow/Caldera
        ctx.fillStyle = 'rgba(255, 90, 30, 0.9)';
        ctx.beginPath();
        ctx.ellipse(width * 0.6, height * 0.25, 35, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
        ctx.beginPath();
        ctx.ellipse(width * 0.6, height * 0.25, 15, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Dynamic Smoke Plume from Volcano
        for (let i = 0; i < 20; i++) {
            const progress = ((time * 0.3 + i * 15) % 300) / 300;
            const sway = Math.sin(progress * Math.PI * 2 + i) * 120;
            const pX = width * 0.6 + sway;
            const pY = height * 0.25 - progress * 250;
            const pSize = 30 + progress * 100;
            const alpha = Math.max(0, (1 - progress) * 0.7);
            
            ctx.fillStyle = `rgba(60, 50, 45, ${alpha})`;
            ctx.beginPath();
            ctx.arc(pX, pY, pSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // 5. Distant Mountains (Background layer)
        ctx.fillStyle = '#5c4b40';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.55);
        ctx.lineTo(width * 0.1, height * 0.45);
        ctx.lineTo(width * 0.2, height * 0.5);
        ctx.lineTo(width * 0.3, height * 0.45);
        ctx.lineTo(width * 0.4, height * 0.6);
        ctx.lineTo(width * 0.8, height * 0.6);
        ctx.lineTo(width * 0.9, height * 0.4);
        ctx.lineTo(width, height * 0.5);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.fill();
        
        // Mountain Ornate Linework (Contour lines)
        ctx.strokeStyle = 'rgba(120, 100, 80, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(width * 0.1, height * 0.45);
        ctx.lineTo(width * 0.15, height * 0.6);
        ctx.moveTo(width * 0.3, height * 0.45);
        ctx.lineTo(width * 0.25, height * 0.6);
        ctx.moveTo(width * 0.9, height * 0.4);
        ctx.lineTo(width * 0.85, height * 0.6);
        ctx.moveTo(0, height * 0.6);
        ctx.quadraticCurveTo(width * 0.2, height * 0.55, width * 0.4, height * 0.6);
        ctx.stroke();
        
        // 5.5 Cliff Racers (Flying creatures in the distance)
        const drawCliffRacer = (cx: number, cy: number, scale: number, timeOffset: number) => {
            ctx.fillStyle = '#2c2520';
            ctx.strokeStyle = '#2c2520';
            ctx.lineWidth = 1.5 * scale;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            
            // Flapping motion (up and down)
            const flap = Math.sin((time + timeOffset) * 0.15);
            
            // Body (long and thin)
            ctx.beginPath();
            ctx.moveTo(cx, cy); // Beak
            ctx.lineTo(cx + 8 * scale, cy - 2 * scale); // Top head/back
            ctx.lineTo(cx + 15 * scale, cy); // Base of tail
            ctx.lineTo(cx + 8 * scale, cy + 3 * scale); // Belly
            ctx.closePath();
            ctx.fill();

            // Wings
            ctx.beginPath();
            // Near wing
            ctx.moveTo(cx + 6 * scale, cy);
            ctx.quadraticCurveTo(cx + 2 * scale, cy - 8 * scale * flap - 5 * scale, cx - 4 * scale, cy - 12 * scale * flap);
            // Far wing
            ctx.moveTo(cx + 9 * scale, cy - 1 * scale);
            ctx.quadraticCurveTo(cx + 12 * scale, cy - 6 * scale * flap - 4 * scale, cx + 18 * scale, cy - 10 * scale * flap);
            ctx.stroke();
            
            // Long tail
            ctx.beginPath();
            ctx.moveTo(cx + 14 * scale, cy);
            ctx.quadraticCurveTo(cx + 22 * scale, cy - 3 * scale + flap * 2 * scale, cx + 30 * scale, cy + flap * 4 * scale);
            ctx.stroke();
        };

        // Draw a flock of distant cliff racers moving left across the sky
        for (let i = 0; i < 4; i++) {
            const speed = 1.2 + (i * 0.2);
            // Moving right to left
            const racerX = width * 1.2 - ((time * speed + i * 120) % (width * 1.5));
            // Slight vertical bobbing based on x and time
            const racerY = height * 0.35 + Math.sin(time * 0.02 + i) * 40 - (i * 15);
            drawCliffRacer(racerX, racerY, 0.4 + (i * 0.15), i * 20);
        }
        
        // 6. Left Settlement (Detailed Adobe/Hlaalu style)
        const drawHlaaluBuilding = (bx: number, by: number, bw: number, bh: number, tiers: number) => {
            ctx.fillStyle = '#8a7761';
            ctx.strokeStyle = '#5a4731';
            ctx.lineWidth = 1.5;
            
            for(let t = 0; t < tiers; t++) {
                const tierW = bw * (1 - t * 0.2);
                const tierH = bh / tiers;
                const tierX = bx + (bw - tierW) / 2;
                const tierY = by - (t + 1) * tierH;
                
                ctx.fillRect(tierX, tierY, tierW, tierH);
                ctx.strokeRect(tierX, tierY, tierW, tierH);
                
                // Details (windows/awnings)
                ctx.fillStyle = '#423329';
                if (tierW > 20) {
                    ctx.fillRect(tierX + tierW * 0.2, tierY + tierH * 0.3, tierW * 0.15, tierH * 0.4);
                    ctx.fillRect(tierX + tierW * 0.65, tierY + tierH * 0.3, tierW * 0.15, tierH * 0.4);
                }
                ctx.fillStyle = '#8a7761'; // Reset
            }
        };

        drawHlaaluBuilding(width * 0.02, height * 0.55, width * 0.12, height * 0.25, 3);
        drawHlaaluBuilding(width * 0.12, height * 0.55, width * 0.08, height * 0.18, 2);
        drawHlaaluBuilding(width * 0.08, height * 0.4, width * 0.06, height * 0.15, 2);
        drawHlaaluBuilding(-width * 0.02, height * 0.6, width * 0.08, height * 0.3, 4);

        // Hlaalu Lanterns (Red, Blue, Gold hanging lanterns)
        const drawLantern = (lx: number, ly: number, color: string) => {
            // String
            ctx.strokeStyle = '#332211';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(lx, ly - 10);
            ctx.lineTo(lx, ly);
            ctx.stroke();
            // Lantern Body
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(lx, ly, 4, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            // Lantern Glow
            ctx.globalAlpha = 0.6 + Math.sin(time * 0.05 + lx) * 0.2;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(lx, ly, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        };
        drawLantern(width * 0.06, height * 0.43, '#ff4444'); // Red
        drawLantern(width * 0.11, height * 0.41, '#4488ff'); // Blue
        drawLantern(width * 0.03, height * 0.48, '#ffcc44'); // Gold
        drawLantern(width * 0.14, height * 0.45, '#ff4444'); // Red
        
        // Bridge over river (Left) - More detailed arched aqueduct style
        ctx.fillStyle = '#8a7761'; // Match Hlaalu adobe
        ctx.strokeStyle = '#5a4731';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(width * 0.14, height * 0.48);
        ctx.lineTo(width * 0.32, height * 0.48);
        ctx.lineTo(width * 0.32, height * 0.6);
        ctx.lineTo(width * 0.14, height * 0.6);
        ctx.fill();
        ctx.stroke();
        
        // Bridge Arches
        ctx.globalCompositeOperation = 'destination-out';
        for(let i=0; i<4; i++) {
            ctx.beginPath();
            ctx.ellipse(width * 0.17 + (i * width * 0.045), height * 0.62, width * 0.015, height * 0.08, 0, Math.PI, 0);
            ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
        
        // Bridge Arch Trim
        ctx.strokeStyle = '#5a4731';
        for(let i=0; i<4; i++) {
            ctx.beginPath();
            ctx.ellipse(width * 0.17 + (i * width * 0.045), height * 0.62, width * 0.015, height * 0.08, 0, Math.PI, 0);
            ctx.stroke();
        }

        // 7. Right Settlement (Telvanni Mushroom Towers & Twisted Roots)
        ctx.fillStyle = '#4a3c33'; // Roots
        
        // Detailed giant twisted root arch
        const drawRoot = (startX: number, startY: number, cp1x: number, cp1y: number, cp2x: number, cp2y: number, endX: number, endY: number, thickness: number) => {
            ctx.lineWidth = thickness;
            ctx.strokeStyle = '#4a3c33';
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
            ctx.stroke();
            
            // Root highlights/texture
            ctx.lineWidth = thickness * 0.3;
            ctx.strokeStyle = '#5a4c43';
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.bezierCurveTo(cp1x - 5, cp1y - 5, cp2x - 5, cp2y - 5, endX, endY);
            ctx.stroke();
        };

        // Multiple intertwining roots forming the arch
        drawRoot(width * 0.7, height * 0.7, width * 0.8, height * 0.3, width * 0.9, height * 0.4, width * 0.98, height * 0.7, 25);
        drawRoot(width * 0.72, height * 0.7, width * 0.75, height * 0.4, width * 0.85, height * 0.5, width * 0.95, height * 0.7, 18);
        drawRoot(width * 0.68, height * 0.7, width * 0.85, height * 0.35, width * 0.92, height * 0.45, width, height * 0.65, 20);

        // Mushroom Towers
        const drawMushroomTower = (x: number, y: number, scale: number) => {
            // Stalk
            ctx.fillStyle = '#6a5a4a';
            ctx.beginPath();
            ctx.moveTo(x - 10 * scale, y);
            ctx.quadraticCurveTo(x - 15 * scale, y - 50 * scale, x - 5 * scale, y - 100 * scale);
            ctx.lineTo(x + 5 * scale, y - 100 * scale);
            ctx.quadraticCurveTo(x + 15 * scale, y - 50 * scale, x + 10 * scale, y);
            ctx.fill();
            
            // Ornate Stalk Lines
            ctx.strokeStyle = '#4a3a2a';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - 5 * scale, y);
            ctx.quadraticCurveTo(x - 8 * scale, y - 50 * scale, x - 2 * scale, y - 100 * scale);
            ctx.stroke();

            // Cap
            ctx.fillStyle = '#7a6245';
            ctx.beginPath();
            ctx.ellipse(x, y - 100 * scale, 35 * scale, 15 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Ornate Cap Lines
            ctx.strokeStyle = '#5a4225';
            ctx.beginPath();
            ctx.ellipse(x, y - 100 * scale, 30 * scale, 10 * scale, 0, Math.PI, 0);
            ctx.stroke();

            // Spire
            ctx.beginPath();
            ctx.moveTo(x - 20 * scale, y - 105 * scale);
            ctx.quadraticCurveTo(x, y - 140 * scale, x + 20 * scale, y - 105 * scale);
            ctx.fill();
            
            // Lanterns hanging from mushroom cap (Redoran/Telvanni style red shades)
            const mLanternX1 = x - 25 * scale;
            const mLanternY1 = y - 95 * scale;
            const mLanternX2 = x + 25 * scale;
            const mLanternY2 = y - 90 * scale;
            
            ctx.strokeStyle = '#332';
            ctx.beginPath();
            ctx.moveTo(mLanternX1, mLanternY1 - 5 * scale);
            ctx.lineTo(mLanternX1, mLanternY1);
            ctx.moveTo(mLanternX2, mLanternY2 - 5 * scale);
            ctx.lineTo(mLanternX2, mLanternY2);
            ctx.stroke();
            
            ctx.fillStyle = '#ff5544'; // Redoran red glow
            ctx.beginPath();
            ctx.arc(mLanternX1, mLanternY1, 3 * scale, 0, Math.PI * 2);
            ctx.arc(mLanternX2, mLanternY2, 2.5 * scale, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 0.5 + Math.sin(time * 0.04 + x) * 0.2;
            ctx.beginPath();
            ctx.arc(mLanternX1, mLanternY1, 10 * scale, 0, Math.PI * 2);
            ctx.arc(mLanternX2, mLanternY2, 8 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        };
        drawMushroomTower(width * 0.75, height * 0.5, 1.2);
        drawMushroomTower(width * 0.68, height * 0.55, 0.8);
        drawMushroomTower(width * 0.82, height * 0.52, 0.9);

        // Detailed Silt Strider Function
        const drawSiltStrider = (cx: number, cy: number, scale: number, bobAmount: number, isForeground: boolean) => {
            const legColor = isForeground ? '#3a3028' : '#4a3f35';
            const bodyColor = isForeground ? '#4a3f35' : '#5a4e44';
            const armorColor = isForeground ? '#2a221c' : '#3a3028';
            
            ctx.fillStyle = legColor;
            
            // Draw 4 spindly, multi-jointed legs
            const drawLeg = (offsetX: number, tipXOffset: number, length: number, reverseJoint: boolean) => {
                ctx.beginPath();
                ctx.moveTo(cx + offsetX * scale, cy + bobAmount);
                const jointX = cx + (offsetX + (reverseJoint ? -15 : 15)) * scale;
                const jointY = cy + bobAmount + length * 0.4;
                const tipX = cx + tipXOffset * scale;
                const tipY = cy + length;
                
                // Upper leg
                ctx.lineTo(jointX, jointY);
                // Lower leg
                ctx.lineTo(tipX, tipY);
                ctx.lineTo(tipX - 3 * scale, tipY);
                ctx.lineTo(jointX - 4 * scale, jointY);
                ctx.lineTo(cx + (offsetX - 8) * scale, cy + bobAmount);
                ctx.fill();
            };

            // Back legs
            drawLeg(-25, -50, height * 0.25 * scale, true);
            drawLeg(25, 50, height * 0.26 * scale, false);
            // Front legs
            drawLeg(-10, -20, height * 0.22 * scale, true);
            drawLeg(10, 20, height * 0.23 * scale, false);

            // Main Carapace (Body)
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.ellipse(cx, cy + bobAmount, 45 * scale, 30 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Armor Ribs (Segments)
            ctx.strokeStyle = armorColor;
            ctx.lineWidth = 2 * scale;
            for(let i = -30; i <= 30; i += 15) {
                ctx.beginPath();
                ctx.ellipse(cx + i * scale, cy + bobAmount, 10 * scale, 30 * scale, 0, Math.PI * 0.2, Math.PI * 0.8);
                ctx.stroke();
            }

            // Driver Compartment (Hollowed out front)
            ctx.fillStyle = armorColor;
            ctx.beginPath();
            ctx.ellipse(cx + 25 * scale, cy - 15 * scale + bobAmount, 18 * scale, 25 * scale, Math.PI/5, 0, Math.PI * 2);
            ctx.fill();
            
            // Tiny driver
            ctx.fillStyle = '#8a7761';
            ctx.fillRect(cx + 30 * scale, cy - 25 * scale + bobAmount, 5 * scale, 10 * scale);
        };

        // Draw distant Silt Strider (wandering right)
        const distStriderX = (width * 0.1 + time * 0.15) % (width * 1.4) - width * 0.2;
        drawSiltStrider(distStriderX, height * 0.45, 1.2, Math.sin(time * 0.04) * 4, false);
        
        // Draw foreground Silt Strider (wandering right)
        const foreStriderX = (width * 0.6 + time * 0.3) % (width * 1.5) - width * 0.25;
        drawSiltStrider(foreStriderX, height * 0.7, 1.8, Math.sin(time * 0.06 + Math.PI) * 6, true);

        // 9. Midground Hills
        ctx.fillStyle = '#5c4e40';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.65);
        ctx.quadraticCurveTo(width * 0.2, height * 0.6, width * 0.45, height * 0.7);
        ctx.quadraticCurveTo(width * 0.7, height * 0.6, width, height * 0.75);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.fill();

        // 10. Foreground Terrain & River
        ctx.fillStyle = '#473c31';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.75);
        ctx.quadraticCurveTo(width * 0.2, height * 0.8, width * 0.3, height * 0.95);
        ctx.lineTo(width * 0.5, height);
        ctx.lineTo(0, height);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(width * 0.6, height);
        ctx.quadraticCurveTo(width * 0.8, height * 0.8, width, height * 0.85);
        ctx.lineTo(width, height);
        ctx.fill();

        // River (Flowing through center)
        ctx.fillStyle = '#426066'; // Murky blue/green water
        ctx.beginPath();
        ctx.moveTo(width * 0.3, height * 0.95);
        ctx.quadraticCurveTo(width * 0.4, height * 0.8, width * 0.45, height * 0.7);
        ctx.lineTo(width * 0.55, height * 0.7);
        ctx.quadraticCurveTo(width * 0.6, height * 0.9, width * 0.6, height);
        ctx.lineTo(width * 0.5, height);
        ctx.fill();
        
        // Water highlights
        ctx.fillStyle = 'rgba(150, 180, 180, 0.3)';
        for(let i = 0; i < 15; i++) {
            const rx = width * 0.4 + (i * 20 + time * 0.5) % (width * 0.15);
            ctx.fillRect(rx, height * 0.8 + (i % 5) * 15, 20, 2);
        }

        // 11. Foreground Details (Trees, Mushrooms, Caravans, People)
        // Ascadian Isle style trees (Left)
        const drawTree = (x: number, y: number, scale: number) => {
            ctx.fillStyle = '#2c221a';
            ctx.fillRect(x - 2 * scale, y - 30 * scale, 4 * scale, 30 * scale);
            // Twisting branches
            ctx.strokeStyle = '#2c221a';
            ctx.lineWidth = 2 * scale;
            ctx.beginPath();
            ctx.moveTo(x, y - 20 * scale);
            ctx.lineTo(x - 15 * scale, y - 35 * scale);
            ctx.moveTo(x, y - 25 * scale);
            ctx.lineTo(x + 10 * scale, y - 40 * scale);
            ctx.stroke();

            ctx.fillStyle = '#3a472c'; // Dark green foliage
            ctx.beginPath();
            ctx.ellipse(x, y - 40 * scale, 25 * scale, 35 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#4a573c'; // Highlight
            ctx.beginPath();
            ctx.ellipse(x - 5 * scale, y - 45 * scale, 15 * scale, 20 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        };
        drawTree(width * 0.05, height * 0.8, 1.2);
        drawTree(width * 0.12, height * 0.88, 1.5);
        drawTree(width * 0.02, height * 0.95, 2);

        // Foreground Mushrooms (Right/Center/Left)
        const drawSmallMushroom = (x: number, y: number, scale: number) => {
            ctx.fillStyle = '#a68c74'; // Stalk
            ctx.beginPath();
            ctx.moveTo(x - 3 * scale, y);
            ctx.quadraticCurveTo(x, y - 10 * scale, x - 2 * scale, y - 20 * scale);
            ctx.lineTo(x + 2 * scale, y - 20 * scale);
            ctx.quadraticCurveTo(x + 4 * scale, y - 10 * scale, x + 3 * scale, y);
            ctx.fill();
            
            ctx.fillStyle = '#9e5234'; // Reddish cap
            ctx.beginPath();
            ctx.ellipse(x, y - 20 * scale, 16 * scale, 8 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#bd7254'; // Cap highlight
            ctx.beginPath();
            ctx.ellipse(x, y - 22 * scale, 8 * scale, 3 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        };
        drawSmallMushroom(width * 0.28, height * 0.85, 0.8);
        drawSmallMushroom(width * 0.32, height * 0.88, 1.2);
        drawSmallMushroom(width * 0.65, height * 0.9, 1.5);
        drawSmallMushroom(width * 0.8, height * 0.95, 2);
        drawSmallMushroom(width * 0.85, height * 0.98, 1.3);

        // Detailed Silhouette Caravan (Right side path moving left)
        const caravanX = width * 0.85 - (time * 0.2 % (width * 0.4));
        const caravanY = height * 0.85 + Math.sin(time * 0.05) * 2;
        ctx.fillStyle = '#1c1712';
        
        // Pack Guar 1
        ctx.beginPath();
        ctx.ellipse(caravanX, caravanY, 18, 12, 0, 0, Math.PI * 2); // Body
        ctx.ellipse(caravanX - 15, caravanY - 8, 8, 6, -Math.PI/6, 0, Math.PI * 2); // Head
        ctx.fill();
        // Legs
        const guarWalk = Math.sin(time * 0.1) * 5;
        ctx.fillRect(caravanX - 10 + guarWalk, caravanY, 3, 15);
        ctx.fillRect(caravanX + 10 - guarWalk, caravanY, 3, 15);
        
        // Pack Guar 2 (trailing)
        ctx.beginPath();
        ctx.ellipse(caravanX + 45, caravanY - 2, 16, 10, 0, 0, Math.PI * 2);
        ctx.ellipse(caravanX + 32, caravanY - 10, 7, 5, -Math.PI/6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(caravanX + 35 - guarWalk, caravanY - 2, 3, 15);
        ctx.fillRect(caravanX + 50 + guarWalk, caravanY - 2, 3, 15);

        // Travelers
        // Handler in front
        ctx.fillRect(caravanX - 30, caravanY - 15, 6, 25);
        ctx.beginPath();
        ctx.arc(caravanX - 27, caravanY - 18, 4, 0, Math.PI*2); // Head
        ctx.fill();
        
        // Person walking behind
        ctx.fillRect(caravanX + 70, caravanY - 12, 5, 22);
        ctx.beginPath();
        ctx.arc(caravanX + 72, caravanY - 15, 3.5, 0, Math.PI*2);
        ctx.fill();
        // Walking staff
        ctx.strokeStyle = '#1c1712';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(caravanX + 68, caravanY - 20);
        ctx.lineTo(caravanX + 65, caravanY + 10);
        ctx.stroke();
        
        // Small stone bridge in foreground left
        ctx.fillStyle = '#5a4f44';
        ctx.beginPath();
        ctx.moveTo(width * 0.2, height * 0.95);
        ctx.quadraticCurveTo(width * 0.3, height * 0.9, width * 0.4, height * 0.98);
        ctx.lineTo(width * 0.4, height);
        ctx.lineTo(width * 0.2, height);
        ctx.fill();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.ellipse(width * 0.3, height, width * 0.08, height * 0.05, 0, Math.PI, 0);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        
        time++;
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      if (!bgImage || !bgImage.complete) return;
      
      const imgRatio = bgImage.width / bgImage.height;
      
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > imgRatio) {
        drawHeight = canvas.width / imgRatio;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        drawWidth = canvas.height * imgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Fade in effect
      if (opacity < 1) {
        opacity += 0.01;
      }
      ctx.globalAlpha = opacity;
      
      ctx.drawImage(bgImage, offsetX, offsetY, drawWidth, drawHeight);
      
      ctx.globalAlpha = 1.0;

      if (opacity < 1) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      draw();
    };

    bgImage = new Image();
    // Use the image path provided by the user (easier filename)
    bgImage.src = '/background.jpg'; 
    
    bgImage.onload = () => {
      useProcedural = false;
      draw();
    };

    bgImage.onerror = () => {
      console.warn('Background image not found. Using procedural fallback.');
      useProcedural = true;
      draw();
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute top-0 left-0 w-screen h-screen overflow-hidden bg-black z-50 flex flex-col justify-center items-center">
      {/* Canvas Background Layer */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full z-[1]"
      />
      
      {/* Light Overlay for Text Readability (matching the brighter art style) */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/10 z-[2]" />

      {/* Foreground Content */}
      <div className="relative z-[3] flex flex-col items-center justify-center w-full max-w-5xl px-4 mt-[-5vh]">
        <motion.h1 
          className="font-serif text-[#e5d3b3] text-3xl md:text-4xl lg:text-5xl tracking-[0.15em] mb-8 text-center uppercase"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.4)' }}
        >
          THE ELDER SCROLLS: MORROWIND - RTS
        </motion.h1>

        {/* Central Emblem Placeholder mimicking the reference art */}
        <motion.div
          className="w-64 h-64 md:w-80 md:h-80 rounded-full border-[8px] border-[#5e4b3c] bg-[#1a110b] flex items-center justify-center mb-12 shadow-[0_0_40px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(0,0,0,0.8)] relative overflow-hidden ring-4 ring-[#8c7457]/30"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
        >
           <EmblemCanvas />
           
           {/* Inner Border Overlays for 3D depth */}
           <div className="absolute inset-0 border-4 border-[#8c7457] rounded-full pointer-events-none opacity-80 shadow-[inset_0_0_15px_rgba(0,0,0,0.9)]"></div>
           <div className="absolute inset-0 border border-[#b89f82]/50 rounded-full m-3 pointer-events-none"></div>
           
           {/* Decorative frame elements on cardinal points */}
           <div className="absolute top-0 w-8 h-4 bg-[#5e4b3c] rounded-b-md border border-[#8c7457] border-t-0 z-10 shadow-md"></div>
           <div className="absolute bottom-0 w-8 h-4 bg-[#5e4b3c] rounded-t-md border border-[#8c7457] border-b-0 z-10 shadow-md"></div>
           <div className="absolute left-0 w-4 h-8 bg-[#5e4b3c] rounded-r-md border border-[#8c7457] border-l-0 z-10 shadow-md"></div>
           <div className="absolute right-0 w-4 h-8 bg-[#5e4b3c] rounded-l-md border border-[#8c7457] border-r-0 z-10 shadow-md"></div>
        </motion.div>

        <motion.button
          onClick={onStart}
          className="font-serif text-lg md:text-xl text-[#e5d3b3] bg-gradient-to-b from-[#3a2718]/90 to-[#1f130a]/90 border border-[#8c7457] px-10 py-3 tracking-[0.15em] uppercase cursor-pointer hover:from-[#4f3621] hover:to-[#2c1b0e] hover:border-[#b39572] hover:text-[#f2e6d5] transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.6)] outline-none rounded-sm"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.5, delay: 1.2, ease: "easeOut" }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          START GAME
        </motion.button>
      </div>
    </div>
  );
}

function EmblemCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    // Set actual canvas DOM size (will be scaled down by CSS width/height 100%)
    const logicalSize = 400; 
    canvas.width = logicalSize * dpr;
    canvas.height = logicalSize * dpr;
    ctx.scale(dpr, dpr);

    let animationId: number;
    let time = 0;

    const width = logicalSize;
    const height = logicalSize;

    const draw = () => {
      // Clear
      ctx.clearRect(0, 0, width, height);
      
      // Sky gradient (dusk/smoke atmosphere)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.8);
      skyGrad.addColorStop(0, '#b8816c'); // dusty orange
      skyGrad.addColorStop(0.4, '#c7a28f'); // lighter ash
      skyGrad.addColorStop(1, '#d1c0b6');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Sun / glow behind volcano
      ctx.fillStyle = 'rgba(255, 200, 150, 0.4)';
      ctx.beginPath();
      ctx.arc(width * 0.65, height * 0.45, 60 + Math.sin(time * 0.02) * 5, 0, Math.PI * 2);
      ctx.fill();

      // Distant Mountains
      ctx.fillStyle = '#7a6155';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.6);
      ctx.lineTo(width * 0.25, height * 0.45);
      ctx.lineTo(width * 0.45, height * 0.55);
      ctx.lineTo(width * 0.8, height * 0.35);
      ctx.lineTo(width, height * 0.5);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();

      // The Great Volcano (Red Mountain)
      const volCX = width * 0.65;
      const volCY = height * 0.45;
      
      // Volcano Base
      ctx.fillStyle = '#4a362f';
      ctx.beginPath();
      ctx.moveTo(volCX - 120, height);
      ctx.lineTo(volCX - 40, volCY + 20);
      ctx.quadraticCurveTo(volCX, volCY - 10, volCX + 40, volCY + 20);
      ctx.lineTo(volCX + 120, height);
      ctx.fill();

      // Lava glow at peak
      ctx.fillStyle = `rgba(255, 80, 0, ${0.7 + Math.sin(time * 0.1) * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(volCX, volCY + 15, 30, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dynamic Smoke Plume
      for (let i = 0; i < 12; i++) {
        // Offset each smoke particle in time
        const particleTime = time * 0.5 + i * 20;
        const cycle = particleTime % 240; // 240 frames life
        const progress = cycle / 240;
        
        // Swaying motion as it rises
        const sway = Math.sin(progress * Math.PI * 2 + i) * (20 + progress * 40);
        const pX = volCX + sway;
        const pY = volCY + 10 - progress * 150;
        
        // Grows as it rises
        const pSize = 15 + progress * 50;
        
        // Fades out
        const alpha = Math.max(0, (1 - progress) * 0.8);
        
        ctx.fillStyle = `rgba(70, 60, 60, ${alpha})`;
        ctx.beginPath();
        ctx.arc(pX, pY, pSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner highlight for volume
        ctx.fillStyle = `rgba(100, 90, 90, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(pX - pSize * 0.2, pY - pSize * 0.2, pSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Background Terrain (Transition from Ashlands to Ascadian Isles)
      const terrainGrad = ctx.createLinearGradient(0, height * 0.7, width, height * 0.7);
      terrainGrad.addColorStop(0, '#3a4a2b'); // Lush green (Ascadian Isles)
      terrainGrad.addColorStop(0.5, '#4a412b'); // Transition
      terrainGrad.addColorStop(1, '#2b1f1a'); // Ashlands

      ctx.fillStyle = terrainGrad;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.75);
      ctx.quadraticCurveTo(width * 0.3, height * 0.65, width * 0.6, height * 0.85);
      ctx.quadraticCurveTo(width * 0.8, height * 0.9, width, height * 0.8);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();

      // Draw Ascadian Isles Flora (Ferns)
      const drawAscadianPlant = (x: number, y: number, scale: number) => {
        ctx.save();
        ctx.translate(x, y);
        const sway = Math.sin(time * 0.02 + x) * 0.05;
        ctx.rotate(sway);
        
        ctx.fillStyle = '#4f6b35';
        for (let i = -2; i <= 2; i++) {
          ctx.save();
          ctx.rotate((Math.PI / 8) * i);
          ctx.beginPath();
          ctx.ellipse(0, -15 * scale, 3 * scale, 15 * scale, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      };

      // Draw Telvanni Crystals
      const drawCrystal = (x: number, y: number, scale: number) => {
        ctx.save();
        ctx.translate(x, y);
        
        // Glow
        ctx.globalAlpha = 0.5 + Math.sin(time * 0.04 + x) * 0.2;
        const glowGrad = ctx.createRadialGradient(0, -10 * scale, 0, 0, -10 * scale, 25 * scale);
        glowGrad.addColorStop(0, 'rgba(138, 92, 245, 0.8)');
        glowGrad.addColorStop(1, 'rgba(138, 92, 245, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, -10 * scale, 25 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        // Crystal Body
        ctx.fillStyle = '#8a5cf5'; // Base purple
        ctx.beginPath();
        ctx.moveTo(0, -30 * scale);
        ctx.lineTo(8 * scale, -10 * scale);
        ctx.lineTo(0, 0);
        ctx.lineTo(-8 * scale, -10 * scale);
        ctx.closePath();
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = '#b69aff';
        ctx.beginPath();
        ctx.moveTo(0, -30 * scale);
        ctx.lineTo(0, 0);
        ctx.lineTo(-8 * scale, -10 * scale);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
      };

      // Draw a Floating Netch (Fauna)
      const drawNetch = (x: number, y: number, scale: number) => {
        ctx.save();
        // Hovering motion
        const hoverY = Math.sin(time * 0.015 + x) * 10 * scale;
        const driftX = Math.cos(time * 0.01 + x) * 5 * scale;
        ctx.translate(x + driftX, y + hoverY);
        
        // Body (Sac)
        ctx.fillStyle = '#5c6b73';
        ctx.beginPath();
        ctx.ellipse(0, 0, 15 * scale, 10 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Carapace
        ctx.fillStyle = '#3a444a';
        ctx.beginPath();
        ctx.ellipse(0, -2 * scale, 14 * scale, 6 * scale, 0, 0, Math.PI, true);
        ctx.fill();
        
        // Tentacles
        ctx.strokeStyle = '#4a575e';
        ctx.lineWidth = 1.5 * scale;
        for (let i = -1; i <= 1; i++) {
          const tentacleSway = Math.sin(time * 0.05 + i) * 3 * scale;
          ctx.beginPath();
          ctx.moveTo(i * 8 * scale, 5 * scale);
          ctx.quadraticCurveTo(i * 10 * scale + tentacleSway, 15 * scale, i * 6 * scale + tentacleSway * 1.5, 25 * scale);
          ctx.stroke();
        }
        ctx.restore();
      };

      // Draw Fauna (Netches) in the sky/background
      drawNetch(width * 0.3, height * 0.35, 0.8);
      drawNetch(width * 0.15, height * 0.25, 0.5);

      // Draw Flora (Ascadian Isles side)
      drawAscadianPlant(width * 0.1, height * 0.85, 1.5);
      drawAscadianPlant(width * 0.25, height * 0.9, 1.2);
      drawAscadianPlant(width * 0.15, height * 0.95, 2.0);

      // Draw Telvanni Crystals (scattered)
      drawCrystal(width * 0.4, height * 0.85, 1.0);
      drawCrystal(width * 0.35, height * 0.9, 0.7);
      drawCrystal(width * 0.75, height * 0.95, 1.2);

      // Draw Giant Mushrooms (Telvanni style)
      const drawMushroom = (x: number, y: number, scale: number, swayOffset: number) => {
        ctx.save();
        ctx.translate(x, y);
        
        // Gentle swaying motion
        const sway = Math.sin(time * 0.03 + swayOffset) * 0.03;
        ctx.rotate(sway);
        
        // Stalk
        ctx.fillStyle = '#a8937b';
        ctx.beginPath();
        ctx.moveTo(-10 * scale, 0);
        ctx.quadraticCurveTo(-15 * scale, -40 * scale, -5 * scale, -80 * scale);
        ctx.lineTo(5 * scale, -80 * scale);
        ctx.quadraticCurveTo(15 * scale, -40 * scale, 10 * scale, 0);
        ctx.fill();
        
        // Stalk texture lines
        ctx.strokeStyle = '#6e5d4a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-2 * scale, 0);
        ctx.quadraticCurveTo(-5 * scale, -40 * scale, 0 * scale, -75 * scale);
        ctx.stroke();
        
        // Mushroom Cap
        ctx.translate(0, -78 * scale);
        // Tilt cap slightly opposite to sway
        ctx.rotate(-sway * 1.5);
        
        // Gills (underside)
        ctx.fillStyle = '#4a3322';
        ctx.beginPath();
        ctx.ellipse(0, 0, 45 * scale, 12 * scale, 0, 0, Math.PI, false);
        ctx.fill();

        // Dome (top)
        const capGrad = ctx.createRadialGradient(0, -20 * scale, 0, 0, -10 * scale, 50 * scale);
        capGrad.addColorStop(0, '#a37151');
        capGrad.addColorStop(0.8, '#73462b');
        capGrad.addColorStop(1, '#422413');
        
        ctx.fillStyle = capGrad;
        ctx.beginPath();
        ctx.moveTo(-45 * scale, 0);
        ctx.bezierCurveTo(-45 * scale, -50 * scale, 45 * scale, -50 * scale, 45 * scale, 0);
        ctx.lineTo(-45 * scale, 0);
        ctx.fill();
        
        // Bioluminescent spots
        ctx.fillStyle = '#e8d2a5';
        ctx.globalAlpha = 0.6 + Math.sin(time * 0.05 + swayOffset) * 0.3; // Pulses slightly
        ctx.beginPath();
        ctx.arc(-20 * scale, -25 * scale, 4 * scale, 0, Math.PI * 2);
        ctx.arc(15 * scale, -30 * scale, 5 * scale, 0, Math.PI * 2);
        ctx.arc(0, -15 * scale, 3 * scale, 0, Math.PI * 2);
        ctx.arc(-30 * scale, -10 * scale, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        ctx.restore();
      };

      // Draw a few mushrooms in the foreground/midground
      drawMushroom(width * 0.25, height * 1.05, 1.2, 0);
      drawMushroom(width * 0.45, height * 1.1, 0.7, 2);
      drawMushroom(width * 0.1, height * 0.95, 0.9, 4);

      // Floating Ash Particles (Blight dust)
      ctx.fillStyle = 'rgba(210, 200, 190, 0.6)';
      for (let i = 0; i < 40; i++) {
        // Pseudo-random deterministic positions based on index and time
        const ax = (i * 73 + time * 0.3) % width;
        const ay = (i * 97 + time * 0.5) % height;
        // Swaying drift
        const drift = Math.sin(time * 0.02 + i) * 10;
        
        ctx.beginPath();
        ctx.arc(ax + drift, ay, 1 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }

      time++;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />;
}
