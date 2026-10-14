# SPEC: Latihan General Ability Test (prediksi soal BFLP)

Status: **draf, menunggu persetujuan**. Belum ada kode yang ditulis.

Sumber: `2_SHL_GENERAL ABILITY TEST.pdf` (40 halaman). Semua halaman sudah dirender jadi gambar dan dibaca satu per satu, termasuk zoom 220 dpi untuk soal pola bentuk (2, 7, 10, 15). Semua hitungan dan jadwal sudah saya verifikasi ulang secara mandiri (lihat bagian 4).

---

## 1. Output

| File | Isi |
|---|---|
| `index.html` | Aplikasi tunggal: HTML + CSS + JS vanilla, tanpa build step, tanpa dependensi selain Google Fonts (opsional, ada fallback). |
| `.vercelignore` | Mengecualikan `*.pdf`, file HTML acuan `3_…`, `4_…`, dan `SPEC.md` dari deploy. Tanpa ini, PDF berhak cipta 16 MB ikut terpublikasi di Vercel. |
| `vercel.json` | Tidak perlu. Vercel menyajikan `index.html` statis apa adanya (Framework preset: *Other*, tanpa build command). |

Gaya mengikuti file acuan `3_…html`: token warna di `:root`, mode gelap via `prefers-color-scheme` + `data-theme`, font Bricolage Grotesque / Instrument Sans / IBM Plex Mono, kolom fokus ±760 px (melebar ke ±960 px untuk soal yang butuh ruang, mis. kalender), bar atas menempel (`.bar`) dengan timer dan progress, alur `#intro → #practice → #test → #result`.

## 2. Alur aplikasi

1. **Intro**: judul, fakta (20 soal · 30 menit · satu soal per layar · tidak bisa kembali), instruksi dari halaman 1 PDF (diterjemahkan rapi, tetap bahasa Indonesia), pilihan mode waktu: **30 menit** (default) / **Tanpa batas (belajar)**.
2. **Contoh soal (practice)**: kalender Naomi/Oscar/Petra. Tidak dinilai, tidak memakai timer tes. Setelah "Periksa", tampil umpan balik + pembahasan singkat, lalu tombol "Mulai tes".
3. **Tes**: 20 soal berurutan. Tombol "Berikutnya" saja (tidak ada "Sebelumnya"). Konfirmasi ringan kalau soal belum disentuh sama sekali. Waktu per soal dicatat. Timer menurun di bar atas, berubah warna `warn` saat < 5 menit. Bila waktu habis, tes otomatis selesai dan soal sisanya dianggap kosong (salah). Mode tanpa batas: timer menghitung naik.
4. **Hasil**: skor X/20 + persen, total waktu, rata-rata waktu per soal, grid 20 kotak (benar/salah/kosong) yang bisa diklik untuk lompat ke pembahasan, daftar soal yang salah, lalu pembahasan tiap soal (lihat bagian 6). Tombol "Ulangi tes".
5. **Footer** di semua layar: "Simulasi latihan mandiri. Tidak berafiliasi dengan, dan tidak didukung oleh, SHL. Soal adalah prediksi, bukan soal resmi."

Bahasa: teks soal bahasa Inggris (persis seperti PDF, typo yang jelas diperbaiki: "Americans"→"Americas", "Asia-Pasific"→"Asia-Pacific", "earty"→"early", "Emalls"→"Emails"). UI dan pembahasan bahasa Indonesia.

## 3. Tipe interaksi (komponen yang bisa dipakai ulang)

Setiap komponen punya kontrak yang sama:

```js
const Component = {
  render(container, q, state, opts) {},   // opts.readOnly untuk tampilan pembahasan
  getAnswer(state) {},                    // nilai jawaban (serializable)
  isTouched(state) {},                    // sudah ada interaksi?
  grade(q, answer) {},                    // -> { correct: bool, parts: [{label, ok}] }
  renderReview(container, q, answer) {}   // jawaban user vs kunci, visual berdampingan
};
```

