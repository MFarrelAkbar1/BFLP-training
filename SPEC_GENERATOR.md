# SPEC: Generator "Soal Baru" untuk General Ability Test

Status: **draf, menunggu persetujuan**. Belum ada kode yang ditulis.

Acuan: 20 soal asli di `gat.html` (data `TEST.questions`, komponen `COMP.*`). Soal asli, kunci, pembahasan, dan contoh soal (practice) **tidak diubah sama sekali**. Semua yang baru ditambahkan di samping data lama.

---

## 1. Ringkasan rancangan

- Satu set Soal Baru = 20 soal dengan **urutan tipe yang sama persis** dengan tes asli (lihat bagian 4). Setiap slot punya generator sendiri.
- Setiap generator adalah fungsi murni `gen(rng) → soal` yang menghasilkan objek dengan **format yang sama** dengan `TEST.questions[i]` (`type`, `prompt`, `data`, `answer`, `explain`, dst.). Komponen (`COMP.dayschedule`, `COMP.pie`, …) dan alur tes dipakai ulang tanpa perubahan.
- **Kunci tidak pernah ditulis manual.** Generator membuat skenario, lalu **verifier terpisah** menyelesaikan soal dari data skenario (bukan dari jalan pintas generator). Soal diterima hanya bila verifier menemukan tepat satu jawaban dan jawaban itu sama dengan hasil generator. Jika tidak, generator mengulang dengan angka acak berikutnya (maks. 400 percobaan per slot, deterministik dari seed).
- Pembahasan (`explain.key`, `steps`, `table`, `trap`) dibangun dari jejak (trace) verifier, jadi angka di pembahasan selalu sama dengan kunci.
- Tidak ada komponen baru. Semua 9 komponen yang ada cukup (sudah saya cek kontrak datanya, lihat bagian 3).

## 2. Lokasi kode, seed, dan determinisme

```
gat.html
  <script id="gat-gen">   ← BARU: generator + verifier + skor bobot. Murni, tanpa DOM.
                             Mengekspos globalThis.GATGEN = { VERSION, buildSet(seed), gens, verify, weight, ORIGINAL_META }
  <script>                ← skrip lama; hanya ditambah wiring pilihan bank soal (bagian 7)
tools/gen-check.mjs       ← BARU: skrip uji Node (membaca blok <script id="gat-gen"> dari gat.html, jalan di node:vm)
```

- Tetap satu file HTML mandiri, vanilla JS, tanpa build. `tools/` ditambahkan ke `.vercelignore` (SPEC*.md sudah dikecualikan).
- **PRNG**: `mulberry32`. Seed set = 6 karakter base32 tanpa huruf ambigu (mis. `K7Q2XA`). Seed per slot = `hash32(VERSION + ":" + seed + ":" + slot)`, jadi mengganti satu generator tidak mengubah soal di slot lain.
- Seed ditampilkan sebagai `v1-K7Q2XA`. Kalau versi generator berubah nanti, seed lama tetap bisa diputar ulang selama versinya cocok; seed versi lain diberi peringatan.
- Pembuatan 20 soal di browser ditargetkan < 300 ms (enumerasi terbesar: penjadwalan 4 tugas ≈ 18⁴ kombinasi dengan pemangkasan, dan monthcal 5! × 2 mode).

## 3. Kontrak generator

```js
// Setiap generator
{
  slot: 1,                     // posisi di set (1–20)
  family: "sched-category",    // sub-template
  origin: 1,                   // nomor soal asli yang menjadi patokan kesulitan
  scenarios: [ /* ≥ 8 skenario cerita berbahasa Inggris */ ],
  build(rng) → { meta },       // acak skenario + angka → data terstruktur (belum ada kunci)
  solve(meta) → { solutions, trace, naive },   // verifier: enumerasi penuh
  render(meta, sol, trace) → question          // objek soal format TEST.questions + explain (ID)
}
```

Alur `gen(rng)` per slot:

