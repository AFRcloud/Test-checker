const fs = require("fs");
const axios = require("axios");
const readline = require("readline");

const API_URL = "https://api.jb8fd7grgd.workers.dev";  // Ganti dengan URL API Anda
const TIMEOUT_MS = 10000;
const INPUT_FILE = "ProxyList.txt";  // Nama file input yang berisi daftar IP dan Port
const OUTPUT_FILE = "results.txt";  // Nama file output untuk hasil pengecekan

async function checkProxy(ip, port) {
  const url = `${API_URL}/${ip}:${port}`;
  try {
    const response = await axios.get(url, { timeout: TIMEOUT_MS });
    const data = response.data[0];
    if (data && data.proxyip) {
      return `${data.proxy},${data.port},${data.countryCode},${data.org}`;
    }
  } catch (error) {
    // Abaikan kesalahan
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
  for await (const line of rl) {
    const parts = line.split(",");
    if (parts.length < 2) continue;
    const ip = parts[0].trim();
    const port = parts[1].trim();

    const task = checkProxy(ip, port).then((result) => {
      if (result) {
        console.log(`Live: ${result}`);
        output.write(result + "\n");
      }
    });

    tasks.push(task);
  }

  await Promise.all(tasks);
  output.end();
  console.log("Pengecekan selesai. Hasil disimpan di", OUTPUT_FILE);
}

main();
