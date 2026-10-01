import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const gitCandidatePaths = [
  'git',
  path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Git', 'cmd', 'git.exe'),
  'C:\\Program Files\\Git\\cmd\\git.exe',
  'C:\\Program Files (x86)\\Git\\cmd\\git.exe'
];

let gitBin = 'git';
for (const p of gitCandidatePaths) {
  try {
    execSync(`"${p}" --version`, { stdio: 'ignore' });
    gitBin = `"${p}"`;
    break;
  } catch {
    // try next
  }
}

function run(command) {
  try {
    return execSync(command, { stdio: 'pipe', encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

function syncToGitHub(customMessage = null) {
  const status = run(`${gitBin} status --porcelain`);
  if (!status) {
    console.log('⚡ Koi naya badlaav nahi hai (Working tree clean).');
    return false;
  }

  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const message = customMessage || `Auto-update: ${timestamp}`;

  console.log(`\n📦 Naye changes mile! GitHub par upload ho raha hai...`);
  console.log(`💬 Commit Message: "${message}"`);

  run(`${gitBin} add .`);
  run(`${gitBin} commit -m "${message}"`);
  run(`${gitBin} push origin main`);
  
  console.log(`✅ GitHub par successfully upload ho gaya! [${timestamp}]\n`);
  return true;
}

const mode = process.argv[2] || 'once';

if (mode === 'watch') {
  console.log('👀 Auto-Sync Mode ACTIVE!');
  console.log('Jab bhi aap koi file edit ya save karenge, ye automatically 5 sec me GitHub par push kar dega.\n');
  console.log('Band karne ke liye Ctrl + C dabayein.\n');

  let timeoutId = null;

  const triggerSync = (filename) => {
    if (filename && (filename.includes('.git') || filename.includes('node_modules') || filename.includes('dist'))) {
      return;
    }
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      syncToGitHub(`Auto-sync update: ${filename || 'files'}`);
    }, 5000);
  };

  fs.watch(process.cwd(), { recursive: true }, (eventType, filename) => {
    triggerSync(filename);
  });
} else {
  const msg = process.argv.slice(2).join(' ') || null;
  syncToGitHub(msg);
}
