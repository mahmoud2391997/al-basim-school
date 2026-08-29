const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const env = { ...process.env };
const appDir = path.resolve(__dirname, '..');
const buildId = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const stagingDir = path.join(appDir, `.electron-deploy-${buildId}`);
const releaseDir = path.join(appDir, `release-${buildId}`);
const builderBinary = process.platform === 'win32' ? 'electron-builder.cmd' : 'electron-builder';
const builderCandidates = [
  path.join(appDir, 'node_modules', '.bin', builderBinary),
  path.join(appDir, '..', '..', 'node_modules', '.bin', builderBinary),
];
const electronBuilder = builderCandidates.find((candidate) => fs.existsSync(candidate));
if (!electronBuilder) throw new Error('electron-builder executable was not found. Install workspace dependencies before packaging.');

for (const key of Object.keys(env)) {
  if (key.toLowerCase().startsWith('npm_config_')) delete env[key];
}

env.PORT ??= '24438';
env.BASE_PATH ??= './';

function run(command, args, cwd = appDir) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env,
    cwd,
    shell: process.platform === 'win32',
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
  if (process.exitCode !== 0) process.exit(process.exitCode);
}

run(npm, ['run', 'build']);
for (const asset of ['al-bassam-logo-mark.png', 'al-bassam-logo-trim.png']) {
  const assetPath = path.join(appDir, 'dist', 'public', asset);
  if (!fs.existsSync(assetPath)) {
    throw new Error(`Production asset missing after Vite build: ${asset}`);
  }
}
fs.mkdirSync(stagingDir, { recursive: true });
const appPackage = JSON.parse(fs.readFileSync(path.join(appDir, 'package.json'), 'utf8'));
delete appPackage.devDependencies;
appPackage.packageManager = 'npm@10.9.3';
fs.writeFileSync(path.join(stagingDir, 'package.json'), `${JSON.stringify(appPackage, null, 2)}\n`);
run(npm, ['install', '--omit=dev', '--package-lock=false'], stagingDir);
fs.cpSync(path.join(appDir, 'dist'), path.join(stagingDir, 'dist'), { recursive: true });
fs.cpSync(path.join(appDir, 'electron'), path.join(stagingDir, 'electron'), { recursive: true });
run(electronBuilder, ['--win', 'nsis', 'portable', '--config.npmRebuild=true', `--config.directories.output=${releaseDir}`], stagingDir);

const artifacts = fs.readdirSync(releaseDir).filter((name) => /\.(exe|yml)$/i.test(name));
if (!artifacts.some((name) => /\.exe$/i.test(name))) {
  throw new Error(`Desktop packaging completed without an executable in ${releaseDir}`);
}
console.log(`Release artifacts written to ${releaseDir}: ${artifacts.join(', ')}`);
