-- CreateTable
CREATE TABLE "organes" (
    "uid" VARCHAR(50) NOT NULL,
    "code_type" VARCHAR(30) NOT NULL,
    "libelle" TEXT,
    "libelle_edition" TEXT,
    "libelle_abrege" TEXT,
    "libelle_abrev" VARCHAR(50),
    "date_debut" DATE,
    "date_fin" DATE,
    "organe_parent_uid" VARCHAR(50),
    "organe_precedent_uid" VARCHAR(50),
    "preseance" INTEGER,
    "legislature" INTEGER,
    "legislature_snapshot" INTEGER NOT NULL,
    "row_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organes_pkey" PRIMARY KEY ("uid")
);

-- CreateIndex
CREATE UNIQUE INDEX "organes_row_hash_key" ON "organes"("row_hash");

-- CreateIndex
CREATE INDEX "organes_code_type_idx" ON "organes"("code_type");

-- CreateIndex
CREATE INDEX "organes_organe_parent_uid_idx" ON "organes"("organe_parent_uid");
