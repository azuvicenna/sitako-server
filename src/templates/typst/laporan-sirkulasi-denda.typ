#set page(
  paper: "a4",
  margin: (x: 2cm, y: 2cm),
  header: align(center)[
    #text(size: 10pt, weight: "bold")[#namaSekolah]
    #line(length: 100%, stroke: 0.5pt)
  ],
  footer: align(center)[
    #text(size: 9pt)[Halaman #locate(loc => counter(page).at(loc).first()) dari #locate(loc => counter(page).final(loc).first())]
  ],
)
#set text(font: "Arial", size: 11pt)

#align(center)[
  #text(size: 16pt, weight: "bold")[Laporan Sirkulasi dan Denda Perpustakaan]
  #v(0.3em)
  #text(size: 11pt)[Periode: #periodeLaporan]
]
#v(2em)

== 1. Laporan Sirkulasi
#v(0.5em)
#table(
  columns: (auto, 1fr, 1fr, auto, auto, auto),
  inset: 8pt,
  align: horizon,
  stroke: 0.5pt,
  fill: (x, y) => if y == 0 { luma(230) } else { none },
  [*Kode Transaksi*], [*Nama Peminjam*], [*Judul Buku*], [*Tgl Pinjam*], [*Tgl Kembali*], [*Status*],
  #barisSirkulasi
)

#v(2em)

== 2. Laporan Denda
#v(0.5em)
#table(
  columns: (1fr, 1fr, auto, auto, auto, auto),
  inset: 8pt,
  align: horizon,
  stroke: 0.5pt,
  fill: (x, y) => if y == 0 { luma(230) } else { none },
  [*Nama Peminjam*], [*Judul Buku*], [*Total Denda*], [*Metode*], [*Status Bayar*], [*Tgl Bayar*],
  #barisDenda
)

#v(3em)

#align(right)[
  Dicetak pada #tanggalCetak \
  #v(3em)
  #namaPustakawan \
  Pustakawan
]
