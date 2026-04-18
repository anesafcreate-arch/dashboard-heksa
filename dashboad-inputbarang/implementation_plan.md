# Frontend Plan — Dashboard Laboratorium Kalibrasi PT. Heksa Instrumen Sinergi

## Ringkasan

Membangun frontend dashboard untuk operasional laboratorium kalibrasi berstandar ISO/IEC 17025–2017. Aplikasi ini menggunakan **Role-Based Access Control (RBAC)** dengan 3 peran: **Administrasi**, **Teknisi**, dan **Direktur**. Fokus fase ini adalah arsitektur UI/UX, sistem navigasi, dan desain visual yang premium.

---

## User Review Required

> [!IMPORTANT]
> **Keputusan desain yang perlu disetujui:**
> 1. **Tech Stack**: Menggunakan **Vite + React** (SPA) — bukan Next.js karena ini aplikasi internal, bukan public-facing website yang butuh SSR/SEO.
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
| **Font** | Google Fonts — **Inter** (body), **Outfit** (heading) |
| **Border Radius** | 12px–16px (rounded modern) |
| **Animasi** | Micro-animations pada hover, transisi halaman (fade/slide), notifikasi |

### 1.2 Color Palette

```
--color-bg-primary:      #0f1117        /* Latar utama gelap */
--color-bg-secondary:    #1a1d2e        /* Card / sidebar background */
--color-bg-glass:        rgba(30, 34, 55, 0.6)  /* Glassmorphism panels */
--color-accent-primary:  #6366f1        /* Indigo — aksi utama */
--color-accent-secondary:#22d3ee       /* Cyan — highlight / badge */
--color-accent-success:  #10b981        /* Emerald — status sukses */
--color-accent-warning:  #f59e0b        /* Amber — peringatan */
--color-accent-danger:   #ef4444        /* Red — error / hapus */
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
┌─────────────────────────────────────────────────────┐
│                    HEADER BAR                       │
│  [Logo]  PT. Heksa Instrumen Sinergi    [🔔] [👤]  │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│  SIDEBAR │           MAIN CONTENT AREA              │
│          │                                          │
│  [Menu]  │   ┌──────────────────────────────────┐   │
│  [Menu]  │   │         Page Content              │   │
│  [Menu]  │   │                                   │   │
│  [Menu]  │   │                                   │   │
│          │   └──────────────────────────────────┘   │
│          │                                          │
│  [Logout]│                                          │
├──────────┴──────────────────────────────────────────┤
│                    FOOTER (minimal)                 │
└─────────────────────────────────────────────────────┘
```

### 2.2 Menu Sidebar per Role

#### 🔵 Administrasi (Full Access)
| Icon | Menu | Route | Keterangan |
|------|------|-------|------------|
| 📊 | Dashboard | `/dashboard` | Ringkasan statistik harian |
| 📦 | Barang Masuk | `/barang-masuk` | Input & kelola alat masuk |
| 🚚 | Barang Keluar | `/barang-keluar` | Toggle status pengambilan |
| 🗄️ | Database Kalibrasi | `/database` | Master data alat & layanan |
| 📥 | Ekspor CSV | (tombol di halaman) | Unduh rekapitulasi |

#### 🟢 Teknisi (View-Only + Notifikasi)
| Icon | Menu | Route | Keterangan |
|------|------|-------|------------|
| 📊 | Dashboard | `/dashboard` | Ringkasan view-only |
| 📦 | Barang Masuk | `/barang-masuk` | Tabel read-only |
| 🚚 | Barang Keluar | `/barang-keluar` | Tabel read-only |
| 🔔 | Notifikasi | (header bell icon) | Audio alert real-time |

#### 🟡 Direktur (Executive View-Only)
| Icon | Menu | Route | Keterangan |
|------|------|-------|------------|
| 📊 | Dashboard | `/dashboard` | Metrik eksekutif |
| 📦 | Barang Masuk | `/barang-masuk` | Tabel read-only |
| 🚚 | Barang Keluar | `/barang-keluar` | Tabel read-only |
| 🗄️ | Database Kalibrasi | `/database` | View-only |

---

## 3. Desain Halaman (Page-by-Page)

### 3.1 Halaman Login (`/login`)

```
┌──────────────────────────────────────────────┐
│          [Background: gradient blur]         │
│                                              │
│       ┌─────────────────────────┐            │
│       │      🏢 LOGO            │            │
│       │  PT. Heksa Instrumen    │            │
│       │      Sinergi            │            │
│       │                         │            │
│       │  [📧 Username         ] │            │
│       │  [🔒 Password         ] │            │
│       │  [Pilih Role ▼        ] │            │
│       │                         │            │
│       │  [ 🚀 MASUK           ] │            │
│       │                         │            │
│       │  ISO/IEC 17025 – 2017   │            │
│       └─────────────────────────┘            │
│                                              │
└──────────────────────────────────────────────┘
```

