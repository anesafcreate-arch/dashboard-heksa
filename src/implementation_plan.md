# Frontend Plan â€” Dashboard Laboratorium Kalibrasi PT. Heksa Instrumen Sinergi

## Ringkasan

Membangun frontend dashboard untuk operasional laboratorium kalibrasi berstandar ISO/IEC 17025â€“2017. Aplikasi ini menggunakan **Role-Based Access Control (RBAC)** dengan 3 peran: **Administrasi**, **Teknisi**, dan **Direktur**. Fokus fase ini adalah arsitektur UI/UX, sistem navigasi, dan desain visual yang premium.

---

## User Review Required

> [!IMPORTANT]
> **Keputusan desain yang perlu disetujui:**
> 1. **Tech Stack**: Menggunakan **Vite + React** (SPA) â€” bukan Next.js karena ini aplikasi internal, bukan public-facing website yang butuh SSR/SEO.
> 2. **Styling**: Menggunakan **Vanilla CSS** dengan design tokens (CSS custom properties) untuk konsistensi.
> 3. **Routing**: Menggunakan **React Router v6** untuk navigasi halaman.
> 4. **State Management**: Menggunakan **React Context + useReducer** untuk auth/role state, cukup ringan untuk skala ini.
> 5. **Bahasa UI**: Interface dalam **Bahasa Indonesia** sesuai konteks operasional.

> [!WARNING]
> **Fase ini hanya frontend (UI/UX).** Backend, database, dan WebSocket belum diimplementasi. Data akan menggunakan **mock data** / dummy state agar semua halaman dan interaksi bisa di-demo-kan.

---

## 1. Design System & Visual Identity

### 1.1 Tema & Estetika

| Aspek | Pilihan |
|---|---|
| **Mode** | Dark mode utama (dengan opsi light mode nanti) |
| **Gaya** | Glassmorphism + subtle gradients |
| **Font** | Google Fonts â€” **Inter** (body), **Outfit** (heading) |
| **Border Radius** | 12pxâ€“16px (rounded modern) |
| **Animasi** | Micro-animations pada hover, transisi halaman (fade/slide), notifikasi |

### 1.2 Color Palette

```
--color-bg-primary:      #0f1117        /* Latar utama gelap */
--color-bg-secondary:    #1a1d2e        /* Card / sidebar background */
--color-bg-glass:        rgba(30, 34, 55, 0.6)  /* Glassmorphism panels */
--color-accent-primary:  #6366f1        /* Indigo â€” aksi utama */
--color-accent-secondary:#22d3ee       /* Cyan â€” highlight / badge */
--color-accent-success:  #10b981        /* Emerald â€” status sukses */
--color-accent-warning:  #f59e0b        /* Amber â€” peringatan */
--color-accent-danger:   #ef4444        /* Red â€” error / hapus */
--color-text-primary:    #f1f5f9        /* Teks utama */
--color-text-secondary:  #94a3b8        /* Teks sekunder */
--color-border:          rgba(148, 163, 184, 0.12)  /* Border halus */
```

### 1.3 Spacing & Layout Tokens

```
--space-xs:   4px
--space-sm:   8px
--space-md:   16px
--space-lg:   24px
--space-xl:   32px
--space-2xl:  48px
--sidebar-width: 260px
--header-height: 64px
```

---

## 2. Arsitektur Navigasi & Layout

### 2.1 Struktur Layout Utama

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    HEADER BAR                       â”‚
â”‚  [Logo]  PT. Heksa Instrumen Sinergi    [ðŸ””] [ðŸ‘¤]  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚          â”‚                                          â”‚
â”‚  SIDEBAR â”‚           MAIN CONTENT AREA              â”‚
â”‚          â”‚                                          â”‚
â”‚  [Menu]  â”‚   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  [Menu]  â”‚   â”‚         Page Content              â”‚   â”‚
â”‚  [Menu]  â”‚   â”‚                                   â”‚   â”‚
â”‚  [Menu]  â”‚   â”‚                                   â”‚   â”‚
â”‚          â”‚   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚          â”‚                                          â”‚
â”‚  [Logout]â”‚                                          â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                    FOOTER (minimal)                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 2.2 Menu Sidebar per Role

#### ðŸ”µ Administrasi (Full Access)
| Icon | Menu | Route | Keterangan |
|------|------|-------|------------|
| ðŸ“Š | Dashboard | `/dashboard` | Ringkasan statistik harian |
| ðŸ“¦ | Barang Masuk | `/barang-masuk` | Input & kelola alat masuk |
| ðŸšš | Barang Keluar | `/barang-keluar` | Toggle status pengambilan |
| ðŸ—„ï¸ | Summary Kalibrasi | `/summary-kalibrasi` | Master data alat & layanan |
| ðŸ“¥ | Ekspor CSV | (tombol di halaman) | Unduh rekapitulasi |

