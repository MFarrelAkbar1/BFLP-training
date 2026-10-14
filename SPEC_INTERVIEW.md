# SPEC: Smart Interview On Demand (`interview.html`)

Sumber: `5_Smart Interview On Demand.pdf` (14 halaman, dibaca semua; teks diekstrak lalu dicocokkan dengan render halaman 2 dan 14, tidak ada isi yang hanya berupa gambar. Gambar di PDF hanya latar, logo, dan ikon sosial media).

## 0. Temuan penting (perlu keputusan)

1. **PDF hanya berisi 10 pertanyaan, bukan 17.** Halaman 1 menyebut "17 pertanyaan berlapis", tapi isinya berhenti di H10 pada halaman 14 (nomor halaman 14 adalah halaman terakhir). Pertanyaan ke-11 sampai ke-17 tidak ada di file ini.
2. **Kode loncat: A1–A8 lalu H9, H10.** Tidak ada B–G. Bisa jadi salah ketik (A9, A10) atau memang kelompok lain. Saya akan menyalin kode apa adanya.
3. **Kelompok tidak disebut per pertanyaan.** Halaman 1 bilang pertanyaan "mengadaptasi delapan kelompok" UCF, tapi tidak ada pertanyaan yang diberi label kelompok UCF. Satu-satunya pengelompokan yang ada di PDF: huruf kode (A / H) dan label "REAL TEST" (A1, A2). Memetakan ke 8 kelompok UCF sendiri = mengarang, jadi tidak saya lakukan tanpa persetujuan.
4. **Kelengkapan field tidak merata.** Hanya A1 yang punya bedah pertanyaan, 2 contoh jawaban, contoh kurang efektif, dan variasi latihan. A1 tidak punya versi situasional; A2–H10 punya.
5. **Web Speech API di Chrome mengirim audio ke server Google** untuk dikenali. Ini bertentangan dengan janji "rekaman hanya di browser". Usul: transkrip otomatis jadi opsi yang harus diaktifkan sendiri (default mati), dengan penjelasan di layar awal. File rekaman (blob) tetap tidak pernah diunggah.
6. **Hak cipta.** Teks PDF (bertanda @lolosrekrutmen / @aisyahnh076) akan ikut terpublikasi di `interview.html` di Vercel, padahal `.vercelignore` sengaja menyembunyikan PDF-nya. Mohon konfirmasi kamu berhak memublikasikan isinya.

## 1. Daftar pertanyaan hasil ekstraksi

| Kode | Hal. | Judul | Label | Bedah | Contoh | Kurang efektif | Variasi | Situasional |
|---|---|---|---|---|---|---|---|---|
| A1 | 2–5 | Menyampaikan hal yang benar meskipun tidak disukai (pertanyaan dari peserta) | REAL TEST | ya (4 bagian + catatan) | 2 | ya (4 alasan) | 5 | – |
| A2 | 5–6 | Inisiatif: memperbaiki sesuatu tanpa diminta | REAL TEST | – | 1 | – | – | ya |
| A3 | 6–7 | Memimpin kelompok yang kurang aktif | – | – | 1 | – | – | ya |
| A4 | 8–9 | Bekerja dengan orang yang cara kerjanya berbeda | – | – | 1 | – | – | ya |
| A5 | 9–10 | Mendekati pihak yang belum dikenal | – | – | 1 | – | – | ya |
| A6 | 10–11 | Meyakinkan orang lain untuk berubah | – | – | 1 | – | – | ya |
| A7 | 11–12 | Menjelaskan hal rumit kepada orang awam | – | – | 1 | – | – | ya |
| A8 | 12–13 | Menelusuri akar masalah | – | – | 1 | – | – | ya |
| H9 | 13–14 | Menguasai hal baru dalam waktu singkat | – | – | 1 | – | – | ya |
| H10 | 14 | Mengusulkan cara baru | – | – | 1 | – | – | ya |

Teks pertanyaan (verbatim):

