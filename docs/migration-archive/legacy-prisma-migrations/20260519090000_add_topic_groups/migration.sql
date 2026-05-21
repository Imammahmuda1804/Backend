CREATE TABLE "topic_groups" (
    "id" SERIAL NOT NULL,
    "group_name" TEXT NOT NULL,
    "description" TEXT,
    "keywords" JSONB,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topic_groups_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "topics"
ADD COLUMN "group_id" INTEGER,
ADD COLUMN "label_type" TEXT NOT NULL DEFAULT 'fine',
ADD COLUMN "is_search_visible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "is_detail_visible" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "topics_group_id_idx" ON "topics"("group_id");
CREATE INDEX "topics_is_search_visible_idx" ON "topics"("is_search_visible");

ALTER TABLE "topics"
ADD CONSTRAINT "topics_group_id_fkey"
FOREIGN KEY ("group_id") REFERENCES "topic_groups"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "topic_groups" ("group_name", "description", "keywords", "display_order", "updated_at")
VALUES
('Harga & Pengalaman', 'Biaya, tiket, pungutan, nilai pengalaman, dan persepsi mahal atau murah.', '["harga","tiket","biaya","mahal","murah","pungli","bayar","parkir"]'::jsonb, 1, CURRENT_TIMESTAMP),
('Kebersihan & Kenyamanan', 'Kebersihan area, toilet, sampah, kenyamanan, dan kondisi tempat.', '["bersih","kotor","sampah","toilet","nyaman","terawat","bau"]'::jsonb, 2, CURRENT_TIMESTAMP),
('Akses & Lokasi', 'Rute, jalan, lokasi, jarak, transportasi, dan kemudahan menuju destinasi.', '["akses","jalan","lokasi","rute","parkir","macet","jauh","dekat"]'::jsonb, 3, CURRENT_TIMESTAMP),
('Fasilitas', 'Fasilitas pendukung seperti toilet, mushola, tempat makan, parkir, dan layanan.', '["fasilitas","toilet","mushola","parkir","warung","gazebo","layanan"]'::jsonb, 4, CURRENT_TIMESTAMP),
('Keramaian', 'Kepadatan pengunjung, antrean, suasana ramai atau sepi.', '["ramai","sepi","pengunjung","antre","antri","padat"]'::jsonb, 5, CURRENT_TIMESTAMP),
('Pemandangan & Aktivitas', 'Pemandangan, spot foto, aktivitas, wahana, dan daya tarik utama.', '["pemandangan","view","foto","spot","wahana","aktivitas","alam","pantai"]'::jsonb, 6, CURRENT_TIMESTAMP),
('Keamanan & Pengelolaan', 'Keamanan, pengelolaan, petugas, aturan, dan pengalaman layanan destinasi.', '["aman","keamanan","petugas","pengelola","aturan","pungli","rawan"]'::jsonb, 7, CURRENT_TIMESTAMP),
('Lainnya', 'Topik yang belum cocok dengan kelompok utama.', '["lainnya","umum"]'::jsonb, 99, CURRENT_TIMESTAMP);
