export type Vector2 = { x: number; y: number };

export enum Faction {
  Hlaalu = 'Hlaalu',
  Redoran = 'Redoran',
  Telvanni = 'Telvanni',
}

export enum ResourceType {
  Food = 'Food',
  Wood = 'Wood',
  Gold = 'Gold',
  Stone = 'Stone',
}

export type Resources = Record<ResourceType, number>;

export enum UnitType {
  Villager = 'Villager',
  Swordsman = 'Swordsman',
  Spearman = 'Spearman',
  Archer = 'Archer',
  Mage = 'Mage',
  Hero = 'Hortator',
}

export enum BuildingType {
  TownCenter = 'Town Square',
  House = 'House',
  Barracks = 'Barracks',
  Smithy = 'Smithy',
  Temple = 'Temple',
}

export const TILE_W = 64;
export const TILE_H = 32;
export const MAP_SIZE = 50;

export function screenToGrid(sx: number, sy: number, camX: number, camY: number, zoom: number = 1): Vector2 {
  const worldX = (sx - camX) / zoom;
  const worldY = (sy - camY) / zoom;
  return {
    x: (worldX / (TILE_W / 2) + worldY / (TILE_H / 2)) / 2,
    y: (worldY / (TILE_H / 2) - worldX / (TILE_W / 2)) / 2
  };
}

export function gridToScreen(gx: number, gy: number, camX: number, camY: number, zoom: number = 1): Vector2 {
  const worldX = (gx - gy) * TILE_W / 2;
  const worldY = (gx + gy) * TILE_H / 2;
  return {
    x: worldX * zoom + camX,
    y: worldY * zoom + camY
  };
}

export enum UpgradeType {
  IronWeapons = 'IronWeapons',
  SteelArmor = 'SteelArmor',
  MovementSpeed = 'MovementSpeed',
  AttackDamage = 'AttackDamage',
  GatherEfficiency = 'GatherEfficiency',
}

export const COSTS: Record<string, Partial<Record<ResourceType, number>>> = {
  [UnitType.Villager]: { [ResourceType.Food]: 35, [ResourceType.Gold]: 25 },
  [UnitType.Swordsman]: { [ResourceType.Food]: 25, [ResourceType.Gold]: 30, [ResourceType.Wood]: 20 },
  [UnitType.Spearman]: { [ResourceType.Food]: 25, [ResourceType.Gold]: 30, [ResourceType.Wood]: 20 },
  [UnitType.Archer]: { [ResourceType.Food]: 25, [ResourceType.Gold]: 30, [ResourceType.Wood]: 20 },
  [UnitType.Mage]: { [ResourceType.Food]: 25, [ResourceType.Gold]: 30, [ResourceType.Wood]: 20 },
  [UnitType.Hero]: { [ResourceType.Food]: 200, [ResourceType.Gold]: 200, [ResourceType.Wood]: 100 },
  [BuildingType.TownCenter]: { [ResourceType.Wood]: 100, [ResourceType.Gold]: 100, [ResourceType.Food]: 40 },
  [BuildingType.House]: { [ResourceType.Wood]: 100, [ResourceType.Gold]: 100, [ResourceType.Food]: 40 },
  [BuildingType.Barracks]: { [ResourceType.Wood]: 100, [ResourceType.Gold]: 100, [ResourceType.Food]: 40 },
  [BuildingType.Smithy]: { [ResourceType.Wood]: 100, [ResourceType.Gold]: 100, [ResourceType.Food]: 40 },
  [BuildingType.Temple]: { [ResourceType.Wood]: 100, [ResourceType.Gold]: 100, [ResourceType.Food]: 40 },
  [UpgradeType.IronWeapons]: { [ResourceType.Food]: 100, [ResourceType.Gold]: 50 },
  [UpgradeType.SteelArmor]: { [ResourceType.Food]: 150, [ResourceType.Gold]: 100 },
  [UpgradeType.MovementSpeed]: { [ResourceType.Wood]: 100, [ResourceType.Gold]: 50 },
  [UpgradeType.AttackDamage]: { [ResourceType.Food]: 100, [ResourceType.Gold]: 100 },
  [UpgradeType.GatherEfficiency]: { [ResourceType.Wood]: 100, [ResourceType.Food]: 50 },
};
