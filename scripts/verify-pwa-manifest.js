const fs = require('fs');
const path = require('path');

const webRoot = path.resolve(__dirname, '..', 'web');
const manifestPath = path.join(webRoot, 'manifest.json');

if (!fs.existsSync(manifestPath)) {
    throw new Error(`PWA verification failed: missing ${manifestPath}`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.display !== 'standalone' || manifest.start_url !== '/' || manifest.scope !== '/' || manifest.id !== '/') {
    throw new Error(`PWA verification failed: invalid manifest navigation/display fields: ${JSON.stringify(manifest)}`);
}

if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
    throw new Error('PWA verification failed: manifest.icons must be a non-empty array');
}

const hasAny192 = manifest.icons.some(icon => icon.sizes === '192x192' && icon.purpose === 'any');
const hasAny512 = manifest.icons.some(icon => icon.sizes === '512x512' && icon.purpose === 'any');
const hasCombinedPurpose = manifest.icons.some(icon => typeof icon.purpose === 'string' && icon.purpose.includes(' '));

if (!hasAny192 || !hasAny512 || hasCombinedPurpose) {
    throw new Error('PWA verification failed: manifest.icons must provide separate purpose="any" 192x192 and 512x512 icons');
}

for (const icon of manifest.icons) {
    const iconDiskPath = path.join(webRoot, String(icon.src || '').replace(/^\//, ''));
    if (!fs.existsSync(iconDiskPath)) {
        throw new Error(`PWA verification failed: missing icon asset ${icon.src}`);
    }
}

const htmlFiles = [];
function collectHtmlFiles(dir) {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== '_next') {
                collectHtmlFiles(entryPath);
            }
        } else if (entry.name === 'index.html') {
            htmlFiles.push(entryPath);
        }
    }
}

collectHtmlFiles(webRoot);
if (htmlFiles.length === 0) {
    throw new Error('PWA verification failed: no exported index.html files found');
}

for (const htmlFile of htmlFiles) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    const manifestLinks = html.match(/<link\b[^>]*\brel="manifest"[^>]*>/g) || [];
    if (manifestLinks.length !== 1) {
        throw new Error(`PWA verification failed: expected exactly 1 <link rel="manifest"> in ${htmlFile}, found ${manifestLinks.length}`);
    }
    if (!manifestLinks[0].includes('crossorigin="use-credentials"')) {
        throw new Error(`PWA verification failed: <link rel="manifest"> in ${htmlFile} is missing crossorigin="use-credentials": ${manifestLinks[0]}`);
    }
}

console.log(`Verified credentialed PWA manifest links across ${htmlFiles.length} exported routes and validated manifest.json icons.`);
