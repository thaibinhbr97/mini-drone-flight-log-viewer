import fs from "node:fs";

const points = Number(process.argv[2]) || 3000;
const out = process.argv[3] || "sample.csv";

const centerLat = 49.2827, centerLon = -123.1207; // Vancouver
const start = Date.now() - points * 1000;

const lines = ["timestamp,lat,lon,alt,battery,speed"];
for (let i = 0; i < points; i++) {
  const t = i / points;
  const angle = t * Math.PI * 4;
  const radius = 0.004 + 0.002 * Math.sin(t * 10);
  const lat = centerLat + radius * Math.sin(angle);
  const lon = centerLon + radius * Math.cos(angle);
  const alt = Math.min(120, t * 600) * (t > 0.9 ? (1 - t) * 10 : 1);
  const battery = 100 - t * 70;
  const speed = 8 + 3 * Math.sin(angle * 2);
  lines.push([start + i * 1000, lat.toFixed(6), lon.toFixed(6), alt.toFixed(1), battery.toFixed(1), speed.toFixed(1)].join(","));
}
fs.writeFileSync(out, lines.join("\n"));
console.log(`Wrote ${points} rows to ${out}`);
