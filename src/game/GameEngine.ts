import { Faction, ResourceType, Resources, UnitType, BuildingType, COSTS, MAP_SIZE, Vector2, UpgradeType, gridToScreen } from './constants';
import { AudioSystem } from './audio';

const generateId = () => Math.random().toString(36).substring(2, 9);

export interface Entity {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  selected: boolean;
  radius: number;
  hitTimer?: number;
}

export type Action = 
  | { type: 'Idle' }
  | { type: 'Move', target: Vector2 }
  | { type: 'Gather', targetId: string, resourceType: ResourceType, timer: number }
  | { type: 'ReturnCargo', targetId: string }
  | { type: 'Build', targetId: string, timer: number }
  | { type: 'Attack', targetId: string, timer: number, animTimer?: number, targetX?: number, targetY?: number }
  | { type: 'Repair', targetId: string, timer: number };

export interface Unit extends Entity {
  kind: 'unit';
  unitType: UnitType;
  faction: Faction;
  action: Action;
  inventory?: { type: ResourceType; amount: number };
  animState: 'idle' | 'walk' | 'attack';
  animFrame: number;
  animTimer: number;
}

export interface Building extends Entity {
  kind: 'building';
  buildingType: BuildingType;
  faction: Faction;
  isBuilt: boolean;
  buildProgress: number;
  buildQueue?: { unitType: UnitType, timer: number, maxTimer: number }[];
}

export interface ResourceNode extends Entity {
  kind: 'resource';
  resourceType: ResourceType;
  amount: number;
}

type Subscriber = () => void;

export class GameEngine {
  units: Unit[] = [];
  buildings: Building[] = [];
  resources: ResourceNode[] = [];
  terrainGrid: number[][] = [];
  mapSeed: number = Math.random() * 1000;
  placementMode: { buildingType: BuildingType, builderId: string } | null = null;
  
  player: {
    faction: Faction;
    resources: Resources;
    pop: number;
    maxPop: number;
    upgrades: string[];
  };

  private lastTime: number = performance.now();
  private subscribers: Set<Subscriber> = new Set();
  public isRunning = false;
  private animationFrameId: number = 0;
  
  public gameTime = 0; // In seconds
  public dayDuration = 60; // 60 seconds per full day/night cycle
  public gameState: 'playing' | 'won' | 'lost' = 'playing';

  public timeMultiplier = 1;
  public isPaused = false;
  
  public message: string | null = null;
  public messageTimer: number = 0;

  public notifyMessage(msg: string) {
      this.message = msg;
      this.messageTimer = 5; // 5 seconds
      this.notify();
  }
  public camera = { x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500, y: 100, zoom: 1 };
  public keys: Record<string, boolean> = {};
  public mousePos = { x: -1, y: -1, active: false };
  public waypoints: { x: number, y: number, timer: number }[] = [];
  public particles: { x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, maxLife: number, color: string, size: number }[] = [];

  // Enemy state
  private enemyFactions: Faction[] = [];
  private enemyPop = 3;
  private nextEnemySpawn = 20; // Will be used when aggro starts
  public enemiesAggro = false;
  public audio: AudioSystem = new AudioSystem();

  constructor(faction: Faction) {
    this.player = {
      faction,
      resources: { [ResourceType.Food]: 100, [ResourceType.Wood]: 100, [ResourceType.Gold]: 100, [ResourceType.Stone]: 0 },
      upgrades: [],
      pop: 3,
      maxPop: 15,
    };
    
    // Pick enemy factions
    this.enemyFactions = Object.values(Faction).filter(f => f !== faction);
    
    this.generateMap();
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  setSpeed(mult: number) {
     this.isPaused = mult === 0;
     if (mult > 0) this.timeMultiplier = mult;
     this.notify();
  }

  resetCamera() {
     this.camera = { x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500, y: 100, zoom: 0.5 };
     this.notify();
  }

  stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
  }

