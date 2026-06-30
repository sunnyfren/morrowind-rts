import { GameEngine, Entity, Unit, Building, ResourceNode } from './GameEngine';
import { Faction, ResourceType, UnitType, BuildingType, gridToScreen, screenToGrid, TILE_W, TILE_H, MAP_SIZE } from './constants';

const colors = {
  [Faction.Hlaalu]: '#d4c790', // Yellowish clay
  [Faction.Redoran]: '#a24c40', // Reddish brown
  [Faction.Telvanni]: '#654f76', // Deep purple
};

function mixColors(color1: string, color2: string, weight: number) {
    const parse = (c: string) => [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)];
    const c1 = parse(color1);
    const c2 = parse(color2);
    const w1 = weight;
    const w2 = 1 - w1;
    const r = Math.round(c1[0] * w1 + c2[0] * w2);
    const g = Math.round(c1[1] * w1 + c2[1] * w2);
    const b = Math.round(c1[2] * w1 + c2[2] * w2);
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

const resourceColors = {
  [ResourceType.Food]: '#c23a54', // Berries/Ash yams
  [ResourceType.Wood]: '#4a6f3b', // Trees
  [ResourceType.Gold]: '#f2be22', // Drakes/Gold
  [ResourceType.Stone]: '#6a707a', // Ebony/Stone
};

export class Renderer {
  ctx: CanvasRenderingContext2D;
  engine: GameEngine;

  constructor(ctx: CanvasRenderingContext2D, engine: GameEngine) {
    this.ctx = ctx;
    this.engine = engine;
  }

  draw(camX: number, camY: number, zoom: number, selBox: {x1: number, y1: number, x2: number, y2: number} | null) {
    const w = this.ctx.canvas.width;
    const h = this.ctx.canvas.height;

    // Clear bg based on faction
    if (this.engine.player.faction === Faction.Hlaalu) {
        // Ascadian Isles (warm sunrise, green)
        this.ctx.fillStyle = '#87CEEB'; // light sky blue
        this.ctx.fillRect(0, 0, w, h);
        for(let i=0; i<15; i++) {
           const cx = (Math.sin(i * 123.4) * 0.5 + 0.5) * w;
           const cy = (Math.cos(i * 432.1) * 0.5 + 0.5) * h;
           this.ctx.fillStyle = '#ffffff88';
           this.ctx.beginPath();
           this.ctx.arc(cx, cy, 40 + (i*10)%20, 0, Math.PI*2);
           this.ctx.arc(cx + 30, cy - 10, 50, 0, Math.PI*2);
           this.ctx.arc(cx + 60, cy + 10, 30, 0, Math.PI*2);
           this.ctx.fill();
        }
    } else if (this.engine.player.faction === Faction.Telvanni) {
        // Bitter Coast / Azura's Coast (Orange sunset, moody skies)
        const grad = this.ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#7c3f3f'); // dusky red
        grad.addColorStop(0.5, '#e69a4d'); // orange sun
        grad.addColorStop(1, '#e3c286');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, w, h);
    } else {
        // Redoran (Ashlands, dusty, brown/grey sky)
        this.ctx.fillStyle = '#9e8c78';
        this.ctx.fillRect(0, 0, w, h);
        // Ash storms in air
        this.ctx.fillStyle = '#6e5e4d22';
        for(let i=0; i<3; i++) {
           this.ctx.fillRect(0, (this.engine.gameTime*50 + i*300)%h, w, 100);
        }
    }

    // Collect player vision points
    const visionPoints: {x: number, y: number, r2: number}[] = [];
    for (const b of this.engine.buildings) {
       if (b.faction === this.engine.player.faction) visionPoints.push({x: b.x, y: b.y, r2: 15*15});
    }
    for (const u of this.engine.units) {
       if (u.faction === this.engine.player.faction) visionPoints.push({x: u.x, y: u.y, r2: 8*8});
    }

    const isVisible = (ex: number, ey: number) => {
       for (const v of visionPoints) {
          const distSq = (ex - v.x)*(ex - v.x) + (ey - v.y)*(ey - v.y);
          if (distSq <= v.r2) return true;
       }
       return false;
    };

    // Draw grid
    for(let gy = 0; gy < MAP_SIZE; gy++) {
      for(let gx = 0; gx < MAP_SIZE; gx++) {
        if (isVisible(gx, gy)) {
          this.drawTile(gx, gy, camX, camY, zoom);
        } else {
          // Draw a dark/black tile for fog of war
          if (this.engine.player.faction === Faction.Hlaalu) this.ctx.fillStyle = '#3a5f82'; // dark sky
          else this.ctx.fillStyle = '#111'; // Unexplored/Fog
          const pt = gridToScreen(gx, gy, camX, camY, zoom);
          this.ctx.beginPath();
          this.ctx.moveTo(pt.x, pt.y - (TILE_H/2)*zoom);
          this.ctx.lineTo(pt.x + (TILE_W/2)*zoom, pt.y);
          this.ctx.lineTo(pt.x, pt.y + (TILE_H/2)*zoom);
          this.ctx.lineTo(pt.x - (TILE_W/2)*zoom, pt.y);
          this.ctx.closePath();
          this.ctx.fill();
        }
      }
    }

    // Draw Particles
    for (const p of this.engine.particles) {
       // Only render if visible? Not strictly necessary if small, but let's just render them all that are in range
       if (!isVisible(p.x, p.y)) continue;
       const pt = gridToScreen(p.x, p.y, camX, camY, zoom);
       if (pt.x < -50*zoom || pt.x > w + 50*zoom || pt.y < -50*zoom || pt.y > h + 50*zoom) continue;
       
       this.ctx.fillStyle = p.color;
       this.ctx.globalAlpha = Math.min(1.0, p.life / (p.maxLife * 0.5)); // fade out
       const screenZ = p.z * (TILE_H/2) * zoom;
       this.drawIsoEllipse(pt.x, pt.y - screenZ, p.size * (TILE_W/2) * zoom, p.size * (TILE_H/2) * zoom);
       this.ctx.fill();
    }
    this.ctx.globalAlpha = 1.0;

    // Collect all entities and depth-sort
    const entities: any[] = [
      ...this.engine.resources,
      ...this.engine.buildings,
      ...this.engine.units
    ].sort((a, b) => (a.x + a.y) - (b.x + b.y));

