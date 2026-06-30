const fs = require('fs');
let text = fs.readFileSync('src/components/GameUI.tsx', 'utf-8');

text = text.replace(
  "{selectedBuildings.some(b => b.buildingType === 'Town Square') && (\\n                    <ActionButton",
  "{selectedBuildings.some(b => b.buildingType === 'Town Square') && (\\n                    <>\\n                    <ActionButton"
);

// We need to use regex because spacing might differ
text = text.replace(
  /\{selectedBuildings\.some\(b => b\.buildingType === 'Town Square'\) && \([\s\S]*?<ActionButton/,
  "{selectedBuildings.some(b => b.buildingType === 'Town Square') && (\n                    <>\n                    <ActionButton"
);

text = text.replace(
  /                                   <\/>\n                 \)}/,
  "                    </>\n                )}"
);

fs.writeFileSync('src/components/GameUI.tsx', text);
