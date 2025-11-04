import { Command } from 'commander';
import http from 'http';
import fs from 'fs';
import path from 'path';

const program = new Command();

program
  .requiredOption('-h, --host <address>', 'server host')
  .requiredOption('-p, --port <number>', 'server port')
  .requiredOption('-c, --cache <dir>', 'cache directory');

program.parse(process.argv);
const options = program.opts();

// --- Перевірка і створення директорії кешу ---
if (!fs.existsSync(options.cache)) {
  fs.mkdirSync(options.cache, { recursive: true });
  console.log(`Cache directory created at ${options.cache}`);
}

// --- Створюємо сервер ---
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello, server is running!\n');
});

server.listen(parseInt(options.port), options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
});