| # | Tipe (`type`) | Interaksi | Keyboard | Soal |
|---|---|---|---|---|
| 1 | `dayschedule` | Grid 18 slot × 30 menit (9:00–6:00). Blok abu-abu bisa diklik/Enter untuk membuka popover keterangan acara. Kartu tugas di bawah diseret ke baris "Your Calendar"/"Monday"/"Today"/"Banquet Room D". Blok yang sudah ditempatkan bisa diseret ulang atau dikembalikan. Bisa menampilkan beberapa baris kalender orang lain (read-only). Penempatan yang menabrak blok abu-abu ditolak (snap balik). | Pilih kartu (Enter) → panah kiri/kanan geser slot → Enter taruh, Esc batal | P, 1, 9, 12, 17 |
| 2 | `pie` | Pie 4 irisan, awal 25% semua. Batas Americas/Europe (jam 12) tetap; 3 handle lain digeser melingkar. Snap 1%. Label persen live di tiap irisan, minimal 1% per irisan. Urutan irisan searah jarum jam mengikuti PDF. | Tab ke handle, panah ±1% | 3, 5, 8 |
| 3 | `stackedbar` | 2–3 batang bertumpuk. Tiap batang punya handle **total** (atas batang, angka di atas) dan handle **pemisah** (persen bawah/atas live). Snap total 1 unit, persen 1%. Sumbu Y otomatis menyesuaikan saat total membesar. | Panah atas/bawah | 11, 13, 16 |
| 4 | `monthcal` | Kalender 30 hari (tanggal 1 = Jumat). Klik tanggal untuk pilih/batal, maksimal 5 tanggal (aturan halaman 1). | Tab + Enter/Spasi | 4 |
| 5 | `roommatch` | Denah: Ian's Office, Jasmine's Office, Meeting Room (kiri lorong); Linda's Office, Ken's Office (kanan). 5 avatar diseret ke ruangan. Satu ruangan boleh berisi banyak orang. | Pilih orang → pilih ruangan | 6 |
| 6 | `shapepattern` | SVG: 4 (atau 3) gambar contoh read-only + 1 gambar kosong besar. Klik region: putih → hijau → ungu polkadot → putih. Bentuk didefinisikan sebagai daftar polygon bernama, jadi pola baru cukup menambah data. | Tab ke region, Enter/Spasi untuk siklus | 2, 7, 10, 15 |
| 7 | `rankbadges` | 6 baris orang dengan slot kosong; badge 1–6 diseret ke slot. Tiap badge hanya sekali; menaruh badge yang sudah dipakai memindahkannya. | Pilih badge → pilih orang | 14 |
| 8 | `linepoints` | Line chart kategori (GBP, EUR, CAD, AUD). Titik mulai di bawah sumbu (belum diisi); seret vertikal, snap 0,05. Nilai live di samping titik, garis tersambung otomatis. Sumbu 0,70–1,40. | Panah ±0,05 | 18 |
| 9 | `nodeline` | Node lingkaran berlabel. Garis tegas yang sudah ada (read-only) dan panah putus-putus sebagai petunjuk. Tarik dari node ke node untuk membuat garis; klik garis buatan sendiri untuk menghapus; tombol "Hapus semua garis". | Pilih node asal → node tujuan (Enter) | 19, 20 |

Catatan teknis interaksi: semua seret memakai Pointer Events (mouse + sentuh), `touch-action:none` di area seret, target sentuh ≥ 40 px. Di layar < 560 px, kalender 18 slot tetap satu baris dengan label jam diringkas, dan baris kartu tugas pindah ke bawah sebagai daftar.

## 4. Daftar soal, kunci, dan verifikasi

Notasi waktu: format 12 jam seperti di PDF (9:00–6:00). Slot index 0 = 9:00, 17 = 5:30.

### P — Contoh soal (practice, tidak dinilai) ⚠️ lihat bagian 5
Team Meeting (1 jam, sekarang 3:30) dijadwal ulang lebih awal. Boleh menggeser satu acara per orang, maksimal ±30 menit. Acara "Kamu" dan client demo tidak boleh digeser.
Kunci PDF: **12:30–1:30**.

