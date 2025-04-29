const fs = require("fs");
const axios = require("axios");
const readline = require("readline");

const API_URL = "https://api.jb8fd7grgd.workers.dev";
const TIMEOUT_MS = 10000;
const INPUT_FILE = "ProxyList.txt";
const OUTPUT_FILE = "results.txt";
const CONCURRENCY = 50; // jumlah request bersamaan

// Fungsi untuk mengganti simbol . dan - dengan spasi, serta menghapus spasi ganda
function sanitizeOrg(org) {
  return org
    .replace(/[.-]/g, ' ')      // Ganti simbol . dan - dengan spasi
    .replace(/\s+/g, ' ')       // Menghapus spasi ganda
    .trim();                   // Menghapus spasi di awal dan akhir
}

async function checkProxy(ip, port) {
  const url = `${API_URL}/${ip}:${port}`;
  try {
    const response = await axios.get(url, { timeout: TIMEOUT_MS });
    const data = response.data[0];
    if (data && data.proxyip) {
      const sanitizedOrg = sanitizeOrg(data.org);  // Menghapus simbol dan spasi ganda dari org
      return `${data.proxy},${data.port},${data.countryCode},${sanitizedOrg}`;
    }
  } catch (error) {
    // abaikan jika ada kesalahan
  }
  return null;
}

async function processInBatches(array, batchSize, callback) {
  let index = 0;
  while (index < array.length) {
    const batch = array.slice(index, index + batchSize); // Ambil batch
    await Promise.all(batch.map(callback));  // Jalankan batch
    index += batchSize; // Update indeks untuk batch selanjutnya
  }
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

    // Menambahkan tugas pengecekan proxy ke dalam array tasks
    tasks.push(() => checkProxy(ip, port).then((result) => {
      if (result) {
        console.log(`Live: ${result}`);
        output.write(result + "\n");
      }
    }));
  }

  // Jalankan tugas dalam batch dengan concurrency yang diinginkan
  await processInBatches(tasks, CONCURRENCY, (task) => task());
  
  output.end(); // Selesai menulis file output
}

main();
