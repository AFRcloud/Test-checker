// proxy-checker.js const axios = require('axios'); const fs = require('fs'); const path = require('path');

const PROXY_LIST_URL = 'https://raw.githubusercontent.com/AFRcloud/ProxyList/refs/heads/main/ProxyList.txt'; const API_URL = 'https://api.jb8fd7grgd.workers.dev'; const MAX_CONCURRENT = 30; const TIMEOUT_MS = 8000; const OUTPUT_FILE = path.resolve(__dirname, 'results.txt');

async function fetchProxyList() { const res = await axios.get(PROXY_LIST_URL); return res.data.split('\n').filter(line => line.trim() !== ''); }

async function checkProxy(ip, port) {
  const url = `${API_URL}/${ip}:${port}`; // <- gunakan backtick
  try {
    const response = await axios.get(url, { timeout: TIMEOUT_MS });
    const data = response.data[0];

    if (data && data.proxyip) {
      return `${data.proxy},${data.port},${data.countryCode},${data.org}`;
    }
  } catch (error) {
    // Ignore errors
  }
  return null;
}
if (data && data.proxyip) {
  return `${data.proxy},${data.port},${data.countryCode},${data.org}`;
}

} catch (error) { // Ignore errors } return null; }

async function processProxies(proxies) { const results = []; let index = 0;

async function worker(workerId) { while (index < proxies.length) { const line = proxies[index++]; const [ip, portMeta] = line.split(','); if (!ip || !portMeta) continue;

const [port] = portMeta.split('.');
  const result = await checkProxy(ip.trim(), port.trim());

  if (result) {
    results.push(result);
    console.log(`[${workerId}] ${result} => Live`);
  } else {
    console.log(`[${workerId}] ${ip}:${port} => Dead`);
  }
}

}

const workers = Array.from({ length: MAX_CONCURRENT }, (_, i) => worker(i + 1)); await Promise.all(workers); return results; }

async function main() { console.time('Total Waktu');

console.log('Mengambil daftar proxy...'); const proxyList = await fetchProxyList(); console.log(Total proxy yang akan dicek: ${proxyList.length});

const liveProxies = await processProxies(proxyList);

fs.writeFileSync(OUTPUT_FILE, liveProxies.join('\n'), 'utf8'); console.log(\nSelesai. Total proxy aktif: ${liveProxies.length}); console.log(Hasil disimpan ke: ${OUTPUT_FILE});

console.timeEnd('Total Waktu'); }

main();