**Detail desain:**
- Card login dengan efek glassmorphism (backdrop-blur, border transparan)
- Background gradient animasi lambat (shifting colors)
- Logo perusahaan di atas form
- Dropdown role: Administrasi / Teknisi / Direktur
- Tombol masuk dengan gradient dan hover glow effect
- Badge "ISO/IEC 17025 – 2017" di bawah form

---

### 3.2 Halaman Dashboard (`/dashboard`)

**Untuk semua role — konten disesuaikan:**

```
┌──────────────────────────────────────────────────┐
│  Selamat Datang, [Nama User] 👋                 │
│  [Tanggal hari ini]                              │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │📦 Masuk │ │🚚 Keluar│ │⏳ Proses│ │✅ Ambil ││
│  │  Today  │ │  Today  │ │  Total  │ │  Total  ││
│  │   12    │ │    8    │ │   4     │ │   20    ││
│  └─────────┘ └─────────┘ └─────────┘ └────────┘│
│                                                  │
│  ┌──────────────────────┐ ┌─────────────────────┐│
│  │  📊 Grafik Harian    │ │  📋 Aktivitas       ││
│  │  (Bar chart volume   │ │  Terbaru            ││
│  │   kalibrasi 7 hari)  │ │  - Alat XX masuk    ││
│  │                      │ │  - Alat YY diambil  ││
│  └──────────────────────┘ └─────────────────────┘│
└──────────────────────────────────────────────────┘
```

**Komponen:**
- **Stat Cards** (4 buah) — angka besar dengan ikon, background gradient halus, animasi count-up
- **Bar Chart** — volume kalibrasi 7 hari terakhir (menggunakan **Chart.js** atau CSS-only bar chart)
- **Activity Feed** — daftar aktivitas terbaru dengan timestamp
- Semua card menggunakan glassmorphism effect

---

### 3.3 Halaman Barang Masuk (`/barang-masuk`)

**Untuk Admin — Full CRUD:**

```
┌──────────────────────────────────────────────────┐
│  📦 Barang Masuk                    [+ Tambah]   │
│  ─────────────────────────────────────────────── │
│  [🔍 Cari barang...]           [Filter ▼]       │
│                                                  │
│  ┌──────────────────────────────────────────────┐│
│  │ No │ Kode  │ Nama    │ Jenis    │ File │ Aksi││
│  │────│───────│─────────│──────────│──────│─────││
│  │ 1  │ KB001 │ Caliper │ Dimensi  │ 📎   │ ✏🗑││
│  │ 2  │ KB002 │ Thermo  │ Suhu     │ 📎   │ ✏🗑││
│  │ 3  │ KB003 │ Gauge   │ Tekanan  │ —    │ ✏🗑││
│  └──────────────────────────────────────────────┘│
│                                                  │
│  Menampilkan 1-10 dari 45     [< 1 2 3 4 5 >]   │
│                                [📥 Ekspor CSV]   │
└──────────────────────────────────────────────────┘
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
- Ikon aksi: Edit (✏️) dan Hapus (🗑️) — hanya untuk Admin
- Pagination di bawah tabel
- Tombol **Ekspor CSV** di pojok kanan bawah tabel
- **Search bar** dengan debounce filtering
- Untuk **Teknisi & Direktur**: tabel sama tapi tanpa kolom Aksi dan tanpa tombol Tambah/Ekspor

---

### 3.4 Halaman Barang Keluar (`/barang-keluar`)

**Untuk Admin — dengan Toggle:**

```
┌──────────────────────────────────────────────────┐
│  🚚 Barang Keluar                                │
│  ─────────────────────────────────────────────── │
│  [🔍 Cari barang...]           [Filter ▼]       │
│                                                  │
│  ┌──────────────────────────────────────────────┐│
│  │ No │ Kode  │ Nama    │ Jenis   │ Sudah Diambil│
│  │────│───────│─────────│─────────│──────────────│
│  │ 1  │ KB001 │ Caliper │ Dimensi │  🔴 Tidak    │  ← Klik toggle
│  │ 2  │ KB002 │ Thermo  │ Suhu    │  🟢 Ya       │
│  │ 3  │ KB003 │ Gauge   │ Tekanan │  🔴 Tidak    │
│  └──────────────────────────────────────────────┘│
│                                                  │
│  Menampilkan 1-10 dari 45     [< 1 2 3 4 5 >]   │
└──────────────────────────────────────────────────┘
```

**Fitur UI:**
- Data **auto-populated** dari Barang Masuk (sinkronisasi otomatis)
- Kolom "Sudah Diambil" menggunakan **toggle switch** yang beranimasi:
  - 🔴 **Tidak** — merah, posisi kiri
  - 🟢 **Ya** — hijau, posisi kanan
  - Animasi slide smooth saat toggle
- Hanya **Admin** yang bisa mengklik toggle
- **Teknisi & Direktur** melihat status sebagai badge read-only (tanpa interaksi)
- Konfirmasi dialog sebelum mengubah status

---

### 3.5 Halaman Database Kalibrasi (`/database`)

**Untuk Admin — Full CRUD:**

```
┌──────────────────────────────────────────────────┐
│  🗄️ Database Kalibrasi               [+ Tambah] │
│  ─────────────────────────────────────────────── │
│  [🔍 Cari...]                                    │
│                                                  │
│  ┌──────────────────────────────────────────────┐│
│  │ No │ Kode Alat │ Nama Alat  │ Kategori │ Aksi││
│  │────│───────────│────────────│──────────│─────││
│  │ 1  │ ALT-001   │ Caliper    │ Dimensi  │ ✏🗑││
│  │ 2  │ ALT-002   │ Thermometer│ Suhu     │ ✏🗑││
│  └──────────────────────────────────────────────┘│
│                                                  │
│  Menampilkan 1-10 dari 30     [< 1 2 3 >]       │
└──────────────────────────────────────────────────┘
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
... [🔔 3] [👤 Teknisi A ▼]