#### ðŸŸ¢ Teknisi (View-Only + Notifikasi)
| Icon | Menu | Route | Keterangan |
|------|------|-------|------------|
| ðŸ“Š | Dashboard | `/dashboard` | Ringkasan view-only |
| ðŸ“¦ | Barang Masuk | `/barang-masuk` | Tabel read-only |
| ðŸšš | Barang Keluar | `/barang-keluar` | Tabel read-only |
| ðŸ”” | Notifikasi | (header bell icon) | Audio alert real-time |

#### ðŸŸ¡ Direktur (Executive View-Only)
| Icon | Menu | Route | Keterangan |
|------|------|-------|------------|
| ðŸ“Š | Dashboard | `/dashboard` | Metrik eksekutif |
| ðŸ“¦ | Barang Masuk | `/barang-masuk` | Tabel read-only |
| ðŸšš | Barang Keluar | `/barang-keluar` | Tabel read-only |
| ðŸ—„ï¸ | Summary Kalibrasi | `/summary-kalibrasi` | View-only |

---

## 3. Desain Halaman (Page-by-Page)

### 3.1 Halaman Login (`/login`)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚          [Background: gradient blur]         â”‚
â”‚                                              â”‚
â”‚       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”            â”‚
â”‚       â”‚      ðŸ¢ LOGO            â”‚            â”‚
â”‚       â”‚  PT. Heksa Instrumen    â”‚            â”‚
â”‚       â”‚      Sinergi            â”‚            â”‚
â”‚       â”‚                         â”‚            â”‚
â”‚       â”‚  [ðŸ“§ Username         ] â”‚            â”‚
â”‚       â”‚  [ðŸ”’ Password         ] â”‚            â”‚
â”‚       â”‚  [Pilih Role â–¼        ] â”‚            â”‚
â”‚       â”‚                         â”‚            â”‚
â”‚       â”‚  [ ðŸš€ MASUK           ] â”‚            â”‚
â”‚       â”‚                         â”‚            â”‚
â”‚       â”‚  ISO/IEC 17025 â€“ 2017   â”‚            â”‚
â”‚       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜            â”‚
â”‚                                              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Detail desain:**
- Card login dengan efek glassmorphism (backdrop-blur, border transparan)
- Background gradient animasi lambat (shifting colors)
- Logo perusahaan di atas form
- Dropdown role: Administrasi / Teknisi / Direktur
- Tombol masuk dengan gradient dan hover glow effect
- Badge "ISO/IEC 17025 â€“ 2017" di bawah form

---

### 3.2 Halaman Dashboard (`/dashboard`)

**Untuk semua role â€” konten disesuaikan:**

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Selamat Datang, [Nama User] ðŸ‘‹                 â”‚
â”‚  [Tanggal hari ini]                              â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                  â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”â”‚
â”‚  â”‚ðŸ“¦ Masuk â”‚ â”‚ðŸšš Keluarâ”‚ â”‚â³ Prosesâ”‚ â”‚âœ… Ambil â”‚â”‚
â”‚  â”‚  Today  â”‚ â”‚  Today  â”‚ â”‚  Total  â”‚ â”‚  Total  â”‚â”‚
â”‚  â”‚   12    â”‚ â”‚    8    â”‚ â”‚   4     â”‚ â”‚   20    â”‚â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â”‚                                                  â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”â”‚
â”‚  â”‚  ðŸ“Š Grafik Harian    â”‚ â”‚  ðŸ“‹ Aktivitas       â”‚â”‚
â”‚  â”‚  (Bar chart volume   â”‚ â”‚  Terbaru            â”‚â”‚
â”‚  â”‚   kalibrasi 7 hari)  â”‚ â”‚  - Alat XX masuk    â”‚â”‚
â”‚  â”‚                      â”‚ â”‚  - Alat YY diambil  â”‚â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Komponen:**
- **Stat Cards** (4 buah) â€” angka besar dengan ikon, background gradient halus, animasi count-up
- **Bar Chart** â€” volume kalibrasi 7 hari terakhir (menggunakan **Chart.js** atau CSS-only bar chart)
- **Activity Feed** â€” daftar aktivitas terbaru dengan timestamp
- Semua card menggunakan glassmorphism effect

---

### 3.3 Halaman Barang Masuk (`/barang-masuk`)

