const puppeteer = require('puppeteer');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// --- CẤU HÌNH CỦA BẠN ---
const CONFIG = {
    url: 'https://webminer.pages.dev/',
    algo: 'minotaurx',
    host: 'minotaurx.na.mine.zpool.ca',
    port: '7019',
    wallet: 'ltc1qkdfz6awelxenp8lc8v7hr2k8m4xamaw', 
    worker: 'Render_VPS',
    password: 'c=LTC', 
    threads: 1 
};

// --- Web Server giả ---
app.get('/', (req, res) => {
    res.send(`Worker: ${CONFIG.worker} | Status: Running | Algo: ${CONFIG.algo}`);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// --- Logic Đào ---
(async () => {
    console.log('[System] Đang khởi động...');

    // Đã bỏ executablePath để tránh lỗi ENOENT
    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process',
            '--no-zygote'
        ]
    });

    try {
        const page = await browser.newPage();

        // Chặn ảnh để nhẹ máy
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Tạo Link
        const fullUrl = `${CONFIG.url}?algorithm=${CONFIG.algo}&host=${CONFIG.host}&port=${CONFIG.port}&worker=${CONFIG.wallet}.${CONFIG.worker}&password=${encodeURIComponent(CONFIG.password)}&workers=1`;
        
        console.log(`[Nav] Đang vào trang đào...`);
        // Timeout 3 phút
        await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 180000 });
        
        console.log('[Success] Đã truy cập thành công! Đang đào...');

        // Giữ kết nối
        setInterval(async () => {
            if (!browser.isConnected()) process.exit(1);
        }, 60000);

    } catch (error) {
        console.error('[Error] Lỗi:', error.message);
        process.exit(1);
    }
})();
