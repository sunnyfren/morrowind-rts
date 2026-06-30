import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { Renderer } from '../game/Renderer';
import { screenToGrid, gridToScreen } from '../game/constants';

interface CanvasViewProps {
  engine: GameEngine;
}

export function CanvasView({ engine }: CanvasViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Selection box state
  const isDragging = useRef(false);
  const dragStart = useRef<{x: number, y: number} | null>(null);
  const dragCurrent = useRef<{x: number, y: number} | null>(null);

  // Panning state
  const isPanning = useRef(false);
  const panStart = useRef<{x: number, y: number, cx: number, cy: number} | null>(null);

  useEffect(() => {
     if (!canvasRef.current) return;
     const ctx = canvasRef.current.getContext('2d');
     if (!ctx) return;
     const renderer = new Renderer(ctx, engine);

     let rafId: number;
     const renderLoop = () => {
         const selBox = dragStart.current && dragCurrent.current && isDragging.current 
            ? { x1: Math.min(dragStart.current.x, dragCurrent.current.x), 
                y1: Math.min(dragStart.current.y, dragCurrent.current.y),
                x2: Math.max(dragStart.current.x, dragCurrent.current.x),
                y2: Math.max(dragStart.current.y, dragCurrent.current.y) }
            : null;
         renderer.draw(engine.camera.x, engine.camera.y, engine.camera.zoom, selBox);
         rafId = requestAnimationFrame(renderLoop);
     };
     rafId = requestAnimationFrame(renderLoop);

     const onKeyDown = (e: KeyboardEvent) => {
         engine.keys[e.code] = true;
         if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
             e.preventDefault();
         }
         if (e.code === 'Escape' && engine.placementMode) {
             engine.cancelPlacement();
         }
     };
     const onKeyUp = (e: KeyboardEvent) => {
         engine.keys[e.code] = false;
     };

     window.addEventListener('keydown', onKeyDown);
     window.addEventListener('keyup', onKeyUp);

     return () => {
         cancelAnimationFrame(rafId);
         window.removeEventListener('keydown', onKeyDown);
         window.removeEventListener('keyup', onKeyUp);
     };
  }, [engine]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Middle click pan
    if (e.button === 1 || e.buttons === 4) {
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY, cx: engine.camera.x, cy: engine.camera.y };
        return;
    }

    if (e.button === 0 || e.button === 2) { // left or right click for selection
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      dragCurrent.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
     engine.mousePos.x = e.clientX;
     engine.mousePos.y = e.clientY;
     engine.mousePos.active = true;

     if (isPanning.current && panStart.current) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        engine.camera.x = panStart.current.cx + dx;
        engine.camera.y = panStart.current.cy + dy;
        return;
     }

     if (isDragging.current && dragStart.current) {
         dragCurrent.current = { x: e.clientX, y: e.clientY };
     }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
     if (e.button === 1 || e.buttons === 4) {
         isPanning.current = false;
         return;
     }

     if ((e.button === 0 || e.button === 2) && dragStart.current && dragCurrent.current) {
         isDragging.current = false;
         
         const minSx = Math.min(dragStart.current.x, dragCurrent.current.x);
         const maxSx = Math.max(dragStart.current.x, dragCurrent.current.x);
         const minSy = Math.min(dragStart.current.y, dragCurrent.current.y);
         const maxSy = Math.max(dragStart.current.y, dragCurrent.current.y);
         
         const isClick = (maxSx - minSx) < 5 && (maxSy - minSy) < 5;
         const centerWorld = screenToGrid((minSx+maxSx)/2, (minSy+maxSy)/2, engine.camera.x, engine.camera.y, engine.camera.zoom);

         if (engine.placementMode) {
             if (e.button === 0) {
                 engine.confirmPlacement(centerWorld.x, centerWorld.y);
             } else if (e.button === 2) {
                 engine.cancelPlacement();
             }
         } else if (e.button === 0) {
             // Left click / drag -> Select
             if (isClick) {
                 engine.selectBox(centerWorld.x - 0.5, centerWorld.y - 0.5, centerWorld.x + 0.5, centerWorld.y + 0.5, e.shiftKey);
             } else {
                 // Pixel-perfect drag selection
                 let add = e.shiftKey;
                 for (const u of engine.units) {
                     if (!add && u.faction === engine.player.faction) u.selected = false;
                     
                     if (u.faction === engine.player.faction) {
                         const pt = gridToScreen(u.x, u.y, engine.camera.x, engine.camera.y, engine.camera.zoom);
                         if (pt.x >= minSx && pt.x <= maxSx && pt.y >= minSy && pt.y <= maxSy) {
                             u.selected = true;
                         }
                     }
                 }
                 for (const b of engine.buildings) b.selected = false;
                 for (const r of engine.resources) r.selected = false;
                 engine['notify']();
             }
         } else if (e.button === 2) {
             // Right click -> Command
             if (isClick) {
                 const hasSelectedUnits = engine.units.some(u => u.selected && u.faction === engine.player.faction);
                 if (hasSelectedUnits) {
                     engine.command(centerWorld.x, centerWorld.y);
                 }
             }
         }

         dragStart.current = null;
         dragCurrent.current = null;
         engine['notify'](); // Force react update
     }
  };

  const handleWheel = (e: React.WheelEvent) => {
     // Zoom at mouse cursor
     const zoomFactor = 1.1;
     const direction = e.deltaY > 0 ? 1 / zoomFactor : zoomFactor;
     
     // To zoom centered on mouse:
     // mouse_world = (mouse_screen - cam) / zoom
     // new_cam = mouse_screen - mouse_world * new_zoom
     
     const mouseWorldX = (e.clientX - engine.camera.x) / engine.camera.zoom;
     const mouseWorldY = (e.clientY - engine.camera.y) / engine.camera.zoom;
     
     let newZoom = engine.camera.zoom * direction;
     newZoom = Math.max(0.25, Math.min(newZoom, 3)); // Clamp zoom
     
     engine.camera.zoom = newZoom;
     engine.camera.x = e.clientX - mouseWorldX * newZoom;
     engine.camera.y = e.clientY - mouseWorldY * newZoom;
     
     // No notify needed if just rendering
  };

   const handlePointerLeave = () => {
      engine.mousePos.active = false;
      isPanning.current = false;
   };

  return (
      <canvas
         ref={canvasRef}
         width={typeof window !== 'undefined' ? window.innerWidth : 800}
         height={typeof window !== 'undefined' ? window.innerHeight : 600}
         onPointerDown={handlePointerDown}
         onPointerMove={handlePointerMove}
         onPointerUp={handlePointerUp}
         onPointerLeave={handlePointerLeave}
         onWheel={handleWheel}
         onContextMenu={(e) => e.preventDefault()}
         className="absolute top-0 left-0 outline-none cursor-crosshair touch-none"
      />
  );
}