1. `meta = build(rng)` → nama, angka, jam, warna, aturan.
2. Cek angka "bagus" (bulat, dalam rentang komponen; lihat aturan per tipe). Gagal → ulang.
3. `solve(meta)` dengan **enumerasi lengkap** → harus `solutions.length === 1`. Gagal → ulang.
4. **Cek jebakan**: `solve(meta, {naive: true})` dengan interpretasi keliru yang umum (mis. aturan kategori hanya untuk tugas yang namanya persis disebut). Jebakan sah hanya jika interpretasi naif menghasilkan jawaban berbeda atau tidak unik. Gagal → ulang.
5. **Cek minimalitas** (penjadwalan, kalender, peringkat, ruangan): menghapus satu petunjuk/aturan mana pun harus membuat solusi tidak unik. Ini mencegah soal jadi lebih mudah karena petunjuk berlebih.
   *Revisi tahap 3:* jebakan yang "terverifikasi" untuk pola bentuk (2, 7, 10) dan peringkat (14) ternyata tidak dimiliki soal aslinya sendiri menurut solver (J = 0). Agar tidak lebih sulit, jebakan di tipe ini tidak diwajibkan lolos cek naif. Yang diwajibkan adalah unsur jebakan yang sama dengan soal asli: beberapa aturan pola berjalan bersamaan, dan peringkat selalu memuat petunjuk "n orang di antara X dan Y". J tetap dihitung dan masuk bobot. Untuk slot 19, jebakan ringan K2 = huruf dan angka bergeser dengan besaran berbeda (atau aturan yang salah tetap menuju lingkaran yang ada). Untuk slot 20 = huruf berpindah posisi, jadi perbandingan per posisi tidak menemukan aturan. Definisi yang sama dipakai untuk menghitung bobot soal asli.
   *Revisi tahap 2:* soal asli 4 ternyata hanya punya 3 petunjuk wajib dari 5 (petunjuk Customer Support dan Training bisa dihapus tanpa mengubah jawaban). Agar tidak lebih sulit dari aslinya, kalender bulanan memakai aturan "jumlah petunjuk wajib = soal asli ± 1" (3–4 dari 5). Penjadwalan tetap wajib minimal penuh, karena soal asli 1, 9, 12, dan 17 juga minimal penuh.
6. Hitung bobot kesulitan `W` (bagian 5). Di luar pita slot → ulang.
7. Cek anti-salinan: tanda tangan struktur (urutan jenis relasi, jenis aturan pola, dsb.) tidak boleh sama dengan soal asli di slot itu.
8. `render()` → objek soal + pembahasan. Kunci (`answer`) diambil dari `solutions[0]`.

Jika 400 percobaan habis (seharusnya tidak terjadi; skrip uji akan mengukurnya), slot jatuh ke seed berikutnya dan kejadian ini dihitung di laporan.

## 4. Komposisi set dan generator per slot

| Slot | Asli | Tipe / komponen | Generator (sub-template) | Jebakan wajib (diverifikasi otomatis) |
|---|---|---|---|---|
| 1 | 1 | `dayschedule` 1 baris | **sched-category** | Tugas yang termasuk kategori berbatasan tidak disebut namanya di aturan (mis. "all *inspections* after 1:00" + tugas "Fire Drill Inspection") |
| 2 | 2 | `shapepattern` pentagram | **shape** | Hipotesis yang cocok untuk gambar 1–2 saja memberi jawaban lain |
| 3 | 3 | `pie` | **pie-chain** | Urutan hitung: relasi bergantung pada nilai turunan, bukan pada angka pasti |
| 4 | 4 | `monthcal` | **monthcal** | "any day of the week" vs "weekdays only": mode sebaliknya memberi jawaban lain / tanpa solusi |
| 5 | 5 | `pie` | **pie-profit** | Porsi pendapatan ≠ porsi profit (dan satu irisan kebetulan sama → terasa benar) |
| 6 | 6 | `roommatch` | **room** | Aturan implisit: berbagi ruang pagi/sore, privasi, "tetap di kantor sendiri sebisa mungkin" |
| 7 | 7 | `shapepattern` hexagram | **shape** | sama dengan slot 2 |
| 8 | 8 | `pie` | **pie-algebra** | Bulatkan hanya di langkah terakhir: membulatkan lebih awal memberi persen berbeda |
| 9 | 9 | `dayschedule` multi-orang | **sched-prereq** | Syarat urutan hanya terbaca di popover; slot paling awal "terlihat kosong" ternyata belum boleh |
| 10 | 10 | `shapepattern` square | **shape** | sama dengan slot 2 |
| 11 | 11 | `stackedbar` 2 batang | **sb-plan-actual** | Total tetap sama, persen dihitung dari total batang masing-masing |
| 12 | 12 | `dayschedule` ruangan | **sched-capacity** | Perubahan (perpanjangan/tambahan orang) harus diterapkan dulu; jeda pembersihan |
| 13 | 13 | `stackedbar` 3 batang | **sb-categories** | Tinggi awal satu batang salah dan harus diubah, bukan hanya persennya |
| 14 | 14 | `rankbadges` | **rank** | Rasio terbalik (A ÷ B < 1) atau "n orang di antara X dan Y" |
| 15 | 15 | `shapepattern` hexagram | **shape** (grup pasangan) | sama dengan slot 2, ditambah pengelompokan pasangan yang harus disimpulkan |
| 16 | 16 | `stackedbar` 2 tahun | **sb-growth** | Persentase mundur (÷ 1,15, bukan × 0,85) |
| 17 | 17 | `dayschedule` 1 baris | **sched-buffer** | Jeda wajib juga berlaku untuk acara yang **sudah ada** (hanya terbaca di popover) |
| 18 | 18 | `linepoints` | **fx** | lihat keputusan K2 di bagian 8 |
| 19 | 19 | `nodeline` | **seq-alnum** | Dua aturan bergantian |
| 20 | 20 | `nodeline` | **seq-word** | Aturan lintas posisi huruf |