### 1 · `dayschedule` — Monday
Blok sibuk: 9:00–10:00, 11:30–12:00, 12:30–1:30, 2:30–3:00, 4:30–5:00, 5:30–6:00 (PDF tidak memberi nama acara, jadi popover menampilkan "Busy").
Tugas: Project Meeting 1,5 j · Team Training 1,5 j · Interview 1 j · Safety Training 30 m. Semua training setelah 1:00.
Kunci: Project Meeting **10:00–11:30**, Interview **1:30–2:30**, Team Training **3:00–4:30**, Safety Training **5:00–5:30**. ✅ Terverifikasi unik (Safety Training di 12:00 adalah jebakan).

### 2 · `shapepattern` — bintang segi lima (pentagram terbalik: 5 ujung + segi lima tengah)
Region: `TL, TR, R, B, L` (ujung) + `C` (segi lima).
Contoh: 1 {TL:G, TR:P, C:P} · 2 {L:G, TL:P} · 3 {B:G, L:P, C:P} · 4 {R:G, B:P}.
Kunci: **TR = hijau, R = ungu, C = ungu**, lainnya putih. ✅ (hijau berlawanan jarum jam; ungu satu ujung searah jarum jam dari hijau; tengah terisi-kosong-selang-seling).

### 3 · `pie` — Revenue
Urutan irisan (searah jarum jam dari jam 12): Europe, Africa, Asia-Pacific, Americas.
Kunci: **Europe 25%, Africa 45%, Asia-Pacific 20%, Americas 10%**. ✅ 450k; 360k; 180k; 810k; total 1,8 jt.
Jebakan: urutan hitung harus dimulai dari Europe (satu-satunya angka pasti); Americas bergantung pada Asia-Pacific.

### 4 · `monthcal` — Budget Review
Kunci: pilih tepat **{3, 27}**. ✅ Mulai review: 3, 9, 15, 21, 27; tanggal 9 satu-satunya Sabtu → Products ke-2; 16 di review ke-3 → Purchasing; Facilities ke-4; CS ke-1; Training ke-5.
Jebakan: soal memakai "any day of the week", jadi Sabtu–Minggu tetap hari kerja (berbeda dari instruksi awal "hari kerja = Senin–Jumat").

### 5 · `pie` — Profit per grade
Urutan irisan: Grade 2 (hijau, kanan atas), Grade 4 (oranye), Grade 3 (merah), Grade 1 (biru), sesuai warna kartu.
Kunci: **G1 30%, G2 25%, G3 35%, G4 10%**. ✅ Profit 36k/30k/42k/12k dari total 120k.
Jebakan: memakai pendapatan menghasilkan 28/25/31/16; Grade 2 kebetulan tetap 25% sehingga terasa benar.

### 6 · `roommatch`
Kunci: **Ian + Job Candidate → Ian's Office; Jasmine + Linda → Jasmine's Office; Ken → Meeting Room**; Linda's & Ken's Office kosong. ✅

### 7 · `shapepattern` — bintang segi enam (12 segitiga)
Region ujung: `pT, pUR, pLR, pB, pLL, pUL`; region dalam: `iT, iUR, iLR, iB, iLL, iUL`.
Susunan dalam A = {iT:G, iUR:P, iLR:G, iB:P, iLL:G, iUL:P}; B = kebalikan A. Gambar 1–4: A, B, A, B.
Ujung: 1 {pT:G, pB:P} · 2 {pLL:G, pUL:P} · 3 {pLR:G, pUR:P} · 4 {pT:G, pB:P}.
Kunci gambar 5: **susunan A + pLL hijau + pUL ungu**, ujung lain putih. ✅

### 8 · `pie` — Petrol stations
Urutan irisan: Station B (hijau), D (oranye), C (merah), A (biru).
Kunci: **A 21%, B 43%, C 7%, D 29%**. ✅ C = 7.700; A = 23.100; B = 47.300; D = 31.900.

### 9 · `dayschedule` — Presentation prep (2 jam, kamu + Jasmine)
Baris read-only: Helen, Ian, Jasmine (blok bisa diklik). Baris yang diisi: Your Calendar.
Kunci: **3:00–5:00**. ✅ Research Report selesai 12:30, Survey Summary (Ian) selesai 3:00; kosong bersama kamu–Jasmine 2:30–6:00.
Jebakan: jawaban hanya bisa ditemukan dengan membuka keterangan blok abu-abu.

