import http from "http";
import fs from "fs";
import path from "path";
import superagent from "superagent";

const PORT = 3000;
const CACHE_DIR = path.join(process.cwd(), "cache");

// створюємо папку cache, якщо її нема
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR);
}

const server = http.createServer(async (req, res) => {
    const statusCode = req.url.slice(1); // /200 → 200
    const filePath = path.join(CACHE_DIR, `${statusCode}.jpg`);

    // ✅ Перевіряємо чи в кеші є картинка
    if (fs.existsSync(filePath)) {
        console.log(`✅ Cache hit: ${statusCode}`);
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        fs.createReadStream(filePath).pipe(res);
        return;
    }

    console.log(`⛔ Cache miss: ${statusCode}, fetching from http.cat...`);

    try {
        // ✅ Отримуємо картинку з http.cat
        const response = await superagent.get(`https://http.cat/${statusCode}`);

        // ✅ Зберігаємо файл у кеш
        fs.writeFileSync(filePath, response.body);

        res.writeHead(200, { "Content-Type": "image/jpeg" });
        res.end(response.body);
    } catch (err) {
        console.log(`❌ Error fetching https://http.cat/${statusCode}`);
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://127.0.0.1:${PORT}/`);
});
