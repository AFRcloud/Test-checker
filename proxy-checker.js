const fs = require("fs");
const axios = require("axios");
const readline = require("readline");

const API_URL = "https://api.jb8fd7grgd.workers.dev";
const TIMEOUT_MS = 10000;
const INPUT_FILE = "ProxyList.txt";
const OUTPUT_FILE = "results.txt";
const BATCH_SIZE = 300;

function sanitizeOrg(org) {
  // Hapus koma dan titik, ganti dengan spasi
  org = org.replace(/[,.]/g, ' ');

  // Pecah menjadi kata-kata
  const words = org.split(/\s+/);

  // Daftar kata yang harus dihapus
  const blacklist = ['com', 'org', 'net', 'edu', 'gov', 'inc', 'co', 'io', 'ltd', 'llc'];

  // Buang kata yang ada dalam daftar blacklist
  const filtered = words.filter(word => !blacklist.includes(word.toLowerCase()));

  // Gabungkan kembali dan hapus spasi ganda
  return filtered.join(' ').replace(/\s+/g, ' ').trim();
}

async function checkProxy(ip, port) {
  const url = `${API_URL}/${ip}:${port}`;
  try {
    const response = await axios.get(url, { timeout: TIMEOUT_MS });
    const data = response.data[0];
    if (data && data.proxyip) {
      const org = sanitizeOrg(data.org || '');
      return `${data.proxy},${data.port},${data.countryCode},${org}`;
    }
  } catch (_) {}
  return null;
}

async function processBatch(batch, output, counter) {
  const promises = batch.map(([ip, port]) =>
    checkProxy(ip, port).then(result => {
      if (result) {
        console.log(`Live: ${result}`);
        output.write(result + "\n");
      }
    })
  );
  await Promise.all(promises);
  console.log(`Processed ${counter} proxies...`);
}

async function main() {
  const fileStream = fs.createReadStream(INPUT_FILE);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  const output = fs.createWriteStream(OUTPUT_FILE, { flags: "w" });

  let batch = [];
  let total = 0;

  for await (const line of rl) {
    const parts = line.split(",");
    if (parts.length < 2) continue;

    batch.push([parts[0].trim(), parts[1].trim()]);
    total++;

    if (batch.length >= BATCH_SIZE) {
      await processBatch(batch, output, total);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await processBatch(batch, output, total);
  }

  output.end();
  console.log("Proxy checking completed.");
}

main();
