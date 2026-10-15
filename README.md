# Latihan Rekrutmen BFLP

Situs latihan mandiri gaya SHL, tanpa build step. Buka `index.html` (menu), atau deploy folder ini ke Vercel.

| Halaman | Isi |
|---|---|
| `index.html` | Menu 4 section |
| `gat.html` | General Ability Test (20 soal, 30 menit). Pilihan "Soal Asli" atau "Soal Baru" (dibuat generator dari seed; lihat `SPEC_GENERATOR.md`, uji dengan `node tools/gen-check.mjs`) |
| `interview.html` | Smart Interview On Demand (10 pertanyaan, rekam jawaban) |
| `jfa.html` | Job-Focused Assessment (42 soal, 15 menit) |
| `svar.html` | SVAR Spoken English (38 soal, ±15 menit) |

## Hanya untuk latihan pribadi

Isi `interview.html` (pertanyaan, strategi, contoh jawaban) disalin dari materi *Smart Interview On Demand* oleh @lolosrekrutmen. **Jangan publikasikan situs ini secara terbuka.** Kalau dideploy, pakai deployment privat (misalnya Vercel dengan Deployment Protection / password) dan jangan bagikan tautannya ke publik.

Situs ini tidak berafiliasi dengan, disponsori, atau didukung oleh SHL.

## Catatan teknis

- Rekaman di `interview.html` hanya disimpan di browser (blob URL) dan tidak diunggah. Transkrip otomatis (Web Speech API) mati secara bawaan; bila dinyalakan, browser mengirim audio ke server Google.
- Mikrofon butuh `https` atau `localhost`. Untuk uji lokal: `python -m http.server` lalu buka `http://localhost:8000`.
- `.vercelignore` mengecualikan PDF sumber, `SPEC*.md`, dan README ini dari deploy.
