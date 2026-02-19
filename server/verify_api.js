const http = require('http');

function check(path) {
    return new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:3001${path}`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    console.log(`GET ${path}: Status ${res.statusCode}`);
                    const json = JSON.parse(data);
                    console.log('Sample Data:', JSON.stringify(json.slice(0, 1), null, 2));
                    resolve();
                } catch (e) {
                    console.log('Response:', data);
                    resolve();
                }
            });
        }).on('error', (err) => {
            console.error(`Error fetching ${path}:`, err.message);
            resolve();
        });
    });
}

async function run() {
    console.log('Verifying API endpoints...');
    await check('/api/users');
    await check('/api/products');
    await check('/api/transactions');
}

run();
