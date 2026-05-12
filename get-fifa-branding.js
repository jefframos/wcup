const fs = require('fs');
const path = require('path');
const https = require('https');

// Create logo directory
const logoDir = path.join(__dirname, 'logo');
if (!fs.existsSync(logoDir)) {
    fs.mkdirSync(logoDir, { recursive: true });
}

// FIFA World Cup 2026 official logo from various sources
const logoUrls = [
    {
        name: 'fifa-2026-logo.svg',
        url: 'https://upload.wikimedia.org/wikipedia/en/a/a8/2026_FIFA_World_Cup_logo.svg'
    }
];

function downloadFile(url, filename) {
    return new Promise((resolve, reject) => {
        const filepath = path.join(logoDir, filename);
        const file = fs.createWriteStream(filepath);

        https.get(url, response => {
            if (response.statusCode !== 200) {
                file.close();
                fs.unlinkSync(filepath);
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                const stats = fs.statSync(filepath);
                console.log(`✓ Downloaded ${filename} (${(stats.size / 1024).toFixed(1)}KB)`);
                resolve();
            });
        }).on('error', err => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}

// Create fallback SVG logo if download fails
function createFallbackLogo() {
    const fallbackSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">
  <defs>
    <style>
      .logo-text { font-family: Arial, sans-serif; font-weight: 900; text-anchor: middle; }
      .year { font-size: 80px; fill: #003399; }
      .world-cup { font-size: 28px; fill: #FFD700; letter-spacing: 2px; }
    </style>
  </defs>
  <rect width="400" height="200" fill="#fff" stroke="#003399" stroke-width="2"/>
  <text x="200" y="100" class="logo-text year">2026</text>
  <text x="200" y="145" class="logo-text world-cup">WORLD CUP</text>
  <circle cx="200" cy="170" r="3" fill="#FFD700"/>
  <circle cx="185" cy="170" r="3" fill="#FFD700"/>
  <circle cx="215" cy="170" r="3" fill="#FFD700"/>
</svg>`;

    const filepath = path.join(logoDir, 'fifa-2026-logo.svg');
    fs.writeFileSync(filepath, fallbackSVG);
    console.log(`✓ Created fallback logo`);
}

async function downloadBranding() {
    console.log('Getting FIFA World Cup 2026 official branding...\n');

    let success = false;
    for (const item of logoUrls) {
        try {
            await downloadFile(item.url, item.name);
            success = true;
        } catch (error) {
            console.error(`✗ Could not download ${item.name}: ${error.message}`);
        }
    }

    if (!success) {
        console.log('\nCreating fallback branding...');
        createFallbackLogo();
    }

    console.log('\n✓ Branding ready!');
    console.log('\n📋 Official FIFA World Cup 2026 Colors:');
    console.log('  Primary: #003399 (Deep Blue)');
    console.log('  Secondary: #FFD700 (Gold)');
    console.log('  Accent: #FFFFFF (White)');
    console.log('  Tertiary: #1E1E1E (Dark Gray)');
}

downloadBranding();
