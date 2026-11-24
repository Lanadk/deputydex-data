-- CreateTable
CREATE TABLE "reunions" (
    "uid" VARCHAR(50) NOT NULL,
    "type_reunion" VARCHAR(30) NOT NULL,
    "legislature" INTEGER,
    "organe_uid" VARCHAR(50) NOT NULL,
    "etat" VARCHAR(30),
    "date_debut" TIMESTAMPTZ(6) NOT NULL,
    "date_fin" TIMESTAMPTZ(6),
    "session_ref" VARCHAR(50),
    "compte_rendu_ref" VARCHAR(80),
    "lieu_ref" VARCHAR(50),
    "lieu_libelle" TEXT,
    "format_reunion" VARCHAR(30),
    "sous_type_reunion" VARCHAR(30),
    "visio_conference" BOOLEAN,
    "captation_video" BOOLEAN,
    "ouverture_presse" BOOLEAN,
    "est_reunion_internationale" BOOLEAN,
    "date_seance" DATE,
    "id_jo" VARCHAR(20),
    "num_seance_jo" INTEGER,
    "quantieme" VARCHAR(30),
    "resume_odj" TEXT,
    "convocation_odj" TEXT,
    "legislature_snapshot" INTEGER NOT NULL,
    "row_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reunions_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "reunions_participants" (
    "reunion_uid" VARCHAR(50) NOT NULL,
    "acteur_uid" VARCHAR(50) NOT NULL,
    "presence" VARCHAR(20) NOT NULL,
    "legislature_snapshot" INTEGER NOT NULL,
    "row_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reunions_participants_pkey" PRIMARY KEY ("reunion_uid","acteur_uid")
);

-- CreateTable
CREATE TABLE "reunions_points_odj" (
    "uid" VARCHAR(60) NOT NULL,
    "reunion_uid" VARCHAR(50) NOT NULL,
    "ordre" INTEGER NOT NULL,
    "type_point" TEXT,
    "objet" TEXT,
    "etat" VARCHAR(30),
    "procedure" TEXT,
    "nature_travaux" VARCHAR(20),
    "comite_secret" BOOLEAN,
    "date_conf_pres" DATE,
    "legislature_snapshot" INTEGER NOT NULL,
    "row_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reunions_points_odj_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "reunions_points_odj_dossiers" (
    "point_uid" VARCHAR(60) NOT NULL,
    "reunion_uid" VARCHAR(50) NOT NULL,
    "dossier_uid" VARCHAR(50) NOT NULL,
    "legislature_snapshot" INTEGER NOT NULL,
    "row_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reunions_points_odj_dossiers_pkey" PRIMARY KEY ("point_uid","dossier_uid")
);

-- CreateIndex
CREATE UNIQUE INDEX "reunions_row_hash_key" ON "reunions"("row_hash");

-- CreateIndex
CREATE INDEX "reunions_organe_uid_idx" ON "reunions"("organe_uid");

-- CreateIndex
CREATE INDEX "reunions_date_debut_idx" ON "reunions"("date_debut");

-- CreateIndex
CREATE INDEX "reunions_type_reunion_idx" ON "reunions"("type_reunion");

-- CreateIndex
CREATE INDEX "reunions_legislature_snapshot_idx" ON "reunions"("legislature_snapshot");

-- CreateIndex
CREATE UNIQUE INDEX "reunions_participants_row_hash_key" ON "reunions_participants"("row_hash");

-- CreateIndex
CREATE INDEX "reunions_participants_acteur_uid_idx" ON "reunions_participants"("acteur_uid");

-- CreateIndex
CREATE INDEX "reunions_participants_legislature_snapshot_idx" ON "reunions_participants"("legislature_snapshot");

-- CreateIndex
CREATE UNIQUE INDEX "reunions_points_odj_row_hash_key" ON "reunions_points_odj"("row_hash");

-- CreateIndex
CREATE INDEX "reunions_points_odj_reunion_uid_idx" ON "reunions_points_odj"("reunion_uid");

-- CreateIndex
CREATE INDEX "reunions_points_odj_legislature_snapshot_idx" ON "reunions_points_odj"("legislature_snapshot");

-- CreateIndex
CREATE UNIQUE INDEX "reunions_points_odj_dossiers_row_hash_key" ON "reunions_points_odj_dossiers"("row_hash");

-- CreateIndex
CREATE INDEX "reunions_points_odj_dossiers_dossier_uid_idx" ON "reunions_points_odj_dossiers"("dossier_uid");

-- CreateIndex
CREATE INDEX "reunions_points_odj_dossiers_reunion_uid_idx" ON "reunions_points_odj_dossiers"("reunion_uid");

-- AddForeignKey
ALTER TABLE "reunions_participants" ADD CONSTRAINT "reunions_participants_reunion_uid_fkey" FOREIGN KEY ("reunion_uid") REFERENCES "reunions"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reunions_points_odj" ADD CONSTRAINT "reunions_points_odj_reunion_uid_fkey" FOREIGN KEY ("reunion_uid") REFERENCES "reunions"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reunions_points_odj_dossiers" ADD CONSTRAINT "reunions_points_odj_dossiers_point_uid_fkey" FOREIGN KEY ("point_uid") REFERENCES "reunions_points_odj"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- Sources de données « reunions » (législatures 16 et 17) pour une base déjà
-- seedée : le seed ne tourne qu'au premier setup. Sur une base neuve
-- (législatures pas encore seedées), rien n'est inséré ici et c'est seed.sql
-- qui s'en charge.
INSERT INTO "ref_data_domains" ("code", "description")
SELECT 'reunions', 'Agenda : réunions de commission, séances publiques, groupes d''études'
WHERE EXISTS (SELECT 1 FROM "param_legislatures" WHERE "number" IN (16, 17))
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "param_data_sources" ("domain_id", "legislature_id", "download_url", "file_name")
SELECT d."id",
       l."id",
       'https://data.assemblee-nationale.fr/static/openData/repository/' || l."number" || '/vp/reunions/Agenda.json.zip',
       'Agenda.json.zip'
FROM "ref_data_domains" d
         JOIN "param_legislatures" l ON l."number" IN (16, 17)
WHERE d."code" = 'reunions'
ON CONFLICT ("domain_id", "legislature_id") DO NOTHING;
