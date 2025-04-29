const fs = require("fs");
const axios = require("axios");
const readline = require("readline");

const API_URL = "https://api.jb8fd7grgd.workers.dev";
const TIMEOUT_MS = 10000;
const INPUT_FILE = "ProxyList.txt";
const OUTPUT_FILE = "results.txt";

// Daftar ekstensi yang akan dihapus
const domainExtensions = ['com', 'org', 'net', 'edu', 'gov', 'inc', 'co', 'io'];

function sanitizeOrg(org) {
  // Menghapus ekstensi jika ada (baik dengan titik atau tanpa titik)
  domainExtensions.forEach(ext => {
    // Menangani ekstensi tanpa titik di depan
    const regex = new RegExp(`\\s?${ext}$`, 'i');
    org = org.replace(regex, '');
  });

  // Ganti koma dan titik dengan spasi, hilangkan spasi ganda dan trim
  org = org.replace(/[,.]+/g, ' ').replace(/\s+/g, ' ').trim();

  return org;
}

async function checkProxy(ip, port) {
  const url = `${API_URL}/${ip}:${port}`;
  try {
    const response = await axios.get(url, { timeout: TIMEOUT_MS });
    const data = response.data[0];
    if (data && data.proxyip) {
      const org = sanitizeOrg(data.org); // Sanitasi nama organisasi
      return `${data.proxy},${data.port},${data.countryCode},${org}`;
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
}

main();