### 4.1 Penjadwalan (slot 1, 9, 12, 17) — `dayschedule`

Grid tetap 18 slot × 30 menit (9:00–6:00), format jam 12 jam seperti soal asli.

**sched-category (slot 1)** — 1 baris editable, 5–7 blok sibuk, 4 tugas (30/60/90 menit). Aturan: satu aturan kategori ("All *X* must be after 1:00 p.m." / "before noon" / "not back-to-back") yang berlaku untuk 2 tugas, salah satunya tidak tersurat (nama tugasnya mengandung kategori, mis. *Forklift Safety Training*, *Quarterly Audit Review*).
**sched-buffer (slot 17)** — mirip, tetapi aturannya jeda/molor: "X frequently runs over by 30 minutes" / "the oven needs 30 minutes to cool after each bake" / "allow 30 minutes for sterilisation after every surgery", berlaku juga untuk blok yang sudah ada (nama blok hanya di popover). Ditambah 2–3 batas waktu ("before 3:00 p.m.", "as early as possible").
- Verifikasi: enumerasi semua penempatan 4 tugas (setiap tugas × setiap slot awal, dipangkas bila tumpang tindih) → tepat **1** penempatan valid. "As early as possible" diterapkan sebagai urutan leksikografis setelah filter.
- Naif: aturan kategori hanya untuk tugas yang disebut, atau jeda tidak berlaku untuk blok lama → harus ≥ 2 solusi atau solusi lain.

**sched-prereq (slot 9)** — 2–3 baris orang lain (read-only, nama acara di popover) + Your Calendar. 1 tugas bersama 1,5–2 jam. Syarat: "A and B must be finished before…" (acara berada di kalender orang lain) + "as early as possible" atau "as late as possible before 5:00". Varian kedua: "you may move one appointment per person by up to 30 minutes" seperti contoh soal, dengan acara yang tidak boleh digeser.
- Verifikasi: enumerasi semua jam mulai × semua kombinasi geser (bila varian geser) → tepat 1 jawaban optimal.
- Naif: abaikan syarat di popover → jam paling awal yang lain.

**sched-capacity (slot 12)** — 3 baris read-only + 1 baris editable (ruangan / lapangan / stasiun pengisian). Detail popover berisi angka (tamu, peserta, kW). Batas total (kapasitas gedung / daya listrik), 2 perubahan di teks soal (perpanjang 1 jam, tambah N orang), jeda persiapan 30–60 menit sebelum/sesudah acara di ruangan yang sama.
- Verifikasi: cek setiap jam mulai → tepat 1 lolos.
- Naif: tanpa menerapkan perubahan → ≥ 1 jam mulai tambahan lolos.

