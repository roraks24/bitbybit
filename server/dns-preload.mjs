/**
 * DNS-over-HTTPS preloader for MongoDB Atlas
 * Monkey-patches Node's dns module to use Google DoH for *.mongodb.net domains
 * This bypasses university/corporate DNS that blocks MongoDB Atlas SRV records
 * 
 * Usage: node --import ./dns-preload.mjs index.js
 */
import dns from 'dns';

const originalResolveSrv = dns.resolveSrv.bind(dns);
const originalResolve4 = dns.resolve4.bind(dns);
const originalResolveTxt = dns.resolveTxt.bind(dns);

function isMongoHost(hostname) {
  return hostname.includes('mongodb.net');
}

async function dohQuery(name, type) {
  const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`);
  if (!res.ok) throw new Error(`DoH query failed: ${res.status}`);
  return res.json();
}

dns.resolveSrv = function (hostname, callback) {
  if (!isMongoHost(hostname)) return originalResolveSrv(hostname, callback);
  dohQuery(hostname, 'SRV')
    .then(data => {
      if (!data.Answer) return callback(new Error(`No SRV records for ${hostname}`));
      const records = data.Answer.filter(a => a.type === 33).map(a => {
        const [priority, weight, port, target] = a.data.split(' ');
        return { priority: +priority, weight: +weight, port: +port, name: target.replace(/\.$/, '') };
      });
      callback(null, records);
    })
    .catch(callback);
};

dns.resolve4 = function (hostname, ...args) {
  const callback = args[args.length - 1];
  if (!isMongoHost(hostname)) return originalResolve4(hostname, ...args);
  dohQuery(hostname, 'A')
    .then(data => {
      if (!data.Answer) return callback(new Error(`No A records for ${hostname}`));
      const ips = data.Answer.filter(a => a.type === 1).map(a => a.data);
      if (args.length > 1 && typeof args[0] === 'object') {
        callback(null, ips.map(ip => ({ address: ip, ttl: 60 })));
      } else {
        callback(null, ips);
      }
    })
    .catch(callback);
};

dns.resolveTxt = function (hostname, callback) {
  if (!isMongoHost(hostname)) return originalResolveTxt(hostname, callback);
  dohQuery(hostname, 'TXT')
    .then(data => {
      if (!data.Answer) return callback(null, []);
      const records = data.Answer.filter(a => a.type === 16).map(a => [a.data.replace(/"/g, '')]);
      callback(null, records);
    })
    .catch(callback);
};

console.log('✅ DNS-over-HTTPS preloader active for *.mongodb.net');
