import { readFileSync } from 'fs';
import { join } from 'path';

let version: string | null = null;

function getPackageJsonPath(): string {
  const devPath = join(__dirname, '..', 'package.json');
  const prodPath = join(__dirname, 'package.json');

  try {
    return require.resolve(prodPath);
  } catch {
    return require.resolve(devPath);
  }
}

export function getVersion(): string {
  if (version !== null) return version;

  const pkgPath = getPackageJsonPath();
  const pkgJson = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string };

  const [major, minor] = pkgJson.version.split('.');
  version = `${major}.${minor}`;
  return version;
}