Skenario (≥ 8 per sub-template, contoh): klinik hewan (operasi + sterilisasi), studio rekaman, dapur katering (oven), laboratorium (sentrifus), gudang (dok bongkar muat), sekolah mengemudi, bengkel, percetakan, perpustakaan (ruang diskusi), pusat kebugaran (lapangan), stasiun pengisian EV (batas daya kW), aula konferensi.

### 4.2 Pie dan stacked bar (slot 3, 5, 8, 11, 13, 16)

Angka "bagus": semua persen jawaban bilangan bulat **tepat** (kecuali pie-algebra yang memang membulatkan di akhir), tiap irisan ≥ 5%, nilai uang kelipatan 1.000 atau 500, total batang bilangan bulat dalam `axisMax`.

**pie-chain (slot 3)** — 4 kategori, 1 nilai pasti + 3 relasi dari kumpulan {persen dari, pecahan dari, rasio a:b, selisih, "twice/three times"}. Graf ketergantungan wajib punya kedalaman ≥ 2 (ada relasi yang merujuk nilai turunan). Generator memilih persen jawaban dulu, lalu total, lalu menurunkan nilai dan relasi yang angkanya rapi.
**pie-profit (slot 5)** — 4 produk/layanan: unit × harga − biaya (biaya tetap per produk, biaya per unit, atau komisi %). Wajib: porsi pendapatan berbeda dari porsi profit di ≥ 3 irisan; satu irisan boleh kebetulan sama (umpan).
**pie-algebra (slot 8)** — total diketahui, 3 relasi linear terhadap satu nilai x (× k, + d). Wajib: membulatkan x atau nilai antara lebih awal menghasilkan persen berbeda; jumlah persen setelah dibulatkan tetap 100.
**sb-plan-actual (slot 11)** — 2 batang (rencana/realisasi) dengan total sama; satu komponen naik p%, satu turun q%. Persen kedua batang bulat.
**sb-categories (slot 13)** — 3 batang (kategori) × 2 seri (tahun/cabang), 4 pernyataan (jumlah per seri, pecahan, total gabungan). Tinggi awal: tepat satu batang salah, sisanya sudah benar (umpan).
**sb-growth (slot 16)** — 2 tahun × 2 seri, kenaikan p% pada satu seri, selisih total, satu nilai tahun 2, satu nilai tahun 1. Wajib: nilai tahun 1 = nilai tahun 2 ÷ (1 + p) bulat, sedangkan × (1 − p) tidak bulat atau memberi persen lain. Tinggi awal kedua batang salah.

- Verifikasi: hitung ulang dengan aritmetika pecahan (rasional, bukan float) dari pernyataan teks yang sudah dirender; hasil harus sama dengan nilai yang dipilih generator. Persamaan linear diselesaikan dengan eliminasi Gauss rasional; sistem harus punya tepat satu solusi.
- Urutan irisan pie dan warna kartu diacak; slice pertama tetap di jam 12 (perilaku komponen).

Skenario (≥ 8): pendapatan cabang/wilayah, penjualan produk, liter bahan bakar, ton panen per kebun, kunjungan situs per kanal, anggaran proyek, hasil survei kepuasan, penumpang per moda, pemakaian listrik per gedung, donasi per kampanye.

### 4.3 Kalender bulanan (slot 4) — `monthcal`

30 hari, hari pertama acak (0–6), 5 item (departemen/lokasi/modul). Tiap item d hari berturut-turut (3–5) diikuti jeda j hari (1–3), mulai tanggal s. Mode: **"any day of the week"** atau **"weekdays only"** (Sabtu–Minggu dilewati, baik untuk hari kerja maupun jeda).
Jenis petunjuk: posisi ke-n, mulai di hari X, mencakup tanggal T, sebelum/sesudah Y, berakhir di hari X, bukan yang pertama/terakhir. Pertanyaan: tanggal mulai 2 item (kadang 1 atau 3, tetap ≤ 5 pilihan).
- Verifikasi: jadwal kerangka dihitung dari (s, d, j, mode); enumerasi 5! = 120 urutan → tepat 1 cocok; jadwal harus muat di bulan; setiap petunjuk perlu (minimalitas).
- Naif: hitung dengan mode sebaliknya → jawaban berbeda atau tidak ada solusi.
- Skenario (≥ 8): audit anggaran, inspeksi gedung, renovasi lantai, pelatihan cabang, vaksinasi sekolah, kalibrasi mesin, pameran keliling, audit gudang, pemindahan server.