    for (const e of entities) {
        // Skip rendering non-friendlies if not in vision
        if (e.faction !== this.engine.player.faction && !isVisible(e.x, e.y)) {
           continue; // Hide in fog of war
        }

        const pt = gridToScreen(e.x, e.y, camX, camY, zoom);
        // primitive culling based on screen bounds
        if (pt.x < -150*zoom || pt.x > w + 150*zoom || pt.y < -150*zoom || pt.y > h + 150*zoom) continue;
        
        // Draw selection circle under entity
        if (e.selected) {
           this.ctx.strokeStyle = 'rgba(0, 255, 100, 0.8)';
           this.ctx.lineWidth = 2 * zoom;
           this.drawIsoEllipse(pt.x, pt.y, e.radius * (TILE_W/2) * zoom, e.radius * (TILE_H/2) * zoom);
           this.ctx.stroke();
        }

        // Draw shadow under entity
        this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
        this.drawIsoEllipse(pt.x, pt.y, e.radius * (TILE_W/2) * 0.8 * zoom, e.radius * (TILE_H/2) * 0.8 * zoom);
        this.ctx.fill();

        // Draw shadow based on constant light source
        const lightPt = gridToScreen(MAP_SIZE / 2, MAP_SIZE / 2, camX, camY, zoom);
        lightPt.y -= 800 * zoom; // Constant light source height

        const dx = pt.x - lightPt.x;
        const dy = pt.y - lightPt.y;
        const distToLight = Math.hypot(dx, dy);
        
        if (distToLight > 0) {
            const shadowAngle = Math.atan2(dy, dx);
            // Shadow length depends on distance from light source (parallax effect) and entity height
            const shadowLength = (distToLight * 0.03) + (e.kind === 'building' ? 40 * zoom : 15 * zoom); 
            
            this.ctx.save();
            this.ctx.translate(pt.x, pt.y);
            this.ctx.rotate(shadowAngle);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            this.ctx.beginPath();
            const sx = shadowLength;
            const sy = e.radius * (TILE_H / 2) * zoom;
            this.ctx.ellipse(sx / 2, 0, sx / 2, sy * 0.8, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        if (e.kind === 'resource') this.drawResource(e, pt.x, pt.y, zoom);
        else if (e.kind === 'building') this.drawBuilding(e, pt.x, pt.y, zoom);
        else if (e.kind === 'unit') this.drawUnit(e, pt.x, pt.y, zoom);
    }

    // Draw waypoints
    for (const wp of this.engine.waypoints) {
       const pt = gridToScreen(wp.x, wp.y, camX, camY, zoom);
       // Starcraft-style clicking blip
       this.ctx.strokeStyle = `rgba(0, 255, 100, ${wp.timer * 2})`;
       this.ctx.lineWidth = 2 * zoom;
       this.ctx.beginPath();
       const s = 10 * zoom * (1 + (0.5 - wp.timer));
       this.ctx.moveTo(pt.x - s, pt.y - s);
       this.ctx.lineTo(pt.x + s, pt.y + s);
       this.ctx.moveTo(pt.x + s, pt.y - s);
       this.ctx.lineTo(pt.x - s, pt.y + s);
       this.ctx.stroke();
    }

    // Day/Night Cycle Overlay
    const timeRatio = (this.engine.gameTime % this.engine.dayDuration) / this.engine.dayDuration;
    // Darkest at 0.5 (midnight), lightest at 0 and 1 (noon)
    // Map to a darkness value between 0 (day) and 0.6 (night)
    const darkness = Math.max(0, 0.6 * Math.sin(timeRatio * Math.PI * 2));
    if (darkness > 0) {
       this.ctx.fillStyle = `rgba(10, 10, 30, ${darkness})`;
       this.ctx.fillRect(0, 0, w, h);
    }

    // Draw selection box
    if (selBox) {
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        this.ctx.lineWidth = 1;
        const width = selBox.x2 - selBox.x1;
        const height = selBox.y2 - selBox.y1;
        this.ctx.fillRect(selBox.x1, selBox.y1, width, height);
        this.ctx.strokeRect(selBox.x1, selBox.y1, width, height);
    }

    if (this.engine.placementMode && this.engine.mousePos.active) {
        const { buildingType } = this.engine.placementMode;
        const centerWorld = screenToGrid(this.engine.mousePos.x, this.engine.mousePos.y, camX, camY, zoom);
        
        let isValid = true;
        const radius = buildingType === BuildingType.House ? 1.0 : 1.5;
        // Basic collision check against buildings and resources
        for (const b of this.engine.buildings) {
           if (Math.hypot(b.x - centerWorld.x, b.y - centerWorld.y) < radius + b.radius) {
              isValid = false; break;
           }
        }
        for (const r of this.engine.resources) {
           if (Math.hypot(r.x - centerWorld.x, r.y - centerWorld.y) < radius + r.radius) {
              isValid = false; break;
           }
        }

        const buildPt = gridToScreen(centerWorld.x, centerWorld.y, camX, camY, zoom);
        
        this.ctx.globalAlpha = 0.6;
        
        // Draw the collision circle
        this.ctx.beginPath();
        this.ctx.ellipse(buildPt.x, buildPt.y, (TILE_W * radius) * zoom, (TILE_H * radius) * zoom, 0, 0, Math.PI*2);
        this.ctx.fillStyle = isValid ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
        this.ctx.fill();
        this.ctx.strokeStyle = isValid ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
        this.ctx.stroke();

        this.ctx.globalAlpha = 0.4;
        
        // Draw rough building shape
        this.drawBuilding({
           id: 'ghost', kind:'building', buildingType,
           faction: this.engine.player.faction,
           x: centerWorld.x, y: centerWorld.y,
           hp:1, maxHp:1, radius, selected: false,
           isBuilt: true, buildProgress: 100
        }, camX, camY, zoom);
        
        this.ctx.globalAlpha = 1.0;
    }
  }

  private drawTile(gx: number, gy: number, camX: number, camY: number, zoom: number) {
    const pt = gridToScreen(gx, gy, camX, camY, zoom);
    const tw = (TILE_W / 2) * zoom;
    const th = (TILE_H / 2) * zoom;

    this.ctx.beginPath();
    this.ctx.moveTo(pt.x, pt.y - th);
    this.ctx.lineTo(pt.x + tw, pt.y);
    this.ctx.lineTo(pt.x, pt.y + th);
    this.ctx.lineTo(pt.x - tw, pt.y);
    this.ctx.closePath();
    
    const tVal = this.engine.terrainGrid[gx] && this.engine.terrainGrid[gx][gy] ? this.engine.terrainGrid[gx][gy] : 0;

    if (this.engine.player.faction === Faction.Redoran) {
       if (tVal < -0.3) this.ctx.fillStyle = '#4a2f2b'; // Dark lava crack / deep ash trench
       else if (tVal > 0.4) this.ctx.fillStyle = '#6e5e4d'; // rocky ash hill
       else this.ctx.fillStyle = ((gx + gy) % 2 === 0) ? '#8b7a66' : '#7a6a57'; // Ash sand
    } else if (this.engine.player.faction === Faction.Telvanni) {
       if (tVal < -0.3) this.ctx.fillStyle = '#1e2926'; // Deep bitter coast water/mud
       else if (tVal > 0.4) this.ctx.fillStyle = '#4f4159'; // purplish rocky outcropping
       else this.ctx.fillStyle = ((gx + gy) % 2 === 0) ? '#3a4f3e' : '#2f4233'; // Deep swamp mix
    } else {
       if (tVal < -0.3) this.ctx.fillStyle = '#3a879e'; // Ascadian water / ponds
       else if (tVal > 0.4) this.ctx.fillStyle = '#4d5d3b'; // dark lush hill
       else this.ctx.fillStyle = ((gx + gy) % 2 === 0) ? '#6fa14f' : '#629344'; // green grass
    }
    this.ctx.fill();

    // Map Clutter details
    if ((gx*7 + gy*13) % 17 === 0) {
        this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
        this.ctx.beginPath();
        this.ctx.ellipse(pt.x + tw*0.2, pt.y, tw*0.3, th*0.3, 0, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.fillStyle = this.engine.player.faction === Faction.Redoran ? '#5c544d' : '#4d5248';
        this.ctx.beginPath();
        this.ctx.arc(pt.x + tw*0.2, pt.y - th*0.2, th*0.2, 0, Math.PI*2);
        this.ctx.fill();
    }
    if ((gx*3 + gy*23) % 11 === 0) {
        this.ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        this.ctx.beginPath();
        this.ctx.moveTo(pt.x - tw*0.4, pt.y);
        this.ctx.lineTo(pt.x, pt.y + th*0.3);
        this.ctx.lineTo(pt.x + tw*0.5, pt.y - th*0.2);
        this.ctx.stroke();
    }

    // Random decorative flora based on faction
    const pseudoRand = Math.abs(Math.sin(gx * 100 + gy)) * 1000 % 1;
    if (pseudoRand > 0.8) {
        if (this.engine.player.faction === Faction.Telvanni) {
            // Glowing flora
            this.ctx.fillStyle = pseudoRand > 0.9 ? '#10b981' : '#c084fc';
            this.ctx.beginPath();
            this.ctx.arc(pt.x, pt.y - th*0.5, th*0.4, 0, Math.PI*2);
            this.ctx.fill();
            this.ctx.fillStyle = '#fcd34d';
            this.ctx.beginPath();
            this.ctx.arc(pt.x, pt.y - th*0.5, th*0.1, 0, Math.PI*2);
            this.ctx.fill();
        } else if (this.engine.player.faction === Faction.Hlaalu) {
           // Ferns/bushes
           this.ctx.fillStyle = '#166534';
           this.ctx.beginPath();
           this.ctx.ellipse(pt.x, pt.y - th*0.2, tw*0.4, th*0.2, 0, 0, Math.PI*2);
           this.ctx.fill();
           this.ctx.fillStyle = '#22c55e';
           this.ctx.beginPath();
           this.ctx.ellipse(pt.x, pt.y - th*0.3, tw*0.3, th*0.3, 0, 0, Math.PI*2);
           this.ctx.fill();
        } else {
           // Ashland rocks / vents
           this.ctx.fillStyle = '#453c33';
           this.ctx.beginPath();
           this.ctx.moveTo(pt.x - tw*0.2, pt.y);
           this.ctx.lineTo(pt.x, pt.y - th*0.6);
           this.ctx.lineTo(pt.x + tw*0.2, pt.y);
           this.ctx.fill();
        }
    }
    
    // Subtle edge lines
    this.ctx.strokeStyle = 'rgba(0,0,0, 0.05)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Draw map edges to create a floating island block effect
    const depth = 50 * zoom;
    if (gx === MAP_SIZE - 1) {
        // Right vertical face
        this.ctx.fillStyle = this.engine.player.faction === Faction.Redoran ? '#78505e' : '#5b4430'; // mud/dirt color
        this.ctx.beginPath();
        this.ctx.moveTo(pt.x, pt.y + th);
        this.ctx.lineTo(pt.x + tw, pt.y);
        this.ctx.lineTo(pt.x + tw, pt.y + depth);
        this.ctx.lineTo(pt.x, pt.y + th + depth);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        this.ctx.stroke();
    }
    if (gy === MAP_SIZE - 1) {
        // Left vertical face
        this.ctx.fillStyle = this.engine.player.faction === Faction.Redoran ? '#603c48' : '#453222'; // darker mud/dirt color
        this.ctx.beginPath();
        this.ctx.moveTo(pt.x - tw, pt.y);
        this.ctx.lineTo(pt.x, pt.y + th);
        this.ctx.lineTo(pt.x, pt.y + th + depth);
        this.ctx.lineTo(pt.x - tw, pt.y + depth);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        this.ctx.stroke();
    }
  }

  private drawUnit(u: Unit, screenX: number, screenY: number, zoom: number) {
    const size = 11 * zoom;
    const yOffset = 12 * zoom;

    let dX = 0;
    let dY = 0;
    if (u.action.type === 'Attack') {
        const atkAction = u.action as any;
        if (atkAction.animTimer && atkAction.animTimer > 0 && atkAction.targetX !== undefined && atkAction.targetY !== undefined) {
             const tPt = gridToScreen(atkAction.targetX, atkAction.targetY, this.engine.camera.x, this.engine.camera.y, zoom);
             const dist = Math.hypot(tPt.x - screenX, tPt.y - screenY);
             if (dist > 0) {
                 const bump = Math.sin(atkAction.animTimer * Math.PI / 0.2) * 5 * zoom; // bump forward
                 dX = ((tPt.x - screenX) / dist) * bump;
                 dY = ((tPt.y - screenY) / dist) * bump;
             }
        }
    }
    
    if (u.animState === 'walk') {
        dY += (u.animFrame % 2 === 0) ? -2 * zoom : 0;
        if (u.animFrame === 1 || u.animFrame === 3) {
            dX += (u.animFrame === 1) ? 1 * zoom : -1 * zoom;
        }
    }

    screenX += dX;
    screenY += dY;

    this.ctx.save();
    if (u.hitTimer && u.hitTimer > 0) {
        // Flash bright red/white
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.globalAlpha = 0.8;
    }

    // If villager, draw simple peasant clothing instead of heavy armor
    if (u.unitType === UnitType.Villager) {
       this.drawVillager(u, screenX, screenY, zoom, size, yOffset);
       this.ctx.restore();
       return;
    }

    if (u.faction === Faction.Telvanni) {
       this.drawTelvanniUnit(u, screenX, screenY, zoom, size, yOffset);
       this.ctx.restore();
       return;
    }

    // Bonemold Armor for Hlaalu / Redoran military
    const boneBase = '#e5d9a5'; // lighter bone
    const boneDark = '#b8a670'; // darker bone shadow
    const clothColor = u.faction === Faction.Redoran ? '#991b1b' : '#a16207'; // Red for Redoran, Yellow-Brown for Hlaalu

    // Cloth skirt/apron
    this.ctx.fillStyle = clothColor;
    this.ctx.beginPath();
    this.ctx.moveTo(screenX - size*0.6, screenY - yOffset + size*0.4);
    this.ctx.lineTo(screenX + size*0.6, screenY - yOffset + size*0.4);
    this.ctx.lineTo(screenX + size*0.8, screenY + size*0.5);
    this.ctx.lineTo(screenX - size*0.8, screenY + size*0.5);
    this.ctx.fill();

    // Chest Plate
    this.ctx.fillStyle = boneBase;
    this.ctx.strokeStyle = '#3f311c';
    this.ctx.lineWidth = 1 * zoom;
    this.ctx.beginPath();
    this.ctx.ellipse(screenX, screenY - yOffset, size * 0.9, size * 0.7, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Large Pauldrons (Shoulder pads)
    this.ctx.fillStyle = boneDark;
    this.ctx.beginPath();
    this.ctx.ellipse(screenX - size*0.9, screenY - yOffset - size*0.2, size*0.6, size*0.8, Math.PI/4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.ellipse(screenX + size*0.9, screenY - yOffset - size*0.2, size*0.6, size*0.8, -Math.PI/4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Cloth headwrap/mask under helm
    this.ctx.fillStyle = clothColor;
    this.ctx.beginPath();
    this.ctx.arc(screenX, screenY - yOffset - size * 0.4, size * 0.6, 0, Math.PI * 2);
    this.ctx.fill();

    // Helmet
    this.ctx.fillStyle = boneBase;
    if (u.unitType === UnitType.Spearman || u.unitType === UnitType.Swordsman) {
       // Watchman helm (Gah-Julan style)
       // Flat wide brim
       this.ctx.beginPath();
       this.ctx.ellipse(screenX, screenY - yOffset - size * 0.4, size * 1.3, size * 0.3, 0, 0, Math.PI * 2);
       this.ctx.fill();
       this.ctx.stroke();
       // Tall crest
       this.ctx.beginPath();
       this.ctx.moveTo(screenX - size*0.4, screenY - yOffset - size * 0.5);
       this.ctx.lineTo(screenX, screenY - yOffset - size * 1.4);
       this.ctx.lineTo(screenX + size*0.4, screenY - yOffset - size * 0.5);
       this.ctx.fill();
       this.ctx.stroke();
    } else {
       // Standard domed helm (Armun-An)
       this.ctx.beginPath();
       this.ctx.arc(screenX, screenY - yOffset - size * 0.5, size * 0.55, 0, Math.PI * 2);
       this.ctx.fill();
       this.ctx.stroke();
       
       this.ctx.fillStyle = '#000'; // face slit
       this.ctx.fillRect(screenX - size*0.3, screenY - yOffset - size*0.6, size*0.6, size*0.15);
    }

    if (u.unitType === UnitType.Hero) {
       // Large cape
       this.ctx.fillStyle = clothColor;
       this.ctx.beginPath();
       this.ctx.moveTo(screenX - size*0.8, screenY - yOffset);
       this.ctx.lineTo(screenX - size*1.5, screenY + size*1.2);
       this.ctx.lineTo(screenX + size*1.5, screenY + size*1.2);
       this.ctx.lineTo(screenX + size*0.8, screenY - yOffset);
       this.ctx.fill();
    }

    // Weapons
    this.ctx.save();
    this.ctx.translate(screenX, screenY - yOffset);
    let angle = 0;
    if (u.animState === 'attack') {
        angle = (u.animFrame % 2 === 0) ? -Math.PI / 4 : Math.PI / 4;
    } else if (u.animState === 'walk') {
        angle = (Math.sin(u.animFrame * Math.PI) * 0.1);
    }
    this.ctx.rotate(angle);

    if (u.unitType === UnitType.Archer) {
      // Chitin Bow
      this.ctx.strokeStyle = '#5a3d1b';
      this.ctx.lineWidth = 2 * zoom;
      this.ctx.beginPath();
      this.ctx.arc(size*0.8, 0, size*0.8, -Math.PI/2.5, Math.PI/2.5);
      this.ctx.stroke();
      // Arrow
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect(-size*0.2, 0, size*1.5, 1.5*zoom);
    } else if (u.unitType === UnitType.Swordsman || u.unitType === UnitType.Hero) {
      // Iron broadsword
      this.ctx.fillStyle = '#cbd5e1';
      this.ctx.strokeStyle = '#334155';
      this.ctx.lineWidth = 1 * zoom;
      this.ctx.beginPath();
      this.ctx.moveTo(size*0.6, size*0.3);
      this.ctx.lineTo(size*1.4, -size*0.8);
      this.ctx.lineTo(size*1.5, -size*0.5);
      this.ctx.lineTo(size*0.8, size*0.6);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    } else if (u.unitType === UnitType.Spearman) {
      // Chitin spear
      this.ctx.strokeStyle = '#451a03';
      this.ctx.lineWidth = 2 * zoom;
      this.ctx.beginPath();
      this.ctx.moveTo(-size*0.4, size*1.0);
      this.ctx.lineTo(size*1.5, -size*1.2);
      this.ctx.stroke();
      // Chitin spearhead
      this.ctx.fillStyle = boneBase;
      this.ctx.beginPath();
      this.ctx.moveTo(size*1.5, -size*1.2);
      this.ctx.lineTo(size*1.8, -size*1.8);
      this.ctx.lineTo(size*1.3, -size*1.4);
      this.ctx.fill();
      this.ctx.stroke();
    }
    
    this.ctx.restore();

    this.ctx.restore();

    // Health bar
    const p = u.hp / u.maxHp;
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(screenX - 12*zoom, screenY - yOffset - size - 8*zoom, 24*zoom, 4*zoom);
    this.ctx.fillStyle = p > 0.5 ? '#22c55e' : p > 0.25 ? '#eab308' : '#ef4444';
    this.ctx.fillRect(screenX - 12*zoom, screenY - yOffset - size - 8*zoom, (24*zoom) * p, 4*zoom);
  }

  private drawTelvanniUnit(u: Unit, screenX: number, screenY: number, zoom: number, size: number, yOffset: number) {
     if (u.unitType === UnitType.Archer || u.unitType === UnitType.Mage || u.unitType === UnitType.Villager || u.unitType === UnitType.Hero) {
        // Robes for mages / villagers
        this.ctx.fillStyle = u.unitType === UnitType.Hero ? '#7c2d12' : '#b45309'; // Dark orange/red, Hero gets deeper red
        this.ctx.fillRect(screenX - size*0.7, screenY - yOffset, size*1.4, yOffset);
        
        if (u.unitType === UnitType.Hero) {
           // Golden elaborate shoulders
           this.ctx.fillStyle = '#fef08a';
           this.ctx.beginPath();
           this.ctx.moveTo(screenX - size*1.2, screenY - yOffset);
           this.ctx.lineTo(screenX + size*1.2, screenY - yOffset);
           this.ctx.lineTo(screenX, screenY - yOffset + size*0.8);
           this.ctx.fill();
        }

        // Yellow trim
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.fillRect(screenX - size*0.3, screenY - yOffset, size*0.6, yOffset);
        
        // Head / blueish face
        this.ctx.fillStyle = '#60a5fa';
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY - yOffset - size*0.3, size*0.5, 0, Math.PI*2);
        this.ctx.fill();
        // Red eyes
        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillRect(screenX - size*0.2, screenY - yOffset - size*0.4, size*0.15, size*0.15);
        this.ctx.fillRect(screenX + size*0.05, screenY - yOffset - size*0.4, size*0.15, size*0.15);

        // Staff (for Mage / Hero)
        if (u.unitType === UnitType.Mage || u.unitType === UnitType.Hero) {
           this.ctx.save();
           this.ctx.translate(screenX + size*0.8, screenY - yOffset);
           let angle = 0;
           if (u.animState === 'attack') {
               angle = (u.animFrame % 2 === 0) ? -Math.PI / 4 : Math.PI / 4;
           } else if (u.animState === 'walk') {
               angle = (Math.sin(u.animFrame * Math.PI) * 0.1);
           }
           this.ctx.rotate(angle);

           this.ctx.strokeStyle = '#3f2c1f';
           this.ctx.lineWidth = 1.5 * zoom;
           this.ctx.beginPath();
           this.ctx.moveTo(0, yOffset);
           this.ctx.lineTo(0, -size*1.2);
           this.ctx.stroke();

           // Glowing crystal on top
           if (u.unitType === UnitType.Mage) {
               this.ctx.fillStyle = '#3b82f6';
               this.ctx.beginPath();
               this.ctx.moveTo(0, -size*1.6);
               this.ctx.lineTo(size*0.2, -size*1.3);
               this.ctx.lineTo(0, -size*1.2);
               this.ctx.lineTo(-size*0.2, -size*1.3);
               this.ctx.fill();
               // Inner glow
               this.ctx.fillStyle = '#bfdbfe';
               this.ctx.beginPath();
               this.ctx.arc(0, -size*1.35, size*0.15, 0, Math.PI*2);
               this.ctx.fill();
           }
           this.ctx.restore();
        }
     } else {
        // Guards/Hero: Golden bone armor with spiky crest
        const armorBase = '#ca8a04';
        const darkArmor = '#713f12';
        this.ctx.fillStyle = darkArmor;
        this.ctx.beginPath();
        this.ctx.ellipse(screenX, screenY - yOffset, size, size * 0.7, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Shoulders (Spiky)
        this.ctx.fillStyle = armorBase;
        this.ctx.beginPath();
        this.ctx.moveTo(screenX - size*1.4, screenY - yOffset - size*0.2);
        this.ctx.lineTo(screenX - size*0.6, screenY - yOffset + size*0.5);
        this.ctx.lineTo(screenX - size*0.8, screenY - yOffset - size*0.6);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(screenX + size*1.4, screenY - yOffset - size*0.2);
        this.ctx.lineTo(screenX + size*0.6, screenY - yOffset + size*0.5);
        this.ctx.lineTo(screenX + size*0.8, screenY - yOffset - size*0.6);
        this.ctx.fill();

        // Head / Helmet with tall spike
        this.ctx.fillStyle = '#a16207';
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY - yOffset - size*0.4, size*0.55, 0, Math.PI*2);
        this.ctx.fill();
        
        // Spike
        this.ctx.fillStyle = '#fde047';
        this.ctx.beginPath();
        this.ctx.moveTo(screenX - size*0.3, screenY - yOffset - size*0.8);
        this.ctx.lineTo(screenX, screenY - yOffset - size*1.8);
        this.ctx.lineTo(screenX + size*0.3, screenY - yOffset - size*0.8);
        this.ctx.fill();

        this.ctx.save();
        this.ctx.translate(screenX, screenY - yOffset);
        let angle = 0;
        if (u.animState === 'attack') {
            angle = (u.animFrame % 2 === 0) ? -Math.PI / 4 : Math.PI / 4;
        } else if (u.animState === 'walk') {
            angle = (Math.sin(u.animFrame * Math.PI) * 0.1);
        }
        this.ctx.rotate(angle);

        if (u.unitType === UnitType.Swordsman) {
           // Broad curved blade
           this.ctx.fillStyle = '#94a3b8';
           this.ctx.beginPath();
           this.ctx.moveTo(size*0.5, size*0.3);
           this.ctx.lineTo(size*1.5, -size*0.6);
           this.ctx.lineTo(size*1.2, -size*0.1);
           this.ctx.fill();
        } else if (u.unitType === UnitType.Spearman) {
           this.ctx.strokeStyle = '#3f2c1f';
           this.ctx.lineWidth = 1.5 * zoom;
           this.ctx.beginPath();
           this.ctx.moveTo(-size*0.4, yOffset);
           this.ctx.lineTo(size*1.2, -size*1.5);
           this.ctx.stroke();
        }

        this.ctx.restore();
     }

     if (u.selected || u.hp < u.maxHp) {
        const p = u.hp / u.maxHp;
        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.fillRect(screenX - 12*zoom, screenY - yOffset - size - 8*zoom, 24*zoom, 4*zoom);
        this.ctx.fillStyle = p > 0.5 ? '#22c55e' : p > 0.25 ? '#eab308' : '#ef4444';
        this.ctx.fillRect(screenX - 12*zoom, screenY - yOffset - size - 8*zoom, (24*zoom) * p, 4*zoom);
     }
  }

  private drawVillager(u: Unit, screenX: number, screenY: number, zoom: number, size: number, yOffset: number) {
      // Basic tunic and pants
      this.ctx.fillStyle = '#8c7760'; // dirty beige/grey tunic
      this.ctx.fillRect(screenX - size*0.5, screenY - yOffset, size, yOffset - size*0.2);
      this.ctx.fillStyle = '#3f3325'; // dark pants
      this.ctx.fillRect(screenX - size*0.4, screenY - size*0.4, size*0.8, size*0.4);

      // Head
      this.ctx.fillStyle = '#e8b897'; // skin tone
      this.ctx.beginPath();
      this.ctx.arc(screenX, screenY - yOffset - size*0.2, size*0.4, 0, Math.PI*2);
      this.ctx.fill();

      // Hair
      this.ctx.fillStyle = '#4a2c14'; // brown hair
      this.ctx.beginPath();
      this.ctx.arc(screenX, screenY - yOffset - size*0.3, size*0.45, Math.PI, 0);
      this.ctx.fill();

      // Pickaxe (Gathering tool)
      this.ctx.save();
      this.ctx.translate(screenX, screenY - yOffset + size*0.6);
      let angle = 0;
      if (u.animState === 'attack') {
          angle = (u.animFrame % 2 === 0) ? -Math.PI / 6 : Math.PI / 6;
      } else if (u.animState === 'walk') {
          angle = (Math.sin(u.animFrame * Math.PI) * 0.2);
      }
      this.ctx.rotate(angle);

      this.ctx.strokeStyle = '#78350f'; // wood handle
      this.ctx.lineWidth = 1.5 * zoom;
      this.ctx.beginPath();
      this.ctx.moveTo(size*0.2, 0);
      this.ctx.lineTo(size*1.2, -size*0.8);
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#94a3b8'; // iron head
      this.ctx.beginPath();
      this.ctx.arc(size*1.1, -size*0.9, size*0.4, Math.PI*0.8, Math.PI*1.8);
      this.ctx.fill();

      this.ctx.restore();

      // Health bar
      const p = u.hp / u.maxHp;
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(screenX - 12*zoom, screenY - yOffset - size - 8*zoom, 24*zoom, 4*zoom);
      this.ctx.fillStyle = p > 0.5 ? '#22c55e' : p > 0.25 ? '#eab308' : '#ef4444';
      this.ctx.fillRect(screenX - 12*zoom, screenY - yOffset - size - 8*zoom, (24*zoom) * p, 4*zoom);
  }

  private drawBuilding(b: Building, sx: number, sy: number, zoom: number) {
    this.ctx.save();
    if (b.hitTimer && b.hitTimer > 0) {
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.globalAlpha = 0.8;
    }

    let color = colors[b.faction];
    let w = 30 * zoom;
    let h = 20 * zoom;

    if (b.buildingType === BuildingType.TownCenter) {
      w = 60 * zoom; h = 40 * zoom;
    } else if (b.buildingType === BuildingType.Barracks) {
      w = 40 * zoom; h = 20 * zoom; color = '#723a3a'; 
    } else if (b.buildingType === BuildingType.Smithy) {
      w = 35 * zoom; h = 15 * zoom; color = '#696969'; 
    } else if (b.buildingType === BuildingType.Temple) {
      w = 45 * zoom; h = 50 * zoom; color = '#483d8b'; 
    }
    
    const baseColor = b.buildingType === BuildingType.House || b.buildingType === BuildingType.TownCenter ? color : mixColors(color, colors[b.faction], 0.5);

    if (b.faction === Faction.Telvanni) {
       // Mushroom tower style - lower stem so it doesn't float
       this.drawMushroomBuilding(sx, sy + h * 0.3, w, h, baseColor, zoom);
    } else if (b.faction === Faction.Redoran) {
       // Bug shell - base was drawn at y - h*0.4, so we offset y down by h*0.4
       this.drawRedoranBuilding(sx, sy + h * 0.4, w, h, baseColor, zoom);
    } else {
       // Hlaalu - isometric block starts at y + w*0.5 to center on tile
       this.drawHlaaluBuilding(sx, sy + w * 0.5, w, h, zoom);
    }
    
    // Scaffolding or transparency if not built
    if (!b.isBuilt) {
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(sx - w, sy - h - w*0.5, w*2, h + w*0.5);
        // Draw some wooden scaffolding lines
        this.ctx.strokeStyle = '#6b4c2a';
        this.ctx.lineWidth = 2 * zoom;
        this.ctx.beginPath();
        this.ctx.moveTo(sx - w*0.8, sy);
        this.ctx.lineTo(sx - w*0.2, sy - h);
        this.ctx.moveTo(sx + w*0.8, sy);
        this.ctx.lineTo(sx + w*0.2, sy - h);
        this.ctx.stroke();
    }
    
    if (b.hp < b.maxHp) {
      const p = b.hp / b.maxHp;
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(sx - 20*zoom, sy - h - w - 10*zoom, 40*zoom, 4*zoom);
      this.ctx.fillStyle = b.isBuilt ? 'lime' : '#fb923c'; // Orange when building, lime when finished
      this.ctx.fillRect(sx - 20*zoom, sy - h - w - 10*zoom, (40*zoom) * p, 4*zoom);
    }
    
    if (b.buildQueue && b.buildQueue.length > 0) {
      const q = b.buildQueue[0];
      const p = 1 - (q.timer / q.maxTimer);
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(sx - 20*zoom, sy - h - w - 16*zoom, 40*zoom, 4*zoom);
      this.ctx.fillStyle = '#3b82f6';
      this.ctx.fillRect(sx - 20*zoom, sy - h - w - 16*zoom, (40*zoom) * p, 4*zoom);
      
      this.ctx.fillStyle = 'white';
      this.ctx.font = `${10*zoom}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`Training ${b.buildQueue.length}`, sx, sy - h - w - 20*zoom);
    }
    
    this.ctx.restore();
  }

  private drawMushroomBuilding(x: number, y: number, w: number, h: number, color: string, zoom: number) {
      // Winding root stems (drawn before main stem for slight overlap)
      this.ctx.strokeStyle = '#4a3d2c';
      this.ctx.lineWidth = w * 0.2;
      this.ctx.lineCap = 'round';
      
      this.ctx.beginPath();
      this.ctx.moveTo(x - w*0.4, y);
      this.ctx.quadraticCurveTo(x - w*0.8, y - h*0.3, x - w*0.2, y - h*0.6);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(x + w*0.3, y);
      this.ctx.quadraticCurveTo(x + w*0.6, y - h*0.4, x + w*0.1, y - h*0.7);
      this.ctx.stroke();

      // Main Stem
      const stemGrad = this.ctx.createLinearGradient(x - w*0.4, y, x + w*0.4, y);
      stemGrad.addColorStop(0, '#5c4e36');
      stemGrad.addColorStop(0.5, '#87704b');
      stemGrad.addColorStop(1, '#3b3120');
      this.ctx.fillStyle = stemGrad;
      this.ctx.beginPath();
      this.ctx.ellipse(x, y - h*0.3, w*0.3, h*0.8, 0, 0, Math.PI*2);
      this.ctx.fill();

      // Smaller side mushroom caps (if it's a larger building)
      if (w > 35 * zoom) {
         this.drawMushroomCap(x - w*0.6, y - h*0.5, w*0.5, h*0.5, color, zoom);
         this.drawMushroomCap(x + w*0.5, y - h*0.7, w*0.4, h*0.4, color, zoom);
      }

      // Main Cap
      this.drawMushroomCap(x, y - h, w, h, color, zoom);

      // Glowing Rune Door / Window
      this.ctx.fillStyle = '#1e3a8a'; // dark doorway
      this.ctx.beginPath();
      this.ctx.ellipse(x, y - h*0.15, w*0.15, h*0.2, 0, Math.PI, 0); // arched door
      this.ctx.fill();
      
      this.ctx.fillStyle = '#60a5fa'; // glowing rune/light
      this.ctx.beginPath();
      this.ctx.arc(x, y - h*0.4, w*0.08, 0, Math.PI*2);
      this.ctx.fill();
      // Inner bright glow
      this.ctx.fillStyle = '#eff6ff';
      this.ctx.beginPath();
      this.ctx.arc(x, y - h*0.4, w*0.04, 0, Math.PI*2);
      this.ctx.fill();
  }

  private drawMushroomCap(x: number, y: number, w: number, h: number, color: string, zoom: number) {
      const capGrad = this.ctx.createRadialGradient(x - w*0.2, y - w*0.2, 2*zoom, x, y, w);
      capGrad.addColorStop(0, mixColors(color, '#ffffff', 0.4));
      capGrad.addColorStop(0.6, color);
      capGrad.addColorStop(1, mixColors(color, '#000000', 0.5));
      
      this.ctx.fillStyle = capGrad;
      this.ctx.beginPath();
      this.ctx.ellipse(x, y, w*0.9, w*0.6, 0, Math.PI, 0); // top half
      this.ctx.ellipse(x, y, w*0.9, w*0.2, 0, 0, Math.PI); // bottom rounding
      this.ctx.fill();

      // Veins/Spots on cap
      this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
      this.ctx.beginPath();
      this.ctx.ellipse(x - w*0.4, y - w*0.2, w*0.1, w*0.05, Math.PI/4, 0, Math.PI*2);
      this.ctx.ellipse(x + w*0.3, y - w*0.1, w*0.15, w*0.08, -Math.PI/6, 0, Math.PI*2);
      this.ctx.fill();
  }

  private drawRedoranBuilding(x: number, y: number, w: number, h: number, color: string, zoom: number) {
      const grad = this.ctx.createRadialGradient(x - w*0.3, y - h*0.5, 2*zoom, x, y, w);
      grad.addColorStop(0, mixColors(color, '#ffffff', 0.5));
      grad.addColorStop(0.5, color);
      grad.addColorStop(0.8, mixColors(color, '#000000', 0.4));
      grad.addColorStop(1, mixColors(color, '#000000', 0.7));
      
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.ellipse(x, y - h*0.4, w*0.8, h*0.8 + w*0.3, 0, Math.PI, 0); 
      this.ctx.fill();

      // Lower dome half
      this.ctx.fillStyle = mixColors(color, '#000000', 0.2);
      this.ctx.beginPath();
      this.ctx.ellipse(x, y - h*0.4, w*0.8, w*0.4, 0, 0, Math.PI); 
      this.ctx.fill();

      // Multiple Shell ridges overlapping
      this.ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      this.ctx.lineWidth = 1.5 * zoom;
      
      for(let i=0; i<4; i++) {
          this.ctx.beginPath();
          const rW = w * 0.8 * (1 - i*0.15);
          const rH = h * 0.8 * (1 - i*0.1);
          this.ctx.ellipse(x, y - h*0.4, rW, rH + w*0.3, 0, Math.PI, 0);
          this.ctx.stroke();
      }

      // Small round chitin windows / vents
      for(let i=0; i<3; i++) {
         this.ctx.fillStyle = '#4a2511'; // dark amber
         this.ctx.beginPath();
         this.ctx.ellipse(x - w*0.4 + i*w*0.4, y - h*0.6, 3*zoom, 5*zoom, Math.PI/4, 0, Math.PI*2);
         this.ctx.fill();
         this.ctx.strokeStyle = '#2b1509';
         this.ctx.stroke();
         // glow
         this.ctx.fillStyle = '#f59e0b';
         this.ctx.beginPath();
         this.ctx.arc(x - w*0.4 + i*w*0.4, y - h*0.6, 1*zoom, 0, Math.PI*2);
         this.ctx.fill();
      }

      // Front entrance mandible
      this.ctx.fillStyle = '#4c4238';
      this.ctx.beginPath();
      this.ctx.moveTo(x - w*0.3, y - h*0.2);
      this.ctx.quadraticCurveTo(x, y - h*0.6, x + w*0.3, y - h*0.2);
      this.ctx.fill();
      this.ctx.fillStyle = '#111';
      this.ctx.beginPath();
      this.ctx.ellipse(x, y - h*0.2, w*0.2, h*0.2, 0, Math.PI, 0);
      this.ctx.fill();
  }

  private drawHlaaluBuilding(x: number, y: number, w: number, h: number, zoom: number) {
      // Hlaalu architecture is yellow-brown adobe blocks, flat roofs, often with jutting wooden poles and staircases.
      const baseColor = '#c2a578'; // Warm sandy tan
      const darkColor = '#8b704c'; // Shadows
      const roofColor = '#e0c99f'; // Lighter roof
      
      // Main block
      this.ctx.fillStyle = baseColor;
      this.ctx.beginPath();
      // left face
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x - w, y - w*0.5);
      this.ctx.lineTo(x - w, y - w*0.5 - h);
      this.ctx.lineTo(x, y - h);
      this.ctx.fill();
      // right face
      this.ctx.fillStyle = darkColor;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + w, y - w*0.5);
      this.ctx.lineTo(x + w, y - w*0.5 - h);
      this.ctx.lineTo(x, y - h);
      this.ctx.fill();
      // top roof
      this.ctx.fillStyle = roofColor;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y - h);
      this.ctx.lineTo(x - w, y - h - w*0.5);
      this.ctx.lineTo(x, y - h - w);
      this.ctx.lineTo(x + w, y - h - w*0.5);
      this.ctx.fill();
      
      // Wireframe edge
      this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      this.ctx.stroke();

      // Flat roof borders (parapets) typical of Hlaalu structure
      const ph = 4 * zoom; // parapet height
      this.ctx.fillStyle = baseColor;
      this.ctx.beginPath();
      this.ctx.moveTo(x - w, y - h - w*0.5);
      this.ctx.lineTo(x, y - h);
      this.ctx.lineTo(x + w, y - h - w*0.5);
      this.ctx.lineTo(x + w, y - h - w*0.5 - ph);
      this.ctx.lineTo(x, y - h - ph);
      this.ctx.lineTo(x - w, y - h - w*0.5 - ph);
      this.ctx.fill();
      
      // Doorway with classic Hlaalu arch/pillars
      this.ctx.fillStyle = '#4a3d2c'; // dark wood/door
      this.ctx.beginPath();
      // Door on the left face
      this.ctx.moveTo(x - w*0.5, y - w*0.25);
      this.ctx.lineTo(x - w*0.2, y - w*0.1);
      this.ctx.lineTo(x - w*0.2, y - w*0.1 - h*0.4); // height of door
      // Arch
      this.ctx.quadraticCurveTo(x - w*0.35, y - w*0.1 - h*0.5, x - w*0.5, y - w*0.25 - h*0.4);
      this.ctx.fill();

      // Outside pillars wrapping the door
      this.ctx.fillStyle = roofColor;
      this.ctx.fillRect(x - w*0.55, y - w*0.25 - h*0.4, 4*zoom, h*0.4);
      this.ctx.fillRect(x - w*0.15, y - w*0.1 - h*0.4, 4*zoom, h*0.4);

      // Jutting wooden beams
      this.ctx.fillStyle = '#3e2713';
      for(let i=0; i<3; i++) {
         const bx = x + w*0.3 + (i * w*0.2);
         const by = y - h*0.8 - w*0.15 - (i * w*0.1);
         this.ctx.beginPath();
         this.ctx.arc(bx, by, 1.5*zoom, 0, Math.PI*2);
         this.ctx.fill();
      }

      // Small wooden windows on the right face
      this.ctx.fillStyle = '#1e1a17';
      for(let i=1; i<3; i++) {
         const wx = x + w*0.25 * i;
         const wy = y - w*0.125 * i - h*0.4;
         this.ctx.fillRect(wx, wy, 4*zoom, 8*zoom);
         // Window frames
         this.ctx.strokeStyle = '#4a3d2c';
         this.ctx.lineWidth = 1 * zoom;
         this.ctx.strokeRect(wx, wy, 4*zoom, 8*zoom);
      }
      
      // If it's a very large building, add a secondary tier / dome
      if (w > 35 * zoom) {
          const tw = w * 0.5;
          const th = h * 0.6;
          const tx = x;
          const ty = y - h - w*0.5;
          // Secondary block on roof
          this.drawCube(tx, ty + th, tw, th, baseColor);
          
          // Dome
          this.ctx.fillStyle = roofColor;
          this.ctx.beginPath();
          this.ctx.arc(tx, ty - th*0.5, tw*0.8, Math.PI, 0);
          this.ctx.fill();
      }
  }

  private drawResource(r: ResourceNode, sx: number, sy: number, zoom: number) {
     if (r.resourceType === ResourceType.Wood) {
        // Draw alien mushroom tree or twisted tree (Morrowind style)
        this.ctx.fillStyle = '#4b3b24';
        this.ctx.fillRect(sx - 2*zoom, sy - 20*zoom, 4*zoom, 20*zoom);
        
        // gradient for mushroom cap
        const capGrad = this.ctx.createRadialGradient(sx - 5*zoom, sy - 25*zoom, 2*zoom, sx, sy - 20*zoom, 15*zoom);
        capGrad.addColorStop(0, '#d1b88e');
        capGrad.addColorStop(1, '#78613a');
        
        this.ctx.fillStyle = capGrad; 
        this.ctx.beginPath();
        this.ctx.ellipse(sx, sy - 20*zoom, 15*zoom, 8*zoom, 0, 0, Math.PI * 2);
        this.ctx.fill();
     } else if (r.resourceType === ResourceType.Food) {
        // Draw Kwama egg clutch
        this.ctx.fillStyle = '#4a4435'; // nest base shadowed
        this.ctx.beginPath();
        this.ctx.ellipse(sx, sy - 1*zoom, 12*zoom, 6*zoom, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#e3dac5'; // egg color
        const drawEgg = (ex: number, ey: number, rx: number, ry: number, rot: number) => {
            const rad = this.ctx.createRadialGradient(ex - rx*0.3, ey - ry*0.3, rx*0.2, ex, ey, rx);
            rad.addColorStop(0, '#ffffff');
            rad.addColorStop(0.7, '#e3dac5');
            rad.addColorStop(1, '#a19a8a');
            this.ctx.fillStyle = rad;
            this.ctx.beginPath();
            this.ctx.ellipse(ex, ey, rx, ry, rot, 0, Math.PI*2);
            this.ctx.fill();
        };

        drawEgg(sx - 4*zoom, sy - 5*zoom, 4*zoom, 6*zoom, Math.PI/6);
        drawEgg(sx + 4*zoom, sy - 4*zoom, 4*zoom, 6*zoom, -Math.PI/6);
        drawEgg(sx, sy - 7*zoom, 5*zoom, 7*zoom, 0);
     } else if (r.resourceType === ResourceType.Gold) {
        // Draw Ore Vein
        const rockGrad = this.ctx.createLinearGradient(sx, sy - 14*zoom, sx, sy);
        rockGrad.addColorStop(0, '#5a5a5a');
        rockGrad.addColorStop(1, '#222222');
        this.ctx.fillStyle = rockGrad;
        this.ctx.beginPath();
        this.ctx.moveTo(sx - 12*zoom, sy + 2*zoom);
        this.ctx.lineTo(sx - 6*zoom, sy - 12*zoom);
        this.ctx.lineTo(sx + 4*zoom, sy - 14*zoom);
        this.ctx.lineTo(sx + 12*zoom, sy - 2*zoom);
        this.ctx.closePath();
        this.ctx.fill();
        
        // ore flecks
        this.ctx.fillStyle = '#ffec8b'; // gold bright
        this.ctx.fillRect(sx - 4*zoom, sy - 8*zoom, 3*zoom, 3*zoom);
        this.ctx.fillRect(sx + 2*zoom, sy - 5*zoom, 4*zoom, 2*zoom);
        this.ctx.fillRect(sx - 8*zoom, sy - 3*zoom, 3*zoom, 2*zoom);
     } else {
        this.drawCube(sx, sy, 15*zoom, 10*zoom, resourceColors[r.resourceType]);
     }
  }

  private drawCube(x: number, y: number, w: number, h: number, color: string) {
    // Front right face (lighter)
    this.ctx.fillStyle = mixColors(color, '#ffffff', 0.1);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y); 
    this.ctx.lineTo(x + w, y - w*0.5); 
    this.ctx.lineTo(x + w, y - w*0.5 - h); 
    this.ctx.lineTo(x, y - h); 
    this.ctx.closePath();
    this.ctx.fill();
    
    // Front left face (darker)
    this.ctx.fillStyle = mixColors(color, '#000000', 0.3);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x - w, y - w*0.5);
    this.ctx.lineTo(x - w, y - w*0.5 - h);
    this.ctx.lineTo(x, y - h);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Top face
    this.ctx.fillStyle = mixColors(color, '#ffffff', 0.3);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - h);
    this.ctx.lineTo(x + w, y - h - w*0.5);
    this.ctx.lineTo(x, y - h - w);
    this.ctx.lineTo(x - w, y - h - w*0.5);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Wireframe edges subtle
    this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  private drawIsoEllipse(x: number, y: number, rw: number, rh: number) {
     this.ctx.beginPath();
     this.ctx.ellipse(x, y, rw, rh, 0, 0, Math.PI*2);
  }
}
