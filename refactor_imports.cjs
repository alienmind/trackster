const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('/home/jaime/src/trackster/src');
files.push('/home/jaime/src/trackster/devices/index.ts');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace import declarations
  // e.g., import { useFileSystemStore } from '.../useFileSystemStore';
  content = content.replace(/useFileSystemStore/g, 'useCircuitTracksStore');
  content = content.replace(/useAudioStore/g, 'useCircuitTracksStore');

  // Fix potential duplicate imports that arise from replacing both to the same string
  // If a file now has two identical import lines, remove one.
  const lines = content.split('\n');
  const uniqueLines = [];
  let importSeen = false;
  lines.forEach(line => {
    if (line.includes('import { useCircuitTracksStore }')) {
      if (!importSeen) {
        uniqueLines.push(line);
        importSeen = true;
      }
    } else {
      uniqueLines.push(line);
    }
  });

  content = uniqueLines.join('\n');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