### 4.4 Pola bentuk (slot 2, 7, 10, 15) — `shapepattern`

Bentuk tetap per slot (pentagram, hexagram, square, hexagram) supaya jumlah region setara. Contoh 4 gambar (slot 10: 3 gambar), soal = gambar berikutnya.

Pustaka aturan (tiap aturan menguasai sekelompok region yang tidak bertabrakan):

| Aturan | Isi | Kompleksitas c |
|---|---|---|
| ALT | kelompok region selang-seling terisi/kosong atau susunan A/B (B = kebalikan warna A) | 1 (A/B: 2) |
| ROT(k, arah) | satu warna berpindah k posisi di cincin (ujung bintang / cincin luar persegi) | k = 1: 2 · k = 2: 3 |
| ATTACH(m) | warna kedua selalu m posisi dari warna pertama | 2 |
| PAIR-CYCLE | pasangan region bergerak bersama; urutan warna hijau → ungu → kosong berputar antar pasangan (periode 3) | 4 |

Generator menggabungkan 2–3 aturan (`Σc` dan jumlah aturan ikut bobot), membangkitkan gambar 1..n+1.
- Verifikasi keunikan: enumerasi **seluruh** hipotesis dari pustaka (semua k, arah, offset, kelompok, fase) yang mereproduksi semua gambar contoh; semua hipotesis yang cocok harus memprediksi gambar n+1 yang sama. Gambar n+1 tidak boleh sama dengan gambar contoh mana pun, dan tidak ada region yang diminta dua warna.
- Jebakan: ada hipotesis yang cocok dengan gambar 1–2 (atau 1–3) tetapi gagal di gambar terakhir dan memprediksi jawaban lain.
- Anti-salinan: kombinasi (aturan, arah, offset) tidak sama dengan soal asli di slot itu.
- Batas jujur: keunikan dijamin **terhadap pustaka aturan ini**, bukan terhadap semua aturan yang mungkin dibayangkan manusia. Pustakanya sengaja memuat semua aturan yang dipakai soal asli plus variasi terdekat, jadi tafsiran "wajar" sudah tercakup.

### 4.5 Pencocokan ruangan (slot 6) — `roommatch`

4–6 ruangan (dua sisi lorong, `side: "L"/"R"`), 5–6 orang. Satu kelompok ruangan tidak bisa dipakai (renovasi / pengecatan / tanpa internet). Atribut orang: pergi pagi, pergi sore, telepon pribadi seharian (harus sendiri), menerima tamu (tamu ikut ruang tuan rumah), tamu, butuh proyektor (hanya ruang tertentu). Tujuan: semua kebutuhan terpenuhi dan sesedikit mungkin orang dipindah dari kantornya sendiri.
- Verifikasi: enumerasi semua penugasan (ruangan^orang ≤ 6⁶ = 46.656) → filter kendala → ambil yang jumlah pindahnya minimal → harus tepat 1.
- Naif: tanpa aturan "pagi/sore boleh berbagi" atau tanpa "tetap di kantor sendiri" → tidak unik / jawaban lain.
- Skenario (≥ 8): kantor konsultan, firma hukum, klinik, redaksi, agensi desain, kantor cabang bank, kampus (ruang dosen), coworking.

### 4.6 Peringkat (slot 14) — `rankbadges`

6 orang, nilai tersembunyi berbeda-beda (bilangan bulat). Jenis petunjuk: nilai pasti, A ÷ B = r (r > 1 atau < 1), A = k × B, A > B + C, peringkat ke-n, "n orang punya lebih banyak dari X tapi lebih sedikit dari Y", selisih.
- Verifikasi: setiap petunjuk diterjemahkan ke kendala urutan yang **pasti tersirat**; enumerasi 720 permutasi → tepat 1 cocok. (Karena kendala urutan lebih lemah dari kendala angka, unik di sini berarti unik juga untuk angka sebenarnya.) Nilai asli harus memenuhi semua petunjuk. Minimalitas: tiap petunjuk perlu.
- Skenario (≥ 8): email, panggilan penjualan, tiket selesai, kilometer lari, buku dipinjam, paket terkirim, poin pelatihan, unit terjual.

