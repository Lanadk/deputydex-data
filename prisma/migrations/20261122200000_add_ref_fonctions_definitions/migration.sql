-- CreateTable
CREATE TABLE "ref_fonctions_definitions" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "libelle" VARCHAR(100) NOT NULL,
    "definition" TEXT NOT NULL,
    "source" VARCHAR(200),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ref_fonctions_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ref_fonctions_definitions_slug_key" ON "ref_fonctions_definitions"("slug");