  subscribe(cb: Subscriber) {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  private notify() {
    this.subscribers.forEach(cb => cb());
  }

  private loop = () => {
    if (!this.isRunning) return;
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000; // seconds
    this.lastTime = now;
    
    this.update(dt);
    
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private generateMap() {
    // Generate terrain heights via pseudo-noise
    for (let x = 0; x < MAP_SIZE; x++) {
      this.terrainGrid[x] = [];
      for (let y = 0; y < MAP_SIZE; y++) {
         const nx = x * 0.15;
         const ny = y * 0.15;
         let val = Math.sin(nx + this.mapSeed) * Math.cos(ny - this.mapSeed) * 0.5;
         val += Math.sin(nx * 0.5 - this.mapSeed) * Math.cos(ny * 0.5 + this.mapSeed) * 0.5;
         this.terrainGrid[x][y] = val; // Range roughly -1 to 1
      }
    }

    const allFactions = [this.player.faction, ...this.enemyFactions];
    
    // Distribute town centers roughly in a triangle/circle on the map
    const radius = MAP_SIZE * 0.35;
    const center = MAP_SIZE / 2;

    allFactions.forEach((f, idx) => {
       const angle = (idx / allFactions.length) * Math.PI * 2 - Math.PI / 2;
       const x = center + Math.cos(angle) * radius;
       const y = center + Math.sin(angle) * radius;
       
       const tc: Building = {
          id: generateId(),
          kind: 'building',
          buildingType: BuildingType.TownCenter,
          faction: f,
          x,
          y,
          hp: 2000,
          maxHp: 2000,
          radius: 1.5,
          selected: false,
          isBuilt: true,
          buildProgress: 100
       };
       this.buildings.push(tc);

       if (f === this.player.faction) {
           const pt = gridToScreen(x, y, 0, 0, 1);
           // We want to set the camera such that `pt` is roughly in the center of the screen vertically, but let's just do grid coords -> world coords
           this.camera = { x: pt.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 500), y: pt.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 100), zoom: 1.5 };
       }

       // Initial units
       const isEnemy = f !== this.player.faction;
       const villagerCount = 3;
       for (let i = 0; i < villagerCount; i++) {
         this.units.push({
           id: generateId(),
           kind: 'unit',
           unitType: UnitType.Villager,
           faction: f,
           x: tc.x + (Math.random() * 2 - 1) * 4,
           y: tc.y + (Math.random() * 2 - 1) * 4,
           hp: 50,
           maxHp: 50,
           radius: 0.3,
           selected: false,
           action: { type: 'Idle' },
           animState: 'idle',
           animFrame: 0,
           animTimer: 0
         });
       }

       if (isEnemy) {
          // Spawn guards outside their base immediately so you fight outside
          for (let i = 0; i < 4; i++) {
            this.units.push({
              id: generateId(),
              kind: 'unit',
              unitType: Math.random() > 0.5 ? UnitType.Spearman : UnitType.Swordsman,
              faction: f,
              x: tc.x + (Math.random() * 2 - 1) * 6,
              y: tc.y + (Math.random() * 2 - 1) * 6,
              hp: 150, maxHp: 150, radius: 0.3, selected: false,
              action: { type: 'Idle' },
              animState: 'idle',
              animFrame: 0,
              animTimer: 0
            });
          }
       }
    });

    // Generate resources
    // Scattered timber (Wood)
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * MAP_SIZE;
        const y = Math.random() * MAP_SIZE;
        this.resources.push({
          id: generateId(), kind: 'resource', resourceType: ResourceType.Wood, x, y, hp: 1, maxHp: 1, radius: 0.4, selected: false, amount: 150
        });
    }
    // 4 Egg Mines (Food) and 4 Ore Mines (Gold)
    for (const res of [ResourceType.Food, ResourceType.Gold]) {
      for (let i = 0; i < 4; i++) {
        const x = MAP_SIZE * 0.2 + Math.random() * MAP_SIZE * 0.6;
        const y = MAP_SIZE * 0.2 + Math.random() * MAP_SIZE * 0.6;
        this.resources.push({
          id: generateId(),
          kind: 'resource',
          resourceType: res,
          x, y,
          hp: 1, maxHp: 1, radius: 0.8, selected: false,
          amount: 5000 // rich mines
        });
      }
    }
  }

  update(dt: number) {
    // Camera panning
    const camSpeed = 800 * dt * (1 / this.camera.zoom); // move faster when zoomed out
    let camMoved = false;
    
    let panX = 0;
    let panY = 0;
    
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) panX = 1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) panX = -1;
    if (this.keys['ArrowUp'] || this.keys['KeyW']) panY = 1;
    if (this.keys['ArrowDown'] || this.keys['KeyS']) panY = -1;
    
    // Edge panning
    if (this.mousePos.active && typeof window !== 'undefined') {
        const edgeThreshold = 30; // pixels
        if (this.mousePos.x < edgeThreshold) panX = 1;
        else if (this.mousePos.x > window.innerWidth - edgeThreshold) panX = -1;
        
        if (this.mousePos.y < edgeThreshold) panY = 1;
        else if (this.mousePos.y > window.innerHeight - edgeThreshold) panY = -1;
    }
    
    if (panX !== 0) { this.camera.x += camSpeed * panX; camMoved = true; }
    if (panY !== 0) { this.camera.y += camSpeed * panY; camMoved = true; }
    
    // clamp camera roughly near map
    this.camera.x = Math.max(-1000, Math.min(2000, this.camera.x));
    this.camera.y = Math.max(-1000, Math.min(1000, this.camera.y));

    if (camMoved) this.notify();

    if (this.gameState !== 'playing') return;
    if (this.isPaused) return;
    
    dt *= this.timeMultiplier;
    this.gameTime += dt;
    const SPEED = 4;
    let needsUpdate = false;

    if (this.messageTimer > 0) {
        this.messageTimer -= dt;
        if (this.messageTimer <= 0) {
            this.message = null;
            needsUpdate = true;
        }
    }

    // Waypoints
    for (let i = this.waypoints.length - 1; i >= 0; i--) {
       this.waypoints[i].timer -= dt;
       if (this.waypoints[i].timer <= 0) {
          this.waypoints.splice(i, 1);
       }
    }

    // Unit Separation (Boids style soft collision)
    const pushPower = 3 * dt;
    for (let i = 0; i < this.units.length; i++) {
       for (let j = i + 1; j < this.units.length; j++) {
          const u1 = this.units[i];
          const u2 = this.units[j];
          if (u1.action.type !== 'Gather' && u2.action.type !== 'Gather') { // let them gather tightly
              let dx = u2.x - u1.x;
              let dy = u2.y - u1.y;
              let distSq = dx*dx + dy*dy;
              if (distSq === 0) {
                 dx = (Math.random() - 0.5) * 0.1;
                 dy = (Math.random() - 0.5) * 0.1;
                 distSq = dx*dx + dy*dy;
              }
              const minSep = u1.radius + u2.radius + 0.1;
              if (distSq < minSep * minSep) {
                 const dist = Math.sqrt(distSq);
                 const nx = dx / dist;
                 const ny = dy / dist;
                 u1.x -= nx * pushPower;
                 u1.y -= ny * pushPower;
                 u2.x += nx * pushPower;
                 u2.y += ny * pushPower;
                 needsUpdate = true;
              }
          }
       }
    }
    
    // Enemy AI Spawn
    for (const faction of this.enemyFactions) {
       if (this.enemiesAggro && this.gameTime > this.nextEnemySpawn) {
           const enemyTc = this.buildings.find(b => b.faction === faction && b.buildingType === BuildingType.TownCenter);
           if (enemyTc) {
               this.units.push({
                  id: generateId(),
                  kind: 'unit',
                  unitType: Math.random() > 0.6 ? UnitType.Swordsman : (Math.random() > 0.5 ? UnitType.Spearman : UnitType.Archer),
                  faction: faction,
                  x: enemyTc.x + (Math.random() * 2 - 1) * 3,
                  y: enemyTc.y + (Math.random() * 2 - 1) * 3,
                  hp: 150, maxHp: 150, radius: 0.3, selected: false,
                  action: { type: 'Idle' },
                  animState: 'idle',
                  animFrame: 0,
                  animTimer: 0
               });
               needsUpdate = true;
           }
       }
    }
    if (this.enemiesAggro && this.gameTime > this.nextEnemySpawn) {
        this.nextEnemySpawn = this.gameTime + 20; // spawn every 20s
    }

    // Remove dead units/buildings
    const deadUnits = this.units.filter(u => u.hp <= 0);
    const deadBuildings = this.buildings.filter(b => b.hp <= 0);
    if (deadUnits.length > 0) {
        deadUnits.forEach(u => {
           // Blood splatter
           for(let i=0; i<8; i++) {
               this.particles.push({
                   x: u.x, y: u.y, z: 0.5,
                   vx: (Math.random() - 0.5) * 5,
                   vy: (Math.random() - 0.5) * 5,
                   vz: Math.random() * 5 + 2,
                   life: 2.0 + Math.random(),
                   maxLife: 3.0,
                   color: '#7f1d1d', // Deep red
                   size: 0.1 + Math.random() * 0.15
               });
           }
        });
        this.units = this.units.filter(u => u.hp > 0);
        needsUpdate = true;
    }
    if (deadBuildings.length > 0) {
        deadBuildings.forEach(b => {
           // Debris
           for(let i=0; i<15; i++) {
               this.particles.push({
                   x: b.x + (Math.random()-0.5)*b.radius*2, 
                   y: b.y + (Math.random()-0.5)*b.radius*2,
                   z: Math.random() * 2,
                   vx: (Math.random() - 0.5) * 3,
                   vy: (Math.random() - 0.5) * 3,
                   vz: Math.random() * 6 + 3,
                   life: 3.0 + Math.random()*2,
                   maxLife: 5.0,
                   color: '#4b5563', // Ash/stone debris
                   size: 0.2 + Math.random() * 0.3
               });
           }
        });
        this.buildings = this.buildings.filter(b => b.hp > 0);
        needsUpdate = true;
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) {
            this.particles.splice(i, 1);
            needsUpdate = true;
        } else {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.z += p.vz * dt;
            p.vz -= 15 * dt; // gravity
            if (p.z < 0) {
                p.z = 0;
                p.vz *= -0.5;
                p.vx *= 0.8;
                p.vy *= 0.8;
            }
            needsUpdate = true;
        }
    }

    // Decay hitTimer
    for (const e of [...this.units, ...this.buildings]) {
       if (e.hitTimer && e.hitTimer > 0) {
          e.hitTimer -= dt;
          if (e.hitTimer < 0) e.hitTimer = 0;
          needsUpdate = true;
       }
    }

    // Construction of buildings
    for (const b of this.buildings) {
        if (!b.isBuilt) {
            b.buildProgress += dt * 2; // 50s to build
            b.hp = Math.min(b.maxHp, Math.max(10, b.maxHp * (b.buildProgress / 100)));
            needsUpdate = true;
            if (b.buildProgress >= 100) {
                b.buildProgress = 100;
                b.isBuilt = true;
                if (b.buildingType === BuildingType.House) {
                    // It's player-specific right now only for max pop, let's just do it for player
                    if (b.faction === this.player.faction) {
                        this.player.maxPop = Math.min(100, this.player.maxPop + 5);
                    }
                }
            }
        }
    }
    
    // Process building queues
    for (const b of this.buildings) {
        if (b.buildQueue && b.buildQueue.length > 0) {
            const currentItem = b.buildQueue[0];
            currentItem.timer -= dt;
            needsUpdate = true;
            if (currentItem.timer <= 0) {
                 b.buildQueue.shift();
                 this.units.push({
                    id: generateId(),
                    kind: 'unit',
                    unitType: currentItem.unitType,
                    faction: b.faction,
                    x: b.x + (Math.random() * 2 - 1) * 2,
                    y: b.y + (Math.random() * 2 - 1) * 2,
                    hp: currentItem.unitType === UnitType.Hero ? 500 : (currentItem.unitType === UnitType.Villager ? 50 : 150),
                    maxHp: currentItem.unitType === UnitType.Hero ? 500 : (currentItem.unitType === UnitType.Villager ? 50 : 150),
                    radius: currentItem.unitType === UnitType.Hero ? 0.4 : 0.3,
                    selected: false,
                    action: { type: 'Idle' },
                    animState: 'idle',
                    animFrame: 0,
                    animTimer: 0
                 });
                 if (currentItem.unitType === UnitType.Hero) {
                     this.notifyMessage('A Hortator is summoned!');
                 }
            }
        }
    }
    
    // Check Win/Loss
    const myTc = this.buildings.find(b => b.faction === this.player.faction && b.buildingType === BuildingType.TownCenter);
    
    // A player loses if they have no TownCenter and no units
    if (!myTc && this.units.filter(u=>u.faction===this.player.faction).length === 0) {
        this.gameState = 'lost';
        this.notify();
        return;
    }

    // Checking if all enemy factions are wiped out
    let enemiesAlive = false;
    for (const faction of this.enemyFactions) {
        const enemyTc = this.buildings.find(b => b.faction === faction && b.buildingType === BuildingType.TownCenter);
        if (enemyTc || this.units.filter(u=>u.faction===faction).length > 0) {
            enemiesAlive = true;
            break;
        }
    }

    if (!enemiesAlive) {
        this.gameState = 'won';
        this.notify();
        return;
    }

    for (const unit of this.units) {
      const prevX = unit.x;
      const prevY = unit.y;

      // Basic Enemy AI behavior
      if (this.enemiesAggro && this.enemyFactions.includes(unit.faction) && unit.action.type === 'Idle' && unit.unitType !== UnitType.Villager) {
         // seek nearest enemy unit or building
         // Enemies attack anyone not in their faction
         let target = this.units.find(u => u.faction !== unit.faction);
         if (!target) target = this.buildings.find(b => b.faction !== unit.faction) as any;
         if (target) {
            unit.action = { type: 'Attack', targetId: target.id, timer: 1 };
         }
      }

      if (unit.action.type === 'Move' || unit.action.type === 'ReturnCargo' || unit.action.type === 'Gather' || unit.action.type === 'Attack' || unit.action.type === 'Repair') {
        let targetX = unit.x;
        let targetY = unit.y;
        let dist = 0;
        let targetEntity: any = null;
        
        if (unit.action.type === 'Move') {
          targetX = unit.action.target.x;
          targetY = unit.action.target.y;
        } else if (unit.action.type === 'Gather') {
          const resId = unit.action.targetId;
          const res = this.resources.find(r => r.id === resId);
          if (res) {
            targetX = res.x;
            targetY = res.y;
          } else {
            unit.action = { type: 'Idle' };
          }
        } else if (unit.action.type === 'Attack') {
          targetEntity = this.units.find(u => u.id === (unit.action as any).targetId) || this.buildings.find(b => b.id === (unit.action as any).targetId);
          if (targetEntity) {
             targetX = targetEntity.x;
             targetY = targetEntity.y;
          } else {
             unit.action = { type: 'Idle' };
          }
        } else if (unit.action.type === 'Repair') {
          targetEntity = this.buildings.find(b => b.id === (unit.action as any).targetId);
          if (targetEntity) {
             targetX = targetEntity.x;
             targetY = targetEntity.y;
          } else {
             unit.action = { type: 'Idle' };
          }
        } else if (unit.action.type === 'ReturnCargo') {
          const tc = this.buildings.find(b => b.buildingType === BuildingType.TownCenter && b.faction === unit.faction);
          if (tc) { targetX = tc.x; targetY = tc.y; }
        }

        if (unit.action.type !== 'Idle') {
          const dx = targetX - unit.x;
          const dy = targetY - unit.y;
          dist = Math.sqrt(dx * dx + dy * dy);
          
          const attackRange = (unit.unitType === UnitType.Archer || unit.unitType === UnitType.Mage) ? 5.0 : unit.radius + (targetEntity?.radius || 0.5) + 0.2;

          if (dist > (unit.action.type === 'Attack' ? attackRange : (unit.radius + 0.5))) { // moving
            const speedBonus = (this.player.upgrades.includes(UpgradeType.MovementSpeed) && unit.faction === this.player.faction) ? 2.5 : 0;
            unit.x += (dx / dist) * (SPEED + speedBonus) * dt;
            unit.y += (dy / dist) * (SPEED + speedBonus) * dt;
            needsUpdate = true;
          } else {
             // Reached destination / in range logic
             if (unit.action.type === 'Move') {
               unit.action = { type: 'Idle' };
               needsUpdate = true;
             } else if (unit.action.type === 'Attack') {
                const atkAction = unit.action as any; // Cast so we can set targetX/Y and animTimer
                if (atkAction.animTimer) {
                   atkAction.animTimer -= dt;
                   if (atkAction.animTimer < 0) atkAction.animTimer = 0;
                }
                atkAction.timer -= dt;
                if (atkAction.timer <= 0) {
                   if (targetEntity) {
                      const damage = unit.unitType === UnitType.Hero ? 20 : (unit.unitType === UnitType.Swordsman ? 10 : (unit.unitType === UnitType.Spearman ? 8 : 8));
                      const bonus = (this.player.upgrades.includes(UpgradeType.IronWeapons) && unit.faction === this.player.faction ? 2 : 0) +
                                    (this.player.upgrades.includes(UpgradeType.AttackDamage) && unit.faction === this.player.faction ? 5 : 0);
                      if (unit.unitType === UnitType.Archer || unit.unitType === UnitType.Mage) {
                          // Spawn projectile particle
                          this.particles.push({
                              x: unit.x, y: unit.y, z: 0.5,
                              vx: (targetEntity.x - unit.x) * 4,
                              vy: (targetEntity.y - unit.y) * 4,
                              vz: 2,
                              life: 0.25,
                              maxLife: 0.25,
                              color: unit.unitType === UnitType.Mage ? '#3b82f6' : '#9ca3af',
                              size: 0.2
                          });
                      }

                      targetEntity.hp -= (damage + bonus);
                      
                      targetEntity.hitTimer = 0.2; // 200ms flash
                      atkAction.animTimer = 0.2; // 200ms strike anim
                      atkAction.targetX = targetEntity.x;
                      atkAction.targetY = targetEntity.y;
                      
                      if (unit.faction === this.player.faction && this.enemyFactions.includes(targetEntity.faction)) {
                           if (!this.enemiesAggro) {
                               this.enemiesAggro = true;
                               this.audio.playCombatMusic();
                               this.nextEnemySpawn = this.gameTime + 5; // Start spawning soon
                               this.notifyMessage("The enemy has been provoked! Prepare for battle!");
                           }
                      }
                      
                      atkAction.timer = 1.0; // attack speed
                      needsUpdate = true;
                   }
                }
             } else if (unit.action.type === 'Repair') {
                const repAction = unit.action as { type: 'Repair', targetId: string, timer: number };
                repAction.timer -= dt;
                if (repAction.timer <= 0) {
                   if (targetEntity && targetEntity.hp < targetEntity.maxHp) {
                      if (this.player.resources.Wood >= 1) {
                         this.player.resources.Wood -= 1;
                         targetEntity.hp = Math.min(targetEntity.maxHp, targetEntity.hp + 20);
                         repAction.timer = 0.5;
                         needsUpdate = true;
                      } else {
                         unit.action = { type: 'Idle' };
                         needsUpdate = true;
                      }
                   } else {
                      unit.action = { type: 'Idle' };
                      needsUpdate = true;
                   }
                }
             } else if (unit.action.type === 'Gather') {
               const resAction = unit.action as { type: 'Gather', targetId: string, resourceType: ResourceType, timer: number };
               resAction.timer -= dt;
               if (resAction.timer <= 0) {
                 const res = this.resources.find(r => r.id === resAction.targetId);
                 if (res) {
                   const amount = (this.player.upgrades.includes(UpgradeType.GatherEfficiency) && unit.faction === this.player.faction) ? 20 : 10;
                   res.amount -= amount;
                   if (res.amount <= 0) this.resources = this.resources.filter(r => r.id !== res.id);
                   unit.inventory = { type: res.resourceType, amount: amount };
                   unit.action = { type: 'ReturnCargo', targetId: resAction.targetId };
                   needsUpdate = true;
                 }
               }
             } else if (unit.action.type === 'ReturnCargo') {
               if (unit.inventory && this.player.faction === unit.faction) {
                 this.player.resources[unit.inventory.type] += unit.inventory.amount;
                 unit.inventory = undefined;
                 const resTargetId = (unit.action as { type: 'ReturnCargo', targetId: string }).targetId;
                 const res = this.resources.find(r => r.id === resTargetId);
                 if (res) {
                   unit.action = { type: 'Gather', targetId: res.id, resourceType: res.resourceType, timer: 1 };
                 } else {
                   unit.action = { type: 'Idle' };
                 }
                 needsUpdate = true;
               }
             }
          }
        }
      }

      // Determine animation state
      let newState: 'idle' | 'walk' | 'attack' = 'idle';
      if (unit.x !== prevX || unit.y !== prevY) {
          newState = 'walk';
      } else if (unit.action.type === 'Attack' || unit.action.type === 'Gather' || unit.action.type === 'Repair' || unit.action.type === 'Build') {
          newState = 'attack';
      }

      if (unit.animState !== newState) {
          unit.animState = newState;
          unit.animFrame = 0;
          unit.animTimer = 0;
      }

      unit.animTimer += dt;
      // 6 frames per second for walk, 10 for attack, 2 for idle
      const fps = newState === 'walk' ? 6 : (newState === 'attack' ? 10 : 2);
      if (unit.animTimer > 1 / fps) {
          unit.animTimer = 0;
          unit.animFrame = (unit.animFrame + 1) % 4; // 4 frames of animation
          needsUpdate = true;
          
          if (newState === 'walk' && (unit.animFrame === 1 || unit.animFrame === 3)) {
              this.audio.playMove();
          } else if (newState === 'attack' && unit.animFrame === 1) {
              this.audio.playAttack();
          }
      }
    }

    if (needsUpdate) {
      if (Math.random() < 0.1) { // Debounce react updates slightly
        this.notify();
      }
    }
  }

  command(x: number, y: number) {
    const selectedUnits = this.units.filter(u => u.selected && u.faction === this.player.faction);
    if (!selectedUnits.length) return;

    // Check what we clicked on
    let clickedEntity: any = null;
    let minDist = Infinity;
    const clickDist = (ex: number,ey: number) => Math.sqrt(Math.pow(ex - x, 2) + Math.pow(ey - y, 2));
    
    // Find closest entity under cursor
    for (const u of this.units) {
       const d = clickDist(u.x, u.y);
       if (d < u.radius * 2 && d < minDist) { clickedEntity = u; minDist = d; }
    }
    for (const b of this.buildings) {
       const d = clickDist(b.x, b.y);
       if (d < b.radius * 1.5 && d < minDist) { clickedEntity = b; minDist = d; }
    }
    for (const r of this.resources) {
       const d = clickDist(r.x, r.y);
       if (d < r.radius * 2 && d < minDist) { clickedEntity = r; minDist = d; }
    }

    if (!clickedEntity) { // Show waypoint on ground
       this.waypoints.push({ x, y, timer: 0.5 });
    }

    for (let i = 0; i < selectedUnits.length; i++) {
        const u = selectedUnits[i];
        // spread out destination
        const dest = { x: x + (Math.random()-0.5)*1, y: y + (Math.random()-0.5)*1 };
        
        if (clickedEntity) {
            if (clickedEntity.kind === 'resource') {
                if (u.unitType === UnitType.Villager) {
                    u.action = { type: 'Gather', targetId: clickedEntity.id, resourceType: clickedEntity.resourceType, timer: 1 };
                } else {
                    u.action = { type: 'Move', target: dest };
                }
            } else if (clickedEntity.faction && clickedEntity.faction !== this.player.faction) {
                // attack
                if (u.unitType === UnitType.Villager) {
                    u.action = { type: 'Move', target: dest };
                } else {
                    u.action = { type: 'Attack', targetId: clickedEntity.id, timer: 0.5 };
                }
            } else if (clickedEntity.kind === 'building' && clickedEntity.faction === this.player.faction && clickedEntity.hp < clickedEntity.maxHp) {
                if (u.unitType === UnitType.Villager) {
                    u.action = { type: 'Repair', targetId: clickedEntity.id, timer: 0.5 };
                } else {
                    u.action = { type: 'Move', target: dest };
                }
            } else {
               u.action = { type: 'Move', target: dest };
            }
        } else {
             u.action = { type: 'Move', target: dest };
        }
    }
    this.notify();
  }

  selectBox(minX: number, minY: number, maxX: number, maxY: number, add: boolean) {
     let count = 0;
     for (const u of this.units) {
        if (!add && u.faction === this.player.faction) u.selected = false;
        if (u.faction === this.player.faction && u.x >= minX && u.x <= maxX && u.y >= minY && u.y <= maxY) {
            u.selected = true;
            count++;
        }
     }
     for (const b of this.buildings) {
        b.selected = false;
     }
     for (const r of this.resources) {
        r.selected = false;
     }
     // If nothing unit selected but clicked a point, check buildings/resources
     if (count === 0 && Math.abs(maxX - minX) <= 1.1) {
        const cx = (minX + maxX)/2; const cy = (minY + maxY)/2;
        const dist = (ex: number, ey: number) => Math.sqrt(Math.pow(ex - cx, 2) + Math.pow(ey - cy, 2));
        for (const b of this.buildings) if (dist(b.x, b.y) < b.radius*1.5) b.selected = true;
        for (const r of this.resources) if (dist(r.x, r.y) < r.radius*1.5) r.selected = true;
     }
     this.notify();
  }

  canAfford(cost: Partial<Record<ResourceType, number>>): boolean {
    for (const [res, amount] of Object.entries(cost)) {
      if (this.player.resources[res as ResourceType] < (amount as number)) return false;
    }
    return true;
  }

  payCost(cost: Partial<Record<ResourceType, number>>) {
    for (const [res, amount] of Object.entries(cost)) {
      this.player.resources[res as ResourceType] -= (amount as number);
    }
  }

  buyUnit(unitType: UnitType, building: Building) {
    if (!building.isBuilt) return; // Prevent training in unbuilt structures
    if (unitType === UnitType.Hero) {
       const hasHero = this.units.some(u => u.unitType === UnitType.Hero && u.faction === this.player.faction);
       if (hasHero) return; // Limit to 1 hero
    }

    const cost = COSTS[unitType];
    if (cost && this.canAfford(cost)) {
      if (this.player.pop >= this.player.maxPop) return; // Pop limit
      this.payCost(cost);
      this.player.pop++;
      
      const buildTime = unitType === UnitType.Hero ? 60 : (unitType === UnitType.Villager ? 10 : 20);
      
      if (!building.buildQueue) {
          building.buildQueue = [];
      }
      
      building.buildQueue.push({
          unitType,
          timer: buildTime,
          maxTimer: buildTime
      });
      
      this.notify();
    }
  }

  buyBuilding(buildingType: BuildingType, builder: Unit) {
    const cost = COSTS[buildingType];
    if (cost && this.canAfford(cost)) {
      this.placementMode = { buildingType, builderId: builder.id };
      this.notify();
    }
  }

  cancelPlacement() {
    this.placementMode = null;
    this.notify();
  }

  confirmPlacement(x: number, y: number) {
    if (!this.placementMode) return;
    const { buildingType, builderId } = this.placementMode;
    
    // Check if placement is valid (no collisions)
    const radius = buildingType === BuildingType.House ? 1.0 : 1.5;
    let isValid = true;
    for (const b of this.buildings) {
       if (Math.hypot(b.x - x, b.y - y) < radius + b.radius) {
          isValid = false;
          break;
       }
    }
    for (const r of this.resources) {
       if (Math.hypot(r.x - x, r.y - y) < radius + r.radius) {
          isValid = false;
          break;
       }
    }

    if (!isValid) return;

    const cost = COSTS[buildingType];
    if (cost && this.canAfford(cost)) {
      this.payCost(cost);
      
      const buildingId = generateId();
      this.buildings.push({
        id: buildingId,
        kind: 'building',
        buildingType,
        faction: this.player.faction,
        x,
        y,
        hp: 10,
        maxHp: buildingType === BuildingType.House ? 500 : 1500,
        radius,
        selected: false,
        isBuilt: false,
        buildProgress: 0
      });
      
      // Order builder to build it
      const builder = this.units.find(u => u.id === builderId);
      if (builder) {
          builder.action = { type: 'Build', targetId: buildingId, timer: 1 };
      }

      this.placementMode = null;
      this.notify();
    }
  }

  buyUpgrade(upgradeType: string) {
    if (this.player.upgrades.includes(upgradeType)) return;
    const cost = COSTS[upgradeType];
    if (cost && this.canAfford(cost)) {
      this.payCost(cost);
      this.player.upgrades.push(upgradeType);
      this.notify();
    }
  }
}
