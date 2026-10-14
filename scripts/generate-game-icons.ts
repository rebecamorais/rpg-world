import { writeFileSync } from 'node:fs';

import { GAME_ICONS_FILE, buildGameIcons } from './game-icons';

// Bundles the game icons the app uses, so the browser never fetches them from the Iconify API.
// Run after adding or renaming a game icon: npm run icons
const icons = buildGameIcons();
writeFileSync(GAME_ICONS_FILE, `${JSON.stringify(icons, null, 2)}\n`);
console.log(`✨ ${Object.keys(icons).length} game icons written to ${GAME_ICONS_FILE}`);