### 10 · `shapepattern` — persegi (8 trapesium luar + 8 segitiga dalam)
Region luar: `oTL, oTR, oRT, oRB, oBR, oBL, oLB, oLT`; dalam: `i1…i8` (tidak pernah berwarna, tetap bisa diklik).
Contoh: 1 {oTL:G, oBL:P} · 2 {oLB:G, oLT:P} · 3 {oBR:G, oTR:P}.
Kunci: **oRT hijau, oRB ungu**. ✅ (hijau berputar 90° berlawanan jarum jam, ungu 90° searah).

### 11 · `stackedbar` — Project budgets (2 batang: Budget, Actual; awal 73 dan 50/50)
Kunci: Budget **73 | X 25% / Y 75%**, Actual **73 | X 40% / Y 60%**. ✅ x = 18,25; y = 54,75; realisasi 29,2 dan 43,8.

### 12 · `dayschedule` — Banquet Room D (1,5 jam, 50 tamu)
Baris read-only: Room A, B, C (blok berisi nama, jam, jumlah tamu). Baris yang diisi: Room D (Wedding Lunch 11:30–1:00).
Kunci: **2:00–3:30**. ✅ Setelah perubahan (Anniversary Party sampai 5:00; Retirement Party 65 tamu), cleaning 1 jam di Room D, kapasitas tamu lain ≤ 200: 9:00–10:30 gugur (10:00–10:30 = 210), semua slot yang menyentuh 3:30–5:00 gugur (205).
Jebakan: lupa menerapkan dua perubahan dulu.

### 13 · `stackedbar` — Survey (3 batang; awal 40/50/100, 50/50)
Kunci: Below average **40 | Y1 80% / Y2 20%**; Average **60 | 50% / 50%**; Above average **100 | 38% / 62%**. ✅ Below 32/8; Average 30/30; Above 38/62.
Jebakan: total Average harus diubah dari 50 ke 60.

### 14 · `rankbadges`
Kunci: **Isabel 1, Edward 2, Jasmine 3, George 4, Harry 5, Katarina 6**. ✅

### 15 · `shapepattern` — bintang segi enam (region sama dengan soal 7)
Pasangan: ujung atas–bawah; ujung kanan atas–kiri bawah; ujung kiri atas–kanan bawah; tengah atas–tengah bawah (`iT`, `iB`).
Contoh: 1 {pT,pB:G; pUR,pLL:G; iT,iB:P} · 2 {pUL,pLR:G; pUR,pLL:P} · 3 {pT,pB:G; iT,iB:G; pUL,pLR:P} · 4 {pUR,pLL:G; iT,iB:P}.
Kunci: **pT, pB hijau; pUL, pLR hijau; pUR, pLL ungu**; region lain putih. ✅

### 16 · `stackedbar` — Commuting (2 batang: Year 1, Year 2; awal 150/150, 50/50)
Kunci: Year 1 **225 | Private 84% / Public 16%**; Year 2 **230 | 82% / 18%**. ✅ Public Y1 = 41,4 / 1,15 = 36.

### 17 · `dayschedule` — Today (prosedur)
Blok: 9:00–9:30 Morning Equipment Check, 10:00–10:30 MRI – Outpatient, 12:30–1:30 Staff Lunch, 2:30–3:00 CT – Emergency Follow-up, 5:00–5:30 Scanner Maintenance.
Kunci: MRI #2 **11:00–11:30**, CT #2 **1:30–2:30**, MRI #1 **3:00–3:30**, CT #1 **4:00–5:00**. ✅ Unik dengan aturan "30 menit kosong setelah setiap MRI, termasuk MRI yang sudah ada".

### 18 · `linepoints`
Kunci: **GBP 0,80; EUR 0,90; CAD 1,30; AUD 1,30**. ✅

### 19 · `nodeline` — huruf+angka
Node: L8, M4, L5, M7, J7, N6, K6, K9. Garis tegas: K9–J7–L8. Petunjuk putus-putus: L8→K6.
Kunci garis yang harus digambar: **L8–K6, K6–M7, M7–L5, L5–N6, N6–M4**. ✅ Aturan selang-seling (huruf −1, angka −2) lalu (huruf +2, angka +1). (Catatan: teks hasil ekstraksi PDF terpotong di N6; gambar kunci menunjukkan N6→M4.)

