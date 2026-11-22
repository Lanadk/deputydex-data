-- CreateTable
CREATE TABLE "ref_portraits" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "acteur_uid" VARCHAR(50),
    "photo_path" TEXT NOT NULL,
    "auteur" TEXT NOT NULL,
    "licence" VARCHAR(50) NOT NULL,
    "licence_url" TEXT,
    "source_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ref_portraits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ref_mandats_presidentiels" (
    "id" SERIAL NOT NULL,
    "president" VARCHAR(100) NOT NULL,
    "mandat_numero" INTEGER NOT NULL,
    "debut" DATE NOT NULL,
    "fin" DATE,
    "portrait_slug" VARCHAR(100),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ref_mandats_presidentiels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ref_evenements_institutionnels" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "libelle" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ref_evenements_institutionnels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ref_portraits_slug_key" ON "ref_portraits"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ref_portraits_acteur_uid_key" ON "ref_portraits"("acteur_uid");

-- CreateIndex
CREATE UNIQUE INDEX "ref_mandats_presidentiels_debut_key" ON "ref_mandats_presidentiels"("debut");

-- CreateIndex
CREATE UNIQUE INDEX "ref_evenements_institutionnels_date_type_key" ON "ref_evenements_institutionnels"("date", "type");