**Untuk Admin â€” Full CRUD:**

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  ðŸ“¦ Barang Masuk                    [+ Tambah]   â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚
â”‚  [ðŸ” Cari barang...]           [Filter â–¼]       â”‚
â”‚                                                  â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”â”‚
â”‚  â”‚ No â”‚ Kode  â”‚ Nama    â”‚ Jenis    â”‚ File â”‚ Aksiâ”‚â”‚
â”‚  â”‚â”€â”€â”€â”€â”‚â”€â”€â”€â”€â”€â”€â”€â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚â”€â”€â”€â”€â”€â”€â”‚â”€â”€â”€â”€â”€â”‚â”‚
â”‚  â”‚ 1  â”‚ KB001 â”‚ Caliper â”‚ Dimensi  â”‚ ðŸ“Ž   â”‚ âœðŸ—‘â”‚â”‚
â”‚  â”‚ 2  â”‚ KB002 â”‚ Thermo  â”‚ Suhu     â”‚ ðŸ“Ž   â”‚ âœðŸ—‘â”‚â”‚
â”‚  â”‚ 3  â”‚ KB003 â”‚ Gauge   â”‚ Tekanan  â”‚ â€”    â”‚ âœðŸ—‘â”‚â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â”‚                                                  â”‚
â”‚  Menampilkan 1-10 dari 45     [< 1 2 3 4 5 >]   â”‚
â”‚                                [ðŸ“¥ Ekspor CSV]   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Fitur UI:**
- Tombol **"+ Tambah"** membuka **modal form** (bukan halaman baru)
- **Modal Form Input:**
  - Input: Kode Barang, Nama Barang
  - Dropdown: Jenis Layanan (Kalibrasi Dimensi, Suhu, Massa, Tekanan, dll.)
  - Upload file dengan drag-and-drop zone + validasi max 2MB
  - Progress bar saat upload
  - Tombol Simpan & Batal
- Tabel dengan **zebra striping**, hover highlight
- Ikon aksi: Edit (âœï¸) dan Hapus (ðŸ—‘ï¸) â€” hanya untuk Admin
- Pagination di bawah tabel
- Tombol **Ekspor CSV** di pojok kanan bawah tabel
- **Search bar** dengan debounce filtering
- Untuk **Teknisi & Direktur**: tabel sama tapi tanpa kolom Aksi dan tanpa tombol Tambah/Ekspor

---

### 3.4 Halaman Barang Keluar (`/barang-keluar`)

**Untuk Admin â€” dengan Toggle:**

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  ðŸšš Barang Keluar                                â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚
â”‚  [ðŸ” Cari barang...]           [Filter â–¼]       â”‚
â”‚                                                  â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”â”‚
â”‚  â”‚ No â”‚ Kode  â”‚ Nama    â”‚ Jenis   â”‚ Sudah Diambilâ”‚
â”‚  â”‚â”€â”€â”€â”€â”‚â”€â”€â”€â”€â”€â”€â”€â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
â”‚  â”‚ 1  â”‚ KB001 â”‚ Caliper â”‚ Dimensi â”‚  ðŸ”´ Tidak    â”‚  â† Klik toggle
â”‚  â”‚ 2  â”‚ KB002 â”‚ Thermo  â”‚ Suhu    â”‚  ðŸŸ¢ Ya       â”‚
â”‚  â”‚ 3  â”‚ KB003 â”‚ Gauge   â”‚ Tekanan â”‚  ðŸ”´ Tidak    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â”‚                                                  â”‚
â”‚  Menampilkan 1-10 dari 45     [< 1 2 3 4 5 >]   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Fitur UI:**
- Data **auto-populated** dari Barang Masuk (sinkronisasi otomatis)
- Kolom "Sudah Diambil" menggunakan **toggle switch** yang beranimasi:
  - ðŸ”´ **Tidak** â€” merah, posisi kiri
  - ðŸŸ¢ **Ya** â€” hijau, posisi kanan
  - Animasi slide smooth saat toggle
- Hanya **Admin** yang bisa mengklik toggle
- **Teknisi & Direktur** melihat status sebagai badge read-only (tanpa interaksi)
- Konfirmasi dialog sebelum mengubah status

---

### 3.5 Halaman Summary Kalibrasi (`/summary-kalibrasi`)

