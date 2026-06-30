const fs = require('fs');
let code = fs.readFileSync('src/components/GameUI.tsx', 'utf-8');
const search = "onClick={() => engine.buyUnit('Villager' as any, selectedBuildings[0])}";
const index = code.indexOf(search);
if (index !== -1) {
    const nextLineIndex = code.indexOf('/>', index);
    if (nextLineIndex !== -1) {
        const insertPos = nextLineIndex + 2;
        const insertStr = `
                    {!engine.player.upgrades.includes('MovementSpeed') && (
                      <ActionButton 
                         label="Swift Boots" cost="100 Tmb, 50 Ore" icon={<Activity size={16} />} 
                         onClick={() => engine.buyUpgrade('MovementSpeed')} 
                      />
                    )}
                    {!engine.player.upgrades.includes('AttackDamage') && (
                      <ActionButton 
                         label="Sharpen Steel" cost="100 Eggs, 100 Ore" icon={<Pickaxe size={16} />} 
                         onClick={() => engine.buyUpgrade('AttackDamage')} 
                      />
                    )}
                    {!engine.player.upgrades.includes('GatherEfficiency') && (
                      <ActionButton 
                         label="Better Tools" cost="100 Tmb, 50 Eggs" icon={<Activity size={16} />} 
                         onClick={() => engine.buyUpgrade('GatherEfficiency')} 
                      />
                    )}`;
        code = code.slice(0, insertPos) + insertStr + code.slice(insertPos);
        
        // Also wrap the group in <> if it doesn't already have it
        code = code.replace(
           "{selectedBuildings.some(b => b.buildingType === 'Town Square') && (\n                    <ActionButton",
           "{selectedBuildings.some(b => b.buildingType === 'Town Square') && (\n                    <>\n                    <ActionButton"
        );
        
        // Find the ')}' right after our insertion and add the closing </>
        const afterStr = "onClick={() => engine.buyUpgrade('GatherEfficiency')} \n                      />\n                    )}";
        const afterIndex = code.indexOf(afterStr);
        if (afterIndex !== -1) {
            const bracketCloseIndex = code.indexOf(')}', afterIndex + afterStr.length);
            if (bracketCloseIndex !== -1) {
                code = code.slice(0, bracketCloseIndex) + '                    </>\n                )}' + code.slice(bracketCloseIndex + 2);
            }
        }
        

        fs.writeFileSync('src/components/GameUI.tsx', code);
        console.log("Updated!");
    } else {
        console.log("Not found />");
    }
} else {
    console.log("Not found target");
}