Klik 🔔 → Dropdown:
┌───────────────────────────────┐
│  🔔 Notifikasi                │
│  ─────────────────────────── │
│  🆕 Caliper Digital baru     │
│     masuk — 2 menit lalu      │
│  ─────────────────────────── │
│  🆕 Thermometer IR baru      │
│     masuk — 15 menit lalu     │
│  ─────────────────────────── │
│  📦 Gauge Tekanan baru       │
│     masuk — 1 jam lalu        │
│  ─────────────────────────── │
│  [Tandai Semua Dibaca]        │
└───────────────────────────────┘
```

**Fitur UI:**
- Badge merah dengan counter notifikasi belum dibaca
- Dropdown panel dengan daftar notifikasi
- Animasi bounce/shake pada ikon lonceng saat notifikasi baru masuk
- **Audio alert** — suara lonceng diputar saat data baru masuk (untuk Teknisi)
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
├── index.html
├── package.json
├── vite.config.js
├── public/
│   ├── favicon.ico
│   └── sounds/
│       └── notification.mp3          ← Suara lonceng
├── src/
│   ├── main.jsx                      ← Entry point
│   ├── App.jsx                       ← Router + AuthProvider
│   ├── index.css                     ← Design tokens + global styles
│   │
│   ├── assets/
│   │   └── logo.png                  ← Logo perusahaan
│   │
│   ├── context/
│   │   ├── AuthContext.jsx           ← Login state + role
│   │   └── NotificationContext.jsx   ← Notifikasi state
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx
│   │   │   ├── AppLayout.css
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Sidebar.css
│   │   │   ├── Header.jsx
│   │   │   └── Header.css
│   │   ├── ui/
│   │   │   ├── StatCard.jsx / .css
│   │   │   ├── DataTable.jsx / .css
│   │   │   ├── Modal.jsx / .css
│   │   │   ├── FormInput.jsx / .css
│   │   │   ├── FileUpload.jsx / .css
│   │   │   ├── ToggleSwitch.jsx / .css
│   │   │   ├── Badge.jsx / .css
│   │   │   ├── Pagination.jsx / .css
│   │   │   ├── SearchBar.jsx / .css
│   │   │   ├── ConfirmDialog.jsx / .css
│   │   │   └── NotificationBell.jsx / .css
│   │   └── guards/
│   │       └── RoleGuard.jsx
│   │
│   ├── pages/
│   │   ├── LoginPage.jsx / .css
│   │   ├── DashboardPage.jsx / .css
│   │   ├── BarangMasukPage.jsx / .css
│   │   ├── BarangKeluarPage.jsx / .css
│   │   └── DatabasePage.jsx / .css
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useNotification.js
│   │
│   └── data/
│       └── mockData.js               ← Dummy data untuk demo
```

---

## 6. Responsive Design Strategy

| Breakpoint | Perilaku |
|---|---|
| **≥1200px** (Desktop) | Sidebar terbuka penuh, tabel multi-kolom |
| **768px–1199px** (Tablet) | Sidebar collapsed (ikon saja), tabel scroll horizontal |
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

## Open Questions — ✅ RESOLVED

1. ✅ **Logo**: Sudah di-upload oleh user (dark blue with white text)
2. ✅ **Warna brand**: Biru (sesuai logo) + font putih
3. ✅ **Jenis Layanan**: Weight and Balance, Dimensional, Pressure, Force, Electrical, Temperature, Analytical Instrument, Volumetric, Other Calibration
4. ✅ **Chart.js**: Disetujui
5. ✅ **Bahasa**: Full Bahasa Indonesia

---

## Verification Plan

### Automated Tests
- Menjalankan `npm run dev` dan memastikan semua halaman ter-render tanpa error
- Browser testing: mengunjungi setiap route dan memverifikasi tampilan visual
- Testing responsive di berbagai ukuran viewport (desktop, tablet, mobile)

### Manual Verification
- Screenshot setiap halaman untuk review visual
- Testing alur login → dashboard → navigasi semua menu
- Testing modal form input barang
- Testing toggle switch di halaman Barang Keluar
- Testing animasi notifikasi dan suara lonceng
- Testing role switching — memastikan menu yang tampil sesuai role