- **A1** Pernahkah Anda menyampaikan sesuatu yang menurut Anda benar atau sesuai dengan aturan, prinsip, atau norma yang berlaku, meskipun tidak disukai oleh teman-teman Anda? Apa yang akan Anda sampaikan dan mengapa hal tersebut tidak disukai? Bagaimana hasilnya?
- **A2** Ceritakan saat Anda melihat ada hal yang perlu diperbaiki, lalu Anda bertindak tanpa menunggu diminta. Apa yang Anda lihat, apa yang Anda lakukan, dan apa dampaknya?
- **A3** Pernahkah Anda memimpin kelompok yang anggotanya kurang aktif? Apa yang Anda lakukan untuk menggerakkan mereka, dan bagaimana hasilnya?
- **A4** Ceritakan saat Anda harus bekerja sama dengan orang yang cara kerjanya sangat berbeda dengan Anda. Apa tantangannya, bagaimana Anda menyesuaikan diri, dan apa hasilnya?
- **A5** Pernahkah Anda harus meminta bantuan dari orang atau instansi yang belum Anda kenal? Bagaimana Anda mendekatinya, dan apa hasilnya?
- **A6** Ceritakan saat Anda berhasil meyakinkan orang lain untuk mengubah keputusan atau cara kerjanya. Bagaimana caranya, dan apa yang terjadi setelahnya?
- **A7** Pernahkah Anda harus menjelaskan hal yang rumit kepada orang yang awam? Bagaimana Anda membuatnya mudah dipahami, dan bagaimana Anda tahu mereka sudah paham?
- **A8** Ceritakan masalah yang penyebabnya tidak langsung terlihat. Bagaimana Anda menelusuri akar masalahnya, dan apa solusinya?
- **H9** Ceritakan saat Anda harus menguasai hal baru dalam waktu singkat. Apa yang Anda lakukan supaya cepat paham, dan bagaimana hasilnya?
- **H10** Pernahkah Anda mengusulkan cara baru yang lebih baik dari cara lama? Apa idenya, bagaimana Anda mengujinya, dan apakah ide itu dipakai?

Juga dari halaman 1 (untuk layar awal): bagian "Cara membaca setiap pertanyaan" dan catatan "Contoh jawaban bukan jawaban mutlak".

Bagian yang tidak terbaca: **tidak ada**.

## 2. Struktur data

Satu objek di atas `<script>`. Semua teks disalin verbatim; tanda kutip pembuka/penutup contoh jawaban ikut dibuang hanya di tampilan (data menyimpan teks di dalamnya).

```js
const SI = {
  sumber: "Smart Interview On Demand · Kumpulan Pertanyaan dan Contoh Jawaban",
  caraMembaca: [ { label: "YANG INGIN DIGALI", teks: "Hal yang kemungkinan dicari penilai lewat pertanyaan itu." }, ... ],
  catatanContoh: "Contoh di bab ini memakai tokoh dan pengalaman rekaan ...",
  pertanyaan: [
    {
      kode: "A1",
      judul: "Menyampaikan hal yang benar meskipun tidak disukai (pertanyaan dari peserta)",
      realTest: true,                       // label "PERTANYAAN (REAL TEST)"
      pertanyaan: "Pernahkah Anda ...",
      yangDigali: "Integritas, yaitu ...",
      bedahPertanyaan: [                    // null jika tidak ada
        { bagian: "\"Pernahkah Anda menyampaikan sesuatu yang benar atau sesuai aturan...\"",
          yangPerluDijawab: "Situasi singkat, serta aturan atau prinsip yang kamu pegang", porsi: 20 }, ...
      ],
      catatanBedah: "Kata \"akan\" di bagian kedua ...",   // null jika tidak ada
      strategi: ["Pilih aturan atau prinsip ...", ...],
      kerangkaJawaban: ["Situasi: di mana, kapan, dan aturan atau prinsip apa yang dipertaruhkan.", ...],
      contohJawaban: [ { profil: "Fresh graduate, bendahara kepanitiaan", teks: "Pernah. Waktu itu ..." }, ... ],
      contohKurangEfektif: "Pernah. Saya orangnya ...",     // null jika tidak ada
      kenapaKurangEfektif: ["Kandidat langsung melapor ...", ...],
      hindari: ["Pelanggaran yang terlalu sepele ...", ...],
      variasiLatihan: ["Pernahkah Anda menolak ajakan ...", ...],   // [] jika tidak ada
      versiSituasional: null                // string jika ada
    }, ...
  ]
};
```

Penyimpanan lokal (semua lewat `try/catch`, halaman tetap jalan kalau diblokir):
- `si-draft-<kode>`: teks draft jawaban.
- `si-history`: array `{ t: ISO tanggal, kode, varian: "utama"|"situasional"|"variasi-n", mode: "latihan"|"simulasi", durasiDtk, kata|null, checklist: [true,false,...] }`, maksimal 200 entri.
- `si-settings`: `{ berpikirDtk: 30, rekamDtk: 120, transkrip: false, nSimulasi: 5 }`.
- `gat-theme`: tema (dipakai bersama menu dan gat.html).

Rekaman audio hanya disimpan sebagai blob URL di memori selama halaman terbuka; tidak disimpan ke localStorage dan tidak diunggah.

## 3. Alur layar

**Bar atas** (gaya gat.html): `← Menu` · "Smart Interview · Latihan BFLP" · penghitung/timer saat sesi · tombol tema. Konfirmasi `beforeunload` saat sedang berpikir/merekam/simulasi berjalan.

**L0 Beranda**
- Penjelasan singkat + "Cara membaca setiap pertanyaan" + catatan "contoh bukan jawaban mutlak, jangan mengarang pengalaman".
- Kotak privasi: rekaman tetap di browser, tidak diunggah, hilang saat halaman ditutup; transkrip otomatis opsional (audio dikirim ke layanan pengenalan suara browser).
- Cek mikrofon (pola svar.html: `getUserMedia`, meter level, rekam 3 detik + putar ulang).
- Pengaturan: waktu berpikir (default 30 dtk), batas rekam (default 120 dtk), transkrip otomatis (default mati).
- Tiga kartu mode: **Latihan per pertanyaan**, **Simulasi**, **Mode belajar**. Plus tautan **Riwayat**.

