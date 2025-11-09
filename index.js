import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import http from 'http';
import superagent from 'superagent';

const program = new Command();

program
  .requiredOption('-h, --host <host>', 'server host')
  .requiredOption('-p, --port <port>', 'server port')
  .requiredOption('-c, --cache <path>', 'cache directory');

program.parse(process.argv);
const options = program.opts();

const fsPromises = fs.promises;

// --- Перевірка/створення директорії кешу ---
if (!fs.existsSync(options.cache)) {
  fs.mkdirSync(options.cache, { recursive: true });
  console.log(`✅ Створено директорію кешу: ${options.cache}`);
}

// --- Функція для отримання картинки з http.cat ---
async function fetchFromHttpCat(code, filePath) {
  const url = `https://http.cat/${code}.jpg`;
  console.log(`🐱 Завантаження з ${url} ...`);

  try {
    const response = await superagent.get(url).responseType('blob');
    const buffer = response.body;
    await fsPromises.writeFile(filePath, buffer);
    console.log(`✅ Збережено у кеш: ${filePath}`);
    return buffer;
  } catch (err) {
    console.error(`❌ Не вдалося отримати картинку для коду ${code}`);
    throw err;
  }
}

// --- Створення HTTP серверу ---
const server = http.createServer(async (req, res) => {
  const method = req.method;
  const url = req.url;

  const match = url.match(/^\/(\d{3})$/);
  if (!match) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('Bad request. Use path like /200');
  }

  const code = match[1];
  const filePath = path.join(options.cache, `${code}.jpg`);

  try {
    if (method === 'GET') {
      try {
        // Пробуємо прочитати з кешу
        const data = await fsPromises.readFile(filePath);
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        return res.end(data);
      } catch {
        // Якщо нема в кеші — пробуємо завантажити
        try {
          const data = await fetchFromHttpCat(code, filePath);
          res.writeHead(200, { 'Content-Type': 'image/jpeg' });
          return res.end(data);
        } catch {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          return res.end('Not Found');
        }
      }

    } else if (method === 'PUT') {
      // --- Зберегти файл ---
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', async () => {
        const body = Buffer.concat(chunks);
        await fsPromises.writeFile(filePath, body);
        res.writeHead(201, { 'Content-Type': 'text/plain' });
        res.end('Created');
      });

    } else if (method === 'DELETE') {
      // --- Видалити файл ---
      try {
        await fsPromises.unlink(filePath);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Deleted');
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }

    } else {
      // --- Непідтримуваний метод ---
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

server.listen(options.port, options.host, () => {
  console.log(`🚀 Сервер запущено на http://${options.host}:${options.port}`);
});
