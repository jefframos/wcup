const fs = require('fs');
const path = require('path');

// Create broadcasts directory if it doesn't exist
const broadcastsDir = path.join(__dirname, 'broadcasts');
if (!fs.existsSync(broadcastsDir)) {
    fs.mkdirSync(broadcastsDir, { recursive: true });
}

// Simple SVG logos for broadcasters
const logos = {
    'bbc.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120">
  <rect width="200" height="120" fill="#000"/>
  <text x="100" y="70" font-size="60" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial">BBC</text>
</svg>`,
    'itv.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120">
  <rect width="200" height="120" fill="#009fdf"/>
  <text x="100" y="70" font-size="60" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial">ITV</text>
</svg>`,
    'stv.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120">
  <rect width="200" height="120" fill="#1e90ff"/>
  <text x="100" y="70" font-size="60" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial">STV</text>
</svg>`
};

console.log('Creating broadcaster logos...\n');

for (const [filename, svgContent] of Object.entries(logos)) {
    const filepath = path.join(broadcastsDir, filename);
    fs.writeFileSync(filepath, svgContent);
    console.log(`✓ Created ${filename}`);
}

console.log('\n✓ All logos created successfully!');