### 20 · `nodeline` — kata 3 huruf
Node: FQD, REF, HSF, DEP, JUH, TGH, HIT, FGR. Garis tegas: DEP–FQD–REF. Petunjuk putus-putus: REF→FGR.
Kunci: **REF–FGR, FGR–HSF, HSF–TGH, TGH–HIT, HIT–JUH**. ✅ (huruf akhir baru = huruf pertama lama; huruf tengah baru = huruf akhir lama +1; huruf pertama baru = huruf tengah lama +1).

### Aturan penilaian
- Satu soal = 1 poin, benar hanya jika **semua bagian** benar (semua tugas di slot benar, semua irisan pas, dsb.).
- Pie/bar/line: nilai harus tepat sama setelah snap (1% / 1 unit / 0,05).
- Kalender bulanan: himpunan tanggal tepat sama.
- Garis node: himpunan garis buatan pengguna (tanpa arah) tepat sama dengan kunci; garis ekstra = salah.
- Pola bentuk: semua region sama dengan kunci (termasuk yang harus putih).
- Soal yang tidak disentuh dicatat "kosong" (dihitung salah, ditandai berbeda di hasil).

## 5. ⚠️ Ketidakcocokan dengan kunci PDF: perlu keputusanmu

**Contoh soal (practice) Naomi/Oscar/Petra.** Data di tabel keterangan (halaman 2–3) tidak cocok dengan kunci 12:30–1:30.

Dengan data tabel apa adanya:
- 12:30–1:30 **gagal**: Oscar punya *1:00–2:00 Client Demo*, dan client demo tidak boleh digeser.
- 3:00–4:00 **justru lolos**: Naomi menggeser Budget Workshop 1:30–3:30 ke 1:00–3:00, Petra menggeser Report Review 2:30–3:30 ke 2:00–3:00, Oscar kosong 3:00–4:00, dan kamu kosong 3:00–4:00 (karena slot Team Meeting lama ikut kosong).

Gambar pembahasan (halaman 3) ternyata memakai versi data lain: Oscar punya *Sales Pipeline Review* 1:00–2:00 (boleh digeser ke 1:30–2:30), dan Naomi punya **dua** acara terpisah 1:30–2:30 (*Budget Review*) dan 2:30–3:30 (*Supplier Meeting*). Karena hanya boleh menggeser satu acara per orang, opsi 3:00 gugur.

**Usulan saya:** sesuaikan keterangan acara dengan versi pembahasan, tanpa mengubah grid abu-abu sama sekali:
- Oscar: `1:00–2:00 Client Demo` → `1:00–2:00 Sales Pipeline Review`
- Naomi: `1:30–3:30 Budget Workshop` → `1:30–2:30 Budget Review` + `2:30–3:30 Supplier Meeting` (4:30–5:00 Supplier Call tetap)

Dengan perubahan ini 12:30–1:30 menjadi satu-satunya jawaban (sudah saya cek: kamu hanya kosong 1 jam penuh di 12:30–1:30 dan 3:00–4:00, dan 3:00–4:00 gugur karena Naomi). Pilihan lain: pakai data tabel apa adanya dan ganti kuncinya ke 3:00–4:00.

Untuk interaksi practice: pengguna cukup menaruh Team Meeting di Your Calendar; yang dinilai hanya jam Team Meeting. Pembahasan menampilkan acara mana yang digeser tiap orang (seperti gambar PDF).

**Hal kecil (sudah saya putuskan, beri tahu kalau mau diubah):**
- Soal 18: sumbu soal di PDF 0,70–1,30, sumbu pembahasan 0,7–1,4. Saya pakai 0,70–1,40 supaya titik 1,30 tidak menempel di tepi atas.
- Soal 1: PDF tidak memberi nama acara di blok abu-abu, jadi popover menampilkan "Busy".
- Soal 11 dan 13–16: total batang tetap bisa diubah walaupun nilai awal soal 11 sudah 73 (mengikuti perilaku tes asli; kalau total tidak bisa digeser, petunjuknya langsung terbaca).

## 6. Halaman hasil dan pembahasan

