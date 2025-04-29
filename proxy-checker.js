const fs = require("fs");
const axios = require("axios");
const readline = require("readline");

const API_URL = "https://api.jb8fd7grgd.workers.dev";
const TIMEOUT_MS = 10000;
const INPUT_FILE = "ProxyList.txt";
const OUTPUT_FILE = "results.txt";
const CONCURRENCY = 50; // jumlah request bersamaan

async function checkProxy(ip, port) {
  const url = `${API_URL}/${ip}:${port}`;
  try {
    const response = await axios.get(url, { timeout: TIMEOUT_MS });
    const data = response.data[0];
    if (data && data.proxyip) {
      return `${data.proxy},${data.port},${data.countryCode},${data.org}`;
    }
  } catch (error) {}
  return null;
}

async function runInBatches(tasks, batchSize) {
  const results = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const res = await Promise.all(batch.map(task => task()));
    results.push(...res);
    console.log(`Processed: ${Math.min(i + batchSize, tasks.length)} / ${tasks.length}`);
  }
  return results;
}

async function main() {
  const fileStream = fs.createReadStream(INPUT_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const tasks = [];

  for await (const line of rl) {
    const parts = line.split(",");
    if (parts.length < 2) continue;
    const ip = parts[0].trim();
    const port = parts[1].trim();

    tasks.push(() => checkProxy(ip, port));
  }

  const results = await runInBatches(tasks, CONCURRENCY);

  const output = fs.createWriteStream(OUTPUT_FILE, { flags: "w" });
  results.forEach(result => {
    if (result) {
      console.log(`Live: ${result}`);
      output.write(result + "\n");
    }
  });
  output.end();
}

main();