**L1 Daftar pertanyaan** (latihan & belajar)
- Filter: Semua · Real test · per huruf kode (A / H) · Punya versi situasional. (Menunggu keputusan poin 0.3.)
- Kartu: kode, judul, ikon status (sudah pernah dilatih / ada draft).

**L2 Satu pertanyaan (latihan)**
1. *Pertanyaan*: kode, judul, label, teks pertanyaan. Tombol "Mulai". (Strategi tersembunyi.)
2. *Berpikir*: hitung mundur 30 dtk, tombol "Lewati". Boleh mencoret di kotak catatan sementara.
3. *Beep* (oscillator, pola svar.html) → *Rekam*: timer naik + sisa waktu, meter level, tombol "Selesai". Berhenti otomatis di batas. Untuk A1, bilah waktu diberi penanda porsi dari bedah pertanyaan (20/35/15/30%).
4. *Hasil rekaman*: pemutar audio; metrik yang benar-benar terukur:
   - durasi (selalu),
   - jika transkrip aktif dan didukung: transkrip, jumlah kata, tempo kata/menit, jumlah filler (`eh, um, uh, anu, kayak, like, you know`), diberi catatan bahwa pengenalan suara bisa meleset;
   - jika tidak didukung/mati: kolom tempel/ketik transkrip manual, metrik kata dihitung dari situ; kalau kosong, ditampilkan "tidak tersedia".
5. *Self-review*: checklist = `kerangkaJawaban` ("Jawabanku sudah mencakup ..."), plus "Menjawab semua bagian pertanyaan". Disimpan ke riwayat.
6. *Pembahasan* (baru terbuka setelah self-review): yang ingin digali, bedah pertanyaan, strategi, kerangka, contoh jawaban, contoh kurang efektif + alasannya, hindari, variasi latihan.
7. *Lanjutan*: "Draft jawabanku" (pengingat: pakai pengalaman nyata), "Rekam ulang", "Latih versi situasional" (jika ada), "Latih variasi" (A1), "Kembali ke daftar".

Versi situasional / variasi memakai alur L2 yang sama dengan teks pertanyaan pengganti; checklist tetap dari kerangka induknya, diberi catatan bahwa kerangkanya disesuaikan ("apa yang akan Anda lakukan").

**L3 Simulasi**
- Pilih N (default 5, maksimal 10), urutan acak tanpa ulang. Tidak bisa kembali ke pertanyaan sebelumnya (seperti tes asli).
- Tiap pertanyaan: berpikir → beep → rekam → langsung pertanyaan berikutnya (tanpa pembahasan).
- Ringkasan: per pertanyaan ada pemutar rekaman, durasi, metrik, checklist self-review, lalu tombol buka pembahasan. Semua tersimpan ke riwayat setelah checklist diisi.

**L4 Mode belajar**
- Daftar yang sama; membuka semua bagian pembahasan langsung, tanpa rekam. Ada kolom draft jawaban.

**L5 Riwayat**
- Tabel: tanggal, kode + judul, varian, mode, durasi, checklist (x/y). Tombol hapus riwayat (dengan konfirmasi).

**Footer**: "Simulasi latihan mandiri untuk persiapan tes. Tidak berafiliasi dengan, disponsori, atau didukung oleh SHL."

## 4. Teknis

- Satu file, HTML + CSS + JS vanilla, helper `h()`/`sv()` dan token warna dari gat.html, responsif sampai 375 px.
- Dari svar.html: pola `getUserMedia` + `MediaRecorder` (pilih mimeType yang didukung), `AudioContext` untuk meter level dan beep, `SpeechRecognition` (`lang: "id-ID"`, `continuous`, `interimResults`, mulai ulang otomatis saat `onend` selama masih merekam, daftar error fatal).
- Tidak ada skor "AI". Satu-satunya penilaian isi = checklist yang dicentang sendiri.
- Kartu menu di `index.html` saat ini menulis "17 pertanyaan"; akan disesuaikan dengan jumlah data sebenarnya.

## 5. Pertanyaan untukmu

1. Apakah ada file lanjutan berisi pertanyaan 11–17? Kalau tidak, situs memakai 10 pertanyaan dan menu menulis "10 pertanyaan".
2. Kode A1–A8, H9, H10: salin apa adanya, atau seharusnya A9, A10?
3. Filter "per kelompok": cukup pakai yang ada di PDF (Real test / huruf kode / punya versi situasional)?
4. Transkrip otomatis opsional dan default mati (karena audio dikirim ke layanan Google), setuju?
5. Kamu berhak memublikasikan teks PDF ini di situs?
