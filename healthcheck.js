// =============================================================================
// Cyber Shield Platform - Health Check Script
// Used by Docker HEALTHCHECK and orchestration systems
// =============================================================================

const http = require('http');

const PORT = process.env.PORT || 5000;
const HEALTH_ENDPOINT = '/api/health';
const TIMEOUT = 5000;

function checkHealth() {
    return new Promise((resolve, reject) => {
        const req = http.get({
            hostname: 'localhost',
            port: PORT,
            path: HEALTH_ENDPOINT,
            timeout: TIMEOUT,
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const health = JSON.parse(data);
                    if (res.statusCode === 200 && health.status === 'UP') {
                        console.log('✅ Health check passed:', JSON.stringify(health));
                        resolve(true);
                    } else {
                        console.error('❌ Health check failed: Unexpected response', health);
                        resolve(false);
                    }
                } catch (e) {
                    console.error('❌ Health check failed: Invalid JSON response', data);
                    resolve(false);
                }
            });
        });

        req.on('error', (err) => {
            console.error('❌ Health check failed:', err.message);
            resolve(false);
        });

        req.on('timeout', () => {
            req.destroy();
            console.error('❌ Health check failed: Timeout');
            resolve(false);
        });
    });
}

// Run health check
checkHealth()
    .then((healthy) => {
        process.exit(healthy ? 0 : 1);
    })
    .catch((err) => {
        console.error('❌ Health check error:', err);
        process.exit(1);
    });