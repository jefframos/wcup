const fs = require('fs');
const path = require('path');
const https = require('https');

const flagsDir = path.join(__dirname, 'flags');

// Create flags directory if it doesn't exist
if (!fs.existsSync(flagsDir)) {
    fs.mkdirSync(flagsDir, { recursive: true });
}

// Map of country names to flag-icons country codes
const countryMap = {
    'Algeria': 'dz',
    'Argentina': 'ar',
    'Australia': 'au',
    'Austria': 'at',
    'Belgium': 'be',
    'Bosnia-Herzegovina': 'ba',
    'Brazil': 'br',
    'Canada': 'ca',
    'Cape Verde': 'cv',
    'Colombia': 'co',
    'Croatia': 'hr',
    'Curacao': 'cw',
    'Czech Republic': 'cz',
    'DR Congo': 'cd',
    'Ecuador': 'ec',
    'Egypt': 'eg',
    'England': 'gb-eng',
    'France': 'fr',
    'Germany': 'de',
    'Ghana': 'gh',
    'Haiti': 'ht',
    'Iran': 'ir',
    'Iraq': 'iq',
    'Ivory Coast': 'ci',
    'Japan': 'jp',
    'Jordan': 'jo',
    'Mexico': 'mx',
    'Morocco': 'ma',
    'Netherlands': 'nl',
    'New Zealand': 'nz',
    'Norway': 'no',
    'Panama': 'pa',
    'Paraguay': 'py',
    'Portugal': 'pt',
    'Qatar': 'qa',
    'Saudi Arabia': 'sa',
    'Scotland': 'gb-sct',
    'Senegal': 'sn',
    'South Africa': 'za',
    'South Korea': 'kr',
    'Spain': 'es',
    'Sweden': 'se',
    'Switzerland': 'ch',
    'Tunisia': 'tn',
    'Turkey': 'tr',
    'USA': 'us',
    'Uruguay': 'uy',
    'Uzbekistan': 'uz'
};

function downloadFlag(country, code) {
    return new Promise((resolve, reject) => {
        const url = `https://cdn.jsdelivr.net/npm/flag-icons@6.11.0/flags/4x3/${code}.svg`;
        const filePath = path.join(flagsDir, `${country.toLowerCase().replace(/\s+/g, '').replace(/[^\w-]/g, '')}.svg`);

        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const fileStream = fs.createWriteStream(filePath);
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    console.log(`✓ Downloaded ${country}`);
                    resolve();
                });
            } else {
                reject(new Error(`Failed to download ${country}: ${response.statusCode}`));
            }
        }).on('error', reject);
    });
}

async function downloadAllFlags() {
    console.log('Downloading flags...\n');

    const promises = Object.entries(countryMap).map(([country, code]) =>
        downloadFlag(country, code).catch(err => console.error(`✗ Error: ${err.message}`))
    );

    await Promise.all(promises);
    console.log('\n✓ All flags downloaded successfully!');
}

downloadAllFlags().catch(console.error);