### 4.7 Kurs (slot 18) — `linepoints`

4 mata uang (dipilih dari ~12), mata uang dasar bervariasi (USD/EUR/SGD/…), 4 transaksi. Kurs kelipatan 0,05; jumlah transaksi berangka "jelek" seperti soal asli (mis. 413 → 536,9). Sumbu dipilih otomatis (rentang 0,70 dengan tick 0,10) agar semua kurs masuk.
- Verifikasi: kurs = asing ÷ dasar dihitung rasional, harus tepat kelipatan 0,05 dan di dalam sumbu.

### 4.8 Urutan node (slot 19, 20) — `nodeline`

8 token, 3 pertama tersambung (garis tegas), 1 garis petunjuk, pengguna menggambar 5 garis.
**seq-alnum (slot 19)**: token huruf+angka / angka+huruf / dua huruf; dua operasi (Δhuruf, Δangka) bergantian, atau satu operasi tetap dengan Δ berubah teratur (+1, +2, +3…).
**seq-word (slot 20)**: token 3 huruf; aturan lintas posisi (huruf posisi i berikutnya = huruf posisi j sekarang ± s), 3 relasi.
- Verifikasi: enumerasi semua hipotesis aturan dari pustaka yang cocok dengan 3 transisi yang terlihat (2 tegas + petunjuk); setiap hipotesis yang menghasilkan rantai lengkap di antara 8 node harus menghasilkan rantai yang sama. Tidak ada wrap alfabet (A–Z) atau angka di luar 1–9.
- Tata letak: memakai 2 set koordinat node soal asli (8 titik), penempatan token diacak; ditolak bila garis jawaban melewati lingkaran lain atau rantai jawaban berbentuk keliling poligon yang terlalu jelas.

## 5. Bobot kesulitan dan tabel kalibrasi

Rumus sama untuk semua tipe:

**W = L + K + 2·J + I**

- **L** (langkah): jumlah langkah penalaran minimum = panjang jejak verifier yang dipakai untuk pembahasan (satu deduksi = satu langkah; untuk penjadwalan, +1 setiap kali perlu melihat ke depan/backtrack).
- **K** (kendala): jumlah data/aturan yang harus dipakai (tugas + aturan; pernyataan; petunjuk; aturan pola Σc).
- **J** (jebakan): jumlah jebakan yang **lolos verifikasi otomatis** (bagian 3 langkah 4).
- **I** (implisit): 1 bila informasi kunci tersembunyi di popover atau aturannya harus disimpulkan sendiri.

Tabel di bawah adalah **estimasi manual saya**. Nilai final dihitung oleh fungsi `weight()` yang sama dengan yang dipakai generator, dijalankan pada `ORIGINAL_META` (data terstruktur 20 soal asli), lalu dicetak oleh skrip uji. Kalau hasil skrip berbeda dari tabel ini, angka skrip yang dipakai dan saya laporkan selisihnya.