**Untuk Admin â€” Full CRUD:**

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  ðŸ—„ï¸ Summary Kalibrasi               [+ Tambah] â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚
â”‚  [ðŸ” Cari...]                                    â”‚
â”‚                                                  â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”â”‚
â”‚  â”‚ No â”‚ Kode Alat â”‚ Nama Alat  â”‚ Kategori â”‚ Aksiâ”‚â”‚
â”‚  â”‚â”€â”€â”€â”€â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚â”€â”€â”€â”€â”€â”‚â”‚
â”‚  â”‚ 1  â”‚ ALT-001   â”‚ Caliper    â”‚ Dimensi  â”‚ âœðŸ—‘â”‚â”‚
â”‚  â”‚ 2  â”‚ ALT-002   â”‚ Thermometerâ”‚ Suhu     â”‚ âœðŸ—‘â”‚â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â”‚                                                  â”‚
â”‚  Menampilkan 1-10 dari 30     [< 1 2 3 >]       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Fitur UI:**
- Master data alat ukur dan jenis layanan kalibrasi
- CRUD lengkap untuk Admin
- View-only untuk Direktur
- Teknisi **tidak** memiliki akses ke halaman ini

---

### 3.6 Sistem Notifikasi (Lonceng di Header)

```
Header:
... [ðŸ”” 3] [ðŸ‘¤ Teknisi A â–¼]

Klik ðŸ”” â†’ Dropdown:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  ðŸ”” Notifikasi                â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚
â”‚  ðŸ†• Caliper Digital baru     â”‚
â”‚     masuk â€” 2 menit lalu      â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚
â”‚  ðŸ†• Thermometer IR baru      â”‚
â”‚     masuk â€” 15 menit lalu     â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚
â”‚  ðŸ“¦ Gauge Tekanan baru       â”‚
â”‚     masuk â€” 1 jam lalu        â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚
â”‚  [Tandai Semua Dibaca]        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Fitur UI:**
- Badge merah dengan counter notifikasi belum dibaca
- Dropdown panel dengan daftar notifikasi
- Animasi bounce/shake pada ikon lonceng saat notifikasi baru masuk
- **Audio alert** â€” suara lonceng diputar saat data baru masuk (untuk Teknisi)
- Notifikasi baru punya highlight/glow effect
- Tombol "Tandai Semua Dibaca"

---

## 4. Komponen Reusable

### Daftar Komponen yang Akan Dibuat

| Komponen | Deskripsi |
|---|---|
| `<AppLayout>` | Shell utama: Header + Sidebar + Content area |
| `<Sidebar>` | Menu navigasi responsif, collapsible di mobile |
| `<Header>` | Top bar: logo, notifikasi, profil user |
| `<StatCard>` | Kartu statistik dengan ikon, angka, label |
| `<DataTable>` | Tabel data dengan sort, search, pagination |
| `<Modal>` | Dialog overlay untuk form input/konfirmasi |
| `<FormInput>` | Input field dengan label, validasi, error state |
| `<FileUpload>` | Drag-and-drop upload dengan validasi 2MB |
| `<ToggleSwitch>` | Switch Ya/Tidak beranimasi |
| `<NotificationBell>` | Ikon lonceng + dropdown + audio alert |
| `<Badge>` | Status badge berwarna |
| `<Pagination>` | Navigasi halaman tabel |
| `<SearchBar>` | Input pencarian dengan debounce |
| `<ConfirmDialog>` | Dialog konfirmasi aksi (hapus, ubah status) |
| `<RoleGuard>` | Wrapper untuk membatasi akses berdasarkan role |
| `<ActivityFeed>` | Daftar aktivitas terbaru |

---

## 5. Struktur File Proyek

```
dashboad-inputbarang/
â”œâ”€â”€ index.html
â”œâ”€â”€ package.json
â”œâ”€â”€ vite.config.js
â”œâ”€â”€ public/
â”‚   â”œâ”€â”€ favicon.ico
â”‚   â””â”€â”€ sounds/
â”‚       â””â”€â”€ notification.mp3          â† Suara lonceng
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ main.jsx                      â† Entry point
â”‚   â”œâ”€â”€ App.jsx                       â† Router + AuthProvider
â”‚   â”œâ”€â”€ index.css                     â† Design tokens + global styles
â”‚   â”‚
â”‚   â”œâ”€â”€ assets/
â”‚   â”‚   â””â”€â”€ logo.png                  â† Logo perusahaan
â”‚   â”‚
â”‚   â”œâ”€â”€ context/
â”‚   â”‚   â”œâ”€â”€ AuthContext.jsx           â† Login state + role
â”‚   â”‚   â””â”€â”€ NotificationContext.jsx   â† Notifikasi state
â”‚   â”‚
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ layout/
â”‚   â”‚   â”‚   â”œâ”€â”€ AppLayout.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ AppLayout.css
â”‚   â”‚   â”‚   â”œâ”€â”€ Sidebar.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ Sidebar.css
â”‚   â”‚   â”‚   â”œâ”€â”€ Header.jsx
â”‚   â”‚   â”‚   â””â”€â”€ Header.css
â”‚   â”‚   â”œâ”€â”€ ui/
â”‚   â”‚   â”‚   â”œâ”€â”€ StatCard.jsx / .css
â”‚   â”‚   â”‚   â”œâ”€â”€ DataTable.jsx / .css
â”‚   â”‚   â”‚   â”œâ”€â”€ Modal.jsx / .css
â”‚   â”‚   â”‚   â”œâ”€â”€ FormInput.jsx / .css
â”‚   â”‚   â”‚   â”œâ”€â”€ FileUpload.jsx / .css
â”‚   â”‚   â”‚   â”œâ”€â”€ ToggleSwitch.jsx / .css
â”‚   â”‚   â”‚   â”œâ”€â”€ Badge.jsx / .css
â”‚   â”‚   â”‚   â”œâ”€â”€ Pagination.jsx / .css
â”‚   â”‚   â”‚   â”œâ”€â”€ SearchBar.jsx / .css
â”‚   â”‚   â”‚   â”œâ”€â”€ ConfirmDialog.jsx / .css
â”‚   â”‚   â”‚   â””â”€â”€ NotificationBell.jsx / .css
â”‚   â”‚   â””â”€â”€ guards/
â”‚   â”‚       â””â”€â”€ RoleGuard.jsx
â”‚   â”‚
â”‚   â”œâ”€â”€ pages/
â”‚   â”‚   â”œâ”€â”€ LoginPage.jsx / .css
â”‚   â”‚   â”œâ”€â”€ DashboardPage.jsx / .css
â”‚   â”‚   â”œâ”€â”€ BarangMasukPage.jsx / .css
â”‚   â”‚   â”œâ”€â”€ BarangKeluarPage.jsx / .css
â”‚   â”‚   â””â”€â”€ SummaryKalibrasiPage.jsx / .css
â”‚   â”‚
â”‚   â”œâ”€â”€ hooks/
â”‚   â”‚   â”œâ”€â”€ useAuth.js
â”‚   â”‚   â””â”€â”€ useNotification.js
â”‚   â”‚
â”‚   â””â”€â”€ data/
â”‚       â””â”€â”€ mockData.js               â† Dummy data untuk demo
```

---

## 6. Responsive Design Strategy

| Breakpoint | Perilaku |
|---|---|
| **â‰¥1200px** (Desktop) | Sidebar terbuka penuh, tabel multi-kolom |
| **768pxâ€“1199px** (Tablet) | Sidebar collapsed (ikon saja), tabel scroll horizontal |
| **<768px** (Mobile) | Sidebar tersembunyi (hamburger menu), stat cards stack vertikal, tabel card-view |

---

## 7. Animasi & Interaksi

| Elemen | Animasi |
|---|---|
| **Page transition** | Fade-in 300ms |
| **Stat cards** | Count-up number animation saat halaman load |
| **Sidebar menu** | Hover: slide-right indicator bar |
| **Modal** | Scale-up + backdrop fade-in |
| **Toggle switch** | Spring-like slide 200ms |
| **Notification bell** | Shake/bounce saat notif baru |
| **Table rows** | Fade-in stagger saat data load |
| **Buttons** | Subtle scale + glow on hover |
| **Cards** | Lift shadow on hover |

---

## Open Questions â€” âœ… RESOLVED

1. âœ… **Logo**: Sudah di-upload oleh user (dark blue with white text)
2. âœ… **Warna brand**: Biru (sesuai logo) + font putih
3. âœ… **Jenis Layanan**: Weight and Balance, Dimensional, Pressure, Force, Electrical, Temperature, Analytical Instrument, Volumetric, Other Calibration
4. âœ… **Chart.js**: Disetujui
5. âœ… **Bahasa**: Full Bahasa Indonesia

---

## Verification Plan

### Automated Tests
- Menjalankan `npm run dev` dan memastikan semua halaman ter-render tanpa error
- Browser testing: mengunjungi setiap route dan memverifikasi tampilan visual
- Testing responsive di berbagai ukuran viewport (desktop, tablet, mobile)

### Manual Verification
- Screenshot setiap halaman untuk review visual
- Testing alur login â†’ dashboard â†’ navigasi semua menu
- Testing modal form input barang
- Testing toggle switch di halaman Barang Keluar
- Testing animasi notifikasi dan suara lonceng
- Testing role switching â€” memastikan menu yang tampil sesuai role