Per soal (kartu yang bisa dibuka-tutup, otomatis terbuka untuk soal yang salah):
- Status (Benar / Salah / Kosong) + waktu yang dipakai.
- **Visual berdampingan "Jawabanmu" vs "Jawaban benar"** memakai komponen yang sama dalam mode `readOnly` (kalender dengan blok berwarna, pie dengan persen, batang, pola bentuk berwarna, garis node, badge). Bagian yang salah diberi garis/penanda `warn`.
- Pembahasan berbahasa Indonesia, diadaptasi dari PDF (langkah hitung, tabel kecil bila PDF memakai tabel).
- Kotak **"Jebakan"** bila PDF menyebutnya: soal 1 (Safety Training juga training), 3 (mulai dari Europe), 4 ("any day of the week"), 5 (profit, bukan pendapatan), 9 (buka keterangan blok), 12 (terapkan dua perubahan dulu), 13 (total Average berubah), 17 (ruang molor MRI yang sudah ada).

## 7. Struktur data (di bagian atas `index.html`)

```js
const TEST = {
  title: "General Ability Test",
  timeLimitSec: 30 * 60,
  practice: { /* objek soal dengan graded:false */ },
  questions: [
    {
      id: 1,
      type: "dayschedule",
      title: "Monday schedule",
      prompt: "Fit each task into Monday's work schedule. All training sessions must be scheduled after 1:00 p.m.",
      data: {
        rows: [
          { label: "Monday", editable: true, events: [
            { start: "9:00", end: "10:00", name: "Busy" }, /* ... */ ] }
        ],
        tasks: [
          { id: "pm", label: "Project Meeting", mins: 90, color: "blue" },
          { id: "tt", label: "Team Training", mins: 90, color: "green" },
          { id: "iv", label: "Interview", mins: 60, color: "yellow" },
          { id: "st", label: "Safety Training", mins: 30, color: "cyan" }
        ]
      },
      answer: { pm: "10:00", tt: "3:00", iv: "1:30", st: "5:00" },
      explain: {
        steps: ["Team Training (1,5 jam, harus setelah jam 1) → …", "…"],
        trap: "Safety Training juga training, jadi wajib setelah jam 1. Slot 12:00–12:30 terlihat pas tapi salah."
      }
    },
    {
      id: 3, type: "pie",
      cards: [ { title: "Americas", text: "Half the revenue of Asia-Pacific", color: "blue" }, /* ... */ ],
      data: { slices: [ { id: "eu", label: "Europe", color: "green" }, { id: "af", label: "Africa", color: "orange" },
                        { id: "ap", label: "Asia-Pacific", color: "red" }, { id: "am", label: "Americas", color: "blue" } ] },
      answer: { eu: 25, af: 45, ap: 20, am: 10 },
      explain: { table: [/* … */], trap: "…" }
    },
    {
      id: 2, type: "shapepattern",
      data: { shape: "pentagram", examples: [ { TL: "g", TR: "p", C: "p" }, /* ... */ ] },
      answer: { TR: "g", R: "p", C: "p" }      // region yang tidak disebut = putih
    }
    // ... dst. sampai id 20
  ]
};

const SHAPES = { pentagram: { regions: { TL: "x,y x,y x,y", /* ... */ } }, hexagram: {/*…*/}, squareGrid: {/*…*/} };
```

Menambah soal = menambah objek ke `questions` (dan, untuk bentuk baru, satu entri di `SHAPES`). Komponen dipilih lewat `type`.

## 8. Rencana kerja setelah disetujui

1. Mesin tes (intro, practice, navigasi maju-saja, timer 30 menit / tanpa batas, pencatatan waktu per soal, hasil dasar) + 3 komponen pertama: `dayschedule`, `pie`, `shapepattern`. Uji di Chrome (desktop + lebar ponsel).
2. Enam komponen sisanya + semua 20 soal + halaman hasil lengkap dengan visual jawaban vs kunci, pembahasan, dan jebakan.
3. Uji setiap soal dengan jawaban benar dan salah (skrip uji di console yang mengisi kunci lewat API komponen, plus pengecekan manual drag), cek tampilan 360–390 px dan mode gelap, lalu `.vercelignore`.