| Asli | Tipe | L | K | J | I | **W** | Pita target slot |
|---|---|---|---|---|---|---|---|
| 1 | Jadwal kategori | 4 | 5 (4 tugas + 1 aturan) | 1 | 0 | **11** | 10–12 |
| 9 | Jadwal prasyarat | 4 | 4 | 1 | 1 | **11** | 10–12 |
| 12 | Jadwal kapasitas | 4 | 5 | 1 | 1 | **12** | 11–13 |
| 17 | Jadwal jeda | 5 | 8 | 1 | 1 | **16** | 15–17 |
| 3 | Pie rantai | 4 | 4 | 1 | 0 | **10** | 9–11 |
| 5 | Pie profit | 3 | 5 | 1 | 0 | **10** | 9–11 |
| 8 | Pie aljabar | 4 | 4 | 0 | 0 | **8** | 8–10 |
| 11 | Bar rencana/realisasi | 4 | 3 | 0 | 0 | **7** | 7–9 |
| 13 | Bar 3 kategori | 6 | 4 | 1 | 0 | **12** | 11–13 |
| 16 | Bar pertumbuhan | 5 | 4 | 1 | 0 | **11** | 10–12 |
| 4 | Kalender bulanan | 6 | 8 | 1 | 0 | **16** | 15–17 |
| 2 | Pola pentagram | 3 | 8 (Σc 5 + 3 aturan) | ? | 1 | **≈12** | ±1 dari skrip |
| 7 | Pola hexagram | 3 | 11 | ? | 1 | **≈15** | ±1 dari skrip |
| 10 | Pola persegi | 2 | 8 | ? | 1 | **≈11** | ±1 dari skrip |
| 15 | Pola pasangan | 3 | 9 | ? | 1 | **≈13** | ±1 dari skrip |
| 6 | Ruangan | 4 | 7 | 1 | 1 | **14** | 13–15 |
| 14 | Peringkat | 6 | 6 | 1 | 0 | **14** | 13–15 |
| 18 | Kurs | 4 | 4 | 0 | 0 | **8** | 8–9 |
| 19 | Node huruf+angka | 5 | 4 | 0 | 1 | **10** | 9–11 |
| 20 | Node kata | 5 | 6 | 0 | 1 | **12** | 11–13 |

`?` = J pola bentuk baru bisa dipastikan setelah enumerasi hipotesis pada soal asli dijalankan.
Pita target: W asli ± 1 untuk tipe yang hanya punya satu soal asli; untuk slot dengan beberapa soal asli sejenis, pita dipusatkan pada soal asli di slot itu supaya posisi mudah/sulit dalam tes tetap sama.

## 6. Skrip uji `tools/gen-check.mjs`

```
node tools/gen-check.mjs            # 200 soal per generator (seed 1..200)
node tools/gen-check.mjs --n 1000   # lebih banyak
node tools/gen-check.mjs --slot 4   # satu slot saja, cetak contoh soal + pembahasan
```

Laporan per generator:
- **Lolos verifikasi**: % kandidat mentah yang lolos keunikan, % lolos cek jebakan, % lolos pita bobot, rata-rata percobaan per soal, jumlah kegagalan total (target 0).
- **Verifikasi ulang independen**: setiap soal yang diterima diselesaikan lagi dari objek soal final (bukan dari `meta`) oleh solver brute-force kedua; kunci harus sama, 200/200.
- **Distribusi bobot**: min / median / maks / histogram W vs W soal asli di slot itu.
- **Variasi**: jumlah skenario berbeda yang terpakai (≥ 8), jumlah nama unik, persentase pasangan soal yang identik (target 0%).
- **Kalibrasi**: tabel W 20 soal asli dihitung dari `ORIGINAL_META`, dan cek bahwa verifier juga menemukan kunci asli secara unik (sanity check solver terhadap soal asli).
- Waktu rata-rata membangkitkan satu set penuh.

## 7. Fitur di aplikasi

- **Intro**: kartu baru "Bank soal" dengan dua pilihan (gaya `.opt` yang sudah ada):
  - **Soal Asli (20)** — default, perilaku persis seperti sekarang.
  - **Soal Baru (20, acak)** — menampilkan seed set saat ini (`Seed: v1-K7Q2XA`), tombol **"Buat set baru"**, dan kolom kecil "Pakai seed" untuk memutar ulang set tertentu. URL `gat.html?seed=v1-K7Q2XA` juga langsung memilih set itu.
- Contoh soal (practice) tetap contoh soal asli untuk kedua bank.
- Alur tes, timer 30 menit / tanpa batas, penilaian, halaman hasil, dan pembahasan memakai fungsi yang sama (`startTest`, `renderQuestion`, `next`, `finish`, `renderResult`, `reviewBlock`). Satu-satunya perubahan: `app.list` diisi dari `GATGEN.buildSet(seed)` bila Soal Baru dipilih.
- **Hasil**: di header ditambah baris "Soal Baru · seed v1-K7Q2XA" + tombol "Kerjakan ulang set ini" (bank soal asli: tidak ada perubahan).
- Bahasa: soal, instruksi, label komponen bahasa Inggris; pembahasan dan UI bahasa Indonesia (sama dengan sekarang).
- Bila generator gagal untuk satu slot (seharusnya tidak pernah), set tidak dimulai dan muncul pesan "Gagal membuat set, coba seed lain", bukan soal setengah jadi.

