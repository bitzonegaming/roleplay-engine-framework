import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

let version: string | null = null;

function getCurrentDirectory(): string {
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }

  try {
    const importMetaUrl = eval('import.meta.url');
    if (importMetaUrl) {
      return dirname(fileURLToPath(importMetaUrl));
    }
  } catch {
    return process.cwd();
  }

  return process.cwd();
}

function getPackageJsonPath(): string {
  const currentDir = getCurrentDirectory();
  const devPath = join(currentDir, '..', 'package.json');
  const prodPath = join(currentDir, 'package.json');

  try {
    readFileSync(prodPath, 'utf-8');
    return prodPath;
  } catch {
    try {
      readFileSync(devPath, 'utf-8');
      return devPath;
    } catch {
      return join(process.cwd(), 'package.json');
    }
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
