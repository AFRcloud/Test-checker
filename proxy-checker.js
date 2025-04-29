const fs = require("fs");
const axios = require("axios");
const readline = require("readline");
const pLimit = require("p-limit");

const API_URL = "https://api.jb8fd7grgd.workers.dev";
const TIMEOUT_MS = 10000;
const INPUT_FILE = "ProxyList.txt";
const OUTPUT_FILE = "results.txt";
const CONCURRENCY = 50; // jumlah request bersamaan

const limit = pLimit(CONCURRENCY);

async function checkProxy(ip, port) {
  const url = `${API_URL}/${ip}:${port}`;
  try {
    const response = await axios.get(url, { timeout: TIMEOUT_MS });
    const data = response.data[0];
    if (data && data.proxyip) {
      return `${data.proxy},${data.port},${data.countryCode},${data.org}`;
    }
  } catch (error) {
    // abaikan
  }
  return null;
}

async function main() {
  const fileStream = fs.createReadStream(INPUT_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const output = fs.createWriteStream(OUTPUT_FILE, { flags: "w" });
  const tasks = [];
  const results = [];

  for await (const line of rl) {
    const parts = line.split(",");
    if (parts.length < 2) continue;
    const ip = parts[0].trim();
    const port = parts[1].trim();

    const task = limit(() =>
      checkProxy(ip, port).then((result) => {
        if (result) {
          console.log(`Live: ${result}`);
          results.push(result);  // Menyimpan hasil dalam array sesuai urutan input
        }
      })
    );
    tasks.push(task);
  }

  await Promise.all(tasks);

  // Menulis hasil dengan urutan yang konsisten
  results.forEach((result) => {
    output.write(result + "\n");
  });

  output.end();
}

main();
