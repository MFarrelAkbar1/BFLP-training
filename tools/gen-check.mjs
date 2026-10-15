// Uji generator Soal Baru (lihat SPEC_GENERATOR.md bagian 6).
//   node tools/gen-check.mjs                 200 soal per generator
//   node tools/gen-check.mjs --n 1000        lebih banyak
//   node tools/gen-check.mjs --slot 4        satu slot saja + contoh soal lengkap
//   node tools/gen-check.mjs --sample 3      cetak 3 contoh soal per generator
//   node tools/gen-check.mjs --file x.js     uji file lain (default: gat.html, blok <script id="gat-gen">)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); return i < 0 ? d : args[i + 1]; };
const N = +opt("n", 200), SLOT = opt("slot") ? +opt("slot") : null, SAMPLE = +opt("sample", SLOT ? 2 : 0);
const here = path.dirname(fileURLToPath(import.meta.url));
const file = opt("file", path.join(here, "..", "gat.html"));

const src = readFileSync(file, "utf8");
const m = src.match(/<script id="gat-gen">([\s\S]*?)<\/script>/);
const code = m ? m[1] : src;
const ctx = vm.createContext({ console, crypto: globalThis.crypto });
vm.runInContext(code, ctx, { filename: "gat-gen" });
const GG = ctx.GATGEN;

const strip = s => String(s).replace(/<[^>]+>/g, "");
const t0 = Date.now();
const { calibration, report } = GG.selfTest(N, SLOT);

console.log(`\nGATGEN ${GG.VERSION} · ${N} soal per generator · sumber: ${path.basename(file)}\n`);
console.log("KALIBRASI SOAL ASLI (dihitung oleh solver & rumus bobot yang sama)");
console.log("Asli  L  K  J    I  W     kunci unik  kunci hasil solver");
for (const [id, c] of Object.entries(calibration))
  console.log(`${String(id).padStart(4)}  ${c.w.L}  ${c.w.K}  ${String(c.w.J).padEnd(3)}  ${c.w.I}  ${String(c.W).padEnd(4)}  ${c.unique ? "ya" : "TIDAK"}         ${JSON.stringify(c.key)}`);

console.log("\nGENERATOR");
console.log("Slot Generator         Dibuat  Verif.ulang  Lolos unik  Lolos jebakan  Percobaan/soal  W asli  W min–maks (median)  Histogram W        Skenario  Nama  Kembar%  ms/soal");
for (const r of report) {
  const hist = Object.entries(r.W.hist).map(([w, c]) => `${w}:${c}`).join(" ");
  console.log(`${String(r.slot).padStart(4)} ${r.family.padEnd(16)} ${`${r.generated}/${r.n}`.padStart(7)}  ${`${r.verified}/${r.generated}`.padStart(11)}  ${(r.uniquePassRate + "%").padStart(10)}  ${(r.trapPassRate + "%").padStart(13)}  ${String(r.attemptsPerQ).padStart(14)}  ${String(r.W.orig).padStart(6)}  ${`${r.W.min}–${r.W.max} (${r.W.median})`.padEnd(19)}  ${hist.padEnd(17)}  ${`${r.scenariosUsed}/${r.scenarios}`.padStart(8)}  ${String(r.distinctNames).padStart(4)}  ${String(r.duplicates).padStart(8)}  ${String(r.msPerQ).padStart(7)}`);
  if (r.failures.length) console.log("     GAGAL:", r.failures.join(" | "));
}
console.log("\nAlasan penolakan kandidat (jumlah):");
for (const r of report) console.log(`  ${r.family.padEnd(16)} ${Object.entries(r.rej).map(([k, v]) => `${k}=${v}`).join("  ")}`);

const bad = report.filter(r => r.generated !== r.n || r.verified !== r.generated || r.W.min < r.W.orig - 1 || r.W.max > r.W.orig + 1 || r.duplicates > 0.5);
console.log(`\nWaktu total ${((Date.now() - t0) / 1000).toFixed(1)} dtk. ${bad.length ? "ADA MASALAH: " + bad.map(r => r.family).join(", ") : "Semua generator lolos."}`);

if (SAMPLE) {
  for (const g of GG.gens) {
    if (SLOT && g.slot !== SLOT) continue;
    for (let i = 1; i <= SAMPLE; i++) {
      const q = GG.generate(g, GG.slotSeed("SAMPLE" + i, g.slot));
      console.log(`\n────────── Contoh slot ${g.slot} (${g.family}) #${i} · W=${q.gen.W} ──────────`);
      if (q.title) console.log("# " + q.title);
      if (q.intro) console.log(q.intro);
      (q.bullets || []).forEach(b => console.log("  • " + b));
      if (q.type === "shapepattern") { q.data.examples.forEach((e, k) => console.log(`  gambar ${k + 1}: ${JSON.stringify(e)}`)); }
      if (q.type === "nodeline") console.log(`  node: ${q.data.nodes.map(n => n.id).join(" ")} · tegas: ${q.data.fixed.map(e => e.join("–")).join(", ")} · putus-putus: ${q.data.hint.join("→")}`);
      if (q.type === "roommatch") console.log(`  ruang: ${q.data.rooms.map(r => `${r.label} (${r.side})`).join(", ")}`);
      (q.cards || []).forEach(c => console.log(`  [${c.title}] ${c.text.replace("\n", " · ")}`));
      (q.clues || []).forEach(c => console.log(`  [${c.name}] ${c.text}`));
      console.log("Q: " + q.prompt);
      (q.data.rows || []).forEach(r => console.log(`  ${r.label.padEnd(16)} ${r.events.map(e => `${e.start}–${e.end} ${e.name}${e.detail ? " (" + e.detail + ")" : ""}`).join(" | ")}`));
      (q.data.tasks || []).forEach(t => console.log(`  tugas: ${t.label} (${t.mins} mnt)`));
      if (q.type === "monthcal") console.log(`  kalender: 30 hari, tanggal 1 = ${["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][q.data.firstDow]}`);
      console.log("KUNCI: " + JSON.stringify(q.answer));
      console.log("Pembahasan: " + strip(q.explain.key));
      q.explain.steps.forEach((s, k) => console.log(`  ${k + 1}. ${strip(s)}`));
      if (q.explain.table) { console.log("  | " + q.explain.table.head.join(" | ")); q.explain.table.rows.forEach(r => console.log("  | " + r.join(" | "))); }
      if (q.explain.trap) console.log("  Jebakan: " + strip(q.explain.trap));
    }
  }
}
process.exitCode = bad.length ? 1 : 0;
// Kembar% = peluang dua soal acak di slot yang sama identik (jumlah pasangan kembar ÷ semua pasangan). Batas: 0,5%.
