const fs = require("fs");
const axios = require("axios");
const readline = require("readline");

const API_URL = "https://api.jb8fd7grgd.workers.dev";
const TIMEOUT_MS = 10000; // 10 detik timeout
const INPUT_FILE = "ProxyList.txt";
const OUTPUT_FILE = "results.txt";

// Fungsi untuk mengecek proxy
async function checkProxy(ip, port) {
  const url = `${API_URL}/${ip}:${port}`;
  try {
    const response = await axios.get(url, { timeout: TIMEOUT_MS });
    const data = response.data[0];

    if (data && data.proxyip) {
      return `${data.proxy},${data.port},${data.countryCode},${data.org}`;
    }
  } catch (error) {
    // Abaikan error
  }
  return null;
}

// Fungsi utama
async function main() {
  const fileStream = fs.createReadStream(INPUT_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const output = fs.createWriteStream(OUTPUT_FILE, { flags: "w" });

  for await (const line of rl) {
    const parts = line.split(",");
    if (parts.length < 2) continue;
    const ip = parts[0].trim();
    const port = parts[1].trim();

    const result = await checkProxy(ip, port);
    if (result) {
      console.log(`Live: ${result}`);
      output.write(result + "\n");
    }
  }

  output.end();
}

main();