## 8. Keputusan yang perlu kamu ambil

**K1. Pita kesulitan.** Saya usulkan pita W asli ± 1 per slot (tabel bagian 5). Alternatif: pakai rentang min–maks seluruh tipe (lebih variatif, tapi soal di posisi 1 bisa sesulit posisi 17).

**K2. "Minimal satu jebakan per soal" vs soal asli tanpa jebakan.** Soal asli 8, 11, 18, 19, 20 tidak punya kotak "Jebakan" (J = 0). Menambah jebakan penuh membuat soal baru lebih sulit dari aslinya (W naik 2). Usulan saya: soal di slot ini tetap diberi satu jebakan ringan yang **tidak menambah langkah** (dihitung J = 0,5):
- slot 8: bulatkan terlalu dini memberi jawaban lain;
- slot 11: total kedua batang sama, jadi godaan untuk mengubah total;
- slot 18: dua mata uang punya kurs sama, atau satu transaksi ditulis terbalik ("72 GBP was exchanged for 90 USD") — saya sarankan **yang pertama** (kurs kembar) agar tidak lebih sulit;
- slot 19–20: dua node pengecoh yang cocok dengan salah satu dari dua aturan tapi tidak dengan aturan lengkapnya.
Pita bobot dinaikkan +1 untuk slot ini. Atau: biarkan slot ini tanpa jebakan, persis seperti aslinya.

**K3. Bentuk pola per slot.** Usulan: bentuk tetap sama dengan slot asli (pentagram, hexagram, persegi, hexagram). Alternatif: bentuk diacak di antara ketiganya (lebih variatif, kesulitan sedikit bergeser karena jumlah region berbeda).

**K4. Lokasi skrip uji.** `tools/gen-check.mjs` dikecualikan dari deploy lewat `.vercelignore`. Alternatif: skrip uji di console browser saja (`GATGEN.selfTest(200)`). Saya akan menyediakan keduanya kecuali kamu keberatan.

## 9. Risiko dan rencana cadangan

- **Pola bentuk** adalah tipe paling rawan: keunikan hanya bisa dijamin terhadap pustaka aturan. Kalau tingkat lolos < 20% atau saya menemukan tafsiran wajar di luar pustaka yang memberi jawaban lain, saya batasi generator ke aturan yang sama dengan soal asli (ROT/ATTACH/ALT/PAIR-CYCLE dengan parameter berbeda) dan lapor dulu sebelum lanjut.
- **Urutan node (seq-word)**: ruang hipotesis aturan lintas posisi cukup besar; kalau terlalu banyak hipotesis cocok dengan 3 transisi, saya tambah satu garis tegas (4 node pertama tersambung). Ini sedikit lebih mudah dari asli, jadi akan dilaporkan dulu.
- Tidak ada tipe yang saat ini saya nilai mustahil dibuat dengan jaminan keunikan, jadi belum ada usulan tipe pengganti.

## 10. Rencana kerja (setelah spec disetujui)

1. **Tahap 2**: `<script id="gat-gen">` dengan PRNG, utilitas rasional, skor bobot, `ORIGINAL_META` + tiga generator: **penjadwalan (keempat sub-template)**, **pie (tiga sub-template)**, **kalender bulanan**. `tools/gen-check.mjs`. Laporan statistik 200 soal per generator + kalibrasi soal asli. **Berhenti, tunggu persetujuan.**
2. **Tahap 3**: generator stacked bar, pola bentuk, ruangan, peringkat, kurs, urutan node. Integrasi UI (bagian 7).
3. **Tahap 4**: uji akhir di Chrome: 3 set acak + soal asli dikerjakan dari intro sampai hasil lewat interaksi komponen sungguhan (klik, seret, dan jalur keyboard yang sudah ada di tiap komponen, bukan `GAT.fillKey`), mengisi jawaban dari kunci generator → harus 20/20 untuk ketiga set dan 20/20 untuk soal asli. Cek tampilan 375 px dan mode gelap.
