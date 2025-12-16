const puppeteer = require('puppeteer');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// --- CẤU HÌNH ---
const CONFIG = {
    url: 'https://webminer.pages.dev/',
    algo: 'minotaurx',
    host: 'minotaurx.na.mine.zpool.ca',
    port: '7019',
    
    // !!! QUAN TRỌNG: KIỂM TRA KỸ VÍ CỦA BẠN Ở DÒNG DƯỚI !!!
    wallet: 'ltc1qkdfz6awelxenp8lc8v7hr2k8m4xamaw', 
    
    worker: 'Render_Web_Created',
    password: 'c=LTC',
    threads: 1
};

app.get('/', (req, res) => {
    res.send(`Mining Active | Worker: ${CONFIG.worker} | Algo: ${CONFIG.algo}`);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

(async () => {
    // Thêm delay nhỏ khi khởi động để tránh lỗi race condition trên container chậm
    await new Promise(r => setTimeout(r, 3000));
    
    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process',
            '--no-zygote'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null 
    });

    try {
        const page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        const fullUrl = `${CONFIG.url}?algorithm=${CONFIG.algo}&host=${CONFIG.host}&port=${CONFIG.port}&worker=${CONFIG.wallet}.${CONFIG.worker}&password=${encodeURIComponent(CONFIG.password)}&workers=1`;
        
        console.log(`Navigating to miner...`);
        await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 180000 });
        console.log('Mining started successfully.');

        setInterval(async () => {
            if (!browser.isConnected()) process.exit(1);
        }, 60000);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
})();
