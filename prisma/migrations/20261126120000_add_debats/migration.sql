-- CreateTable
CREATE TABLE "debats_comptes_rendus" (
    "uid" VARCHAR(40) NOT NULL,
    "seance_uid" VARCHAR(50),
    "session_ref" VARCHAR(30),
    "date_seance" TIMESTAMPTZ(6),
    "date_seance_libelle" VARCHAR(60),
    "num_seance" INTEGER,
    "quantieme" VARCHAR(30),
    "legislature" INTEGER,
    "session_libelle" TEXT,
    "num_jo" VARCHAR(20),
    "etat" VARCHAR(30),
    "validite" VARCHAR(30),
    "version" VARCHAR(30),
    "legislature_snapshot" INTEGER NOT NULL,
    "row_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debats_comptes_rendus_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "debats_points" (
    "id" VARCHAR(20) NOT NULL,
    "compte_rendu_uid" VARCHAR(40) NOT NULL,
    "parent_id" VARCHAR(20),
    "profondeur" INTEGER NOT NULL,
    "ordre" INTEGER,
    "valeur_pts_odj" VARCHAR(20),
    "code_grammaire" VARCHAR(60),
    "titre" TEXT,
    "legislature_snapshot" INTEGER NOT NULL,
    "row_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debats_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debats_interventions" (
    "id" VARCHAR(20) NOT NULL,
    "compte_rendu_uid" VARCHAR(40) NOT NULL,
    "point_id" VARCHAR(20),
    "ordre" INTEGER,
    "acteur_uid" VARCHAR(50),
    "mandat_uid" VARCHAR(50),
    "role_debat" VARCHAR(20),
    "code_grammaire" VARCHAR(60),
    "code_style" VARCHAR(40),
    "type_debat" VARCHAR(20),
    "orateurs_libelle" TEXT,
    "texte" TEXT,
    "stime" DECIMAL(10,2),
    "bibard" TEXT,
    "article" TEXT,
    "amendement" TEXT,
    "sous_amendement" TEXT,
    "amendement_uid" VARCHAR(60),
    "decision" TEXT,
    "legislature_snapshot" INTEGER NOT NULL,
    "row_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debats_interventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debats_interventions_orateurs" (
    "intervention_id" VARCHAR(20) NOT NULL,
    "ordre" INTEGER NOT NULL,
    "acteur_uid" VARCHAR(50),
    "nom" TEXT,
    "qualite" TEXT,
    "legislature_snapshot" INTEGER NOT NULL,
    "row_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debats_interventions_orateurs_pkey" PRIMARY KEY ("intervention_id","ordre")
);

-- CreateIndex
CREATE UNIQUE INDEX "debats_comptes_rendus_row_hash_key" ON "debats_comptes_rendus"("row_hash");

-- CreateIndex
CREATE INDEX "debats_comptes_rendus_seance_uid_idx" ON "debats_comptes_rendus"("seance_uid");

-- CreateIndex
CREATE INDEX "debats_comptes_rendus_date_seance_idx" ON "debats_comptes_rendus"("date_seance");

-- CreateIndex
CREATE INDEX "debats_comptes_rendus_legislature_snapshot_idx" ON "debats_comptes_rendus"("legislature_snapshot");

-- CreateIndex
CREATE UNIQUE INDEX "debats_points_row_hash_key" ON "debats_points"("row_hash");

-- CreateIndex
CREATE INDEX "debats_points_compte_rendu_uid_idx" ON "debats_points"("compte_rendu_uid");

-- CreateIndex
CREATE INDEX "debats_points_parent_id_idx" ON "debats_points"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "debats_interventions_row_hash_key" ON "debats_interventions"("row_hash");

-- CreateIndex
CREATE INDEX "debats_interventions_compte_rendu_uid_idx" ON "debats_interventions"("compte_rendu_uid");

-- CreateIndex
CREATE INDEX "debats_interventions_acteur_uid_idx" ON "debats_interventions"("acteur_uid");

-- CreateIndex
CREATE INDEX "debats_interventions_point_id_idx" ON "debats_interventions"("point_id");

-- CreateIndex
CREATE INDEX "debats_interventions_code_grammaire_idx" ON "debats_interventions"("code_grammaire");

-- CreateIndex
CREATE UNIQUE INDEX "debats_interventions_orateurs_row_hash_key" ON "debats_interventions_orateurs"("row_hash");

-- CreateIndex
CREATE INDEX "debats_interventions_orateurs_acteur_uid_idx" ON "debats_interventions_orateurs"("acteur_uid");

-- AddForeignKey
ALTER TABLE "debats_points" ADD CONSTRAINT "debats_points_compte_rendu_uid_fkey" FOREIGN KEY ("compte_rendu_uid") REFERENCES "debats_comptes_rendus"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debats_interventions" ADD CONSTRAINT "debats_interventions_compte_rendu_uid_fkey" FOREIGN KEY ("compte_rendu_uid") REFERENCES "debats_comptes_rendus"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debats_interventions_orateurs" ADD CONSTRAINT "debats_interventions_orateurs_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "debats_interventions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Source de données « debats » (législatures 16 et 17) pour une base déjà
-- seedée : le seed ne tourne qu'au premier setup. Sur une base neuve
-- (législatures pas encore seedées), rien n'est inséré ici et c'est seed.sql
-- qui s'en charge.
INSERT INTO "ref_data_domains" ("code", "description")
SELECT 'debats', 'Comptes rendus intégraux des séances publiques (Syceron)'
WHERE EXISTS (SELECT 1 FROM "param_legislatures" WHERE "number" IN (16, 17))
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "param_data_sources" ("domain_id", "legislature_id", "download_url", "file_name")
SELECT d."id",
       l."id",
       'https://data.assemblee-nationale.fr/static/openData/repository/' || l."number" || '/vp/syceronbrut/syseron.xml.zip',
       'syseron.xml.zip'
FROM "ref_data_domains" d
         JOIN "param_legislatures" l ON l."number" IN (16, 17)
WHERE d."code" = 'debats'
ON CONFLICT ("domain_id", "legislature_id") DO NOTHING;