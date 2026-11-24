-- CreateTable
CREATE TABLE "questions" (
    "uid" VARCHAR(30) NOT NULL,
    "type_question" VARCHAR(10) NOT NULL,
    "legislature" INTEGER,
    "numero" INTEGER,
    "acteur_uid" VARCHAR(50) NOT NULL,
    "mandat_uid" VARCHAR(50),
    "groupe_uid" VARCHAR(50),
    "groupe_abrege" VARCHAR(30),
    "rubrique" TEXT,
    "tete_analyse" TEXT,
    "libelle_analyse" TEXT,
    "ministere_uid" VARCHAR(50),
    "ministere_abrege" TEXT,
    "date_question" DATE,
    "texte_question" TEXT,
    "date_reponse" DATE,
    "type_jo_reponse" VARCHAR(20),
    "page_jo_reponse" VARCHAR(20),
    "texte_reponse" TEXT,
    "code_cloture" VARCHAR(20),
    "libelle_cloture" TEXT,
    "date_cloture" DATE,
    "nb_renouvellements" INTEGER NOT NULL DEFAULT 0,
    "date_dernier_renouvellement" DATE,
    "date_signalement" DATE,
    "legislature_snapshot" INTEGER NOT NULL,
    "row_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "questions_ministeres_attributaires" (
    "question_uid" VARCHAR(30) NOT NULL,
    "ordre" INTEGER NOT NULL,
    "ministere_uid" VARCHAR(50),
    "ministere_abrege" TEXT,
    "date_jo" DATE,
    "legislature_snapshot" INTEGER NOT NULL,
    "row_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_ministeres_attributaires_pkey" PRIMARY KEY ("question_uid","ordre")
);

-- CreateIndex
CREATE UNIQUE INDEX "questions_row_hash_key" ON "questions"("row_hash");

-- CreateIndex
CREATE INDEX "questions_acteur_uid_idx" ON "questions"("acteur_uid");

-- CreateIndex
CREATE INDEX "questions_type_question_idx" ON "questions"("type_question");

-- CreateIndex
CREATE INDEX "questions_date_reponse_idx" ON "questions"("date_reponse");

-- CreateIndex
CREATE INDEX "questions_ministere_uid_idx" ON "questions"("ministere_uid");

-- CreateIndex
CREATE INDEX "questions_legislature_snapshot_idx" ON "questions"("legislature_snapshot");

-- CreateIndex
CREATE UNIQUE INDEX "questions_ministeres_attributaires_row_hash_key" ON "questions_ministeres_attributaires"("row_hash");

-- CreateIndex
CREATE INDEX "questions_ministeres_attributaires_ministere_uid_idx" ON "questions_ministeres_attributaires"("ministere_uid");

-- AddForeignKey
ALTER TABLE "questions_ministeres_attributaires" ADD CONSTRAINT "questions_ministeres_attributaires_question_uid_fkey" FOREIGN KEY ("question_uid") REFERENCES "questions"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- Sources de données des trois jeux de questions (législatures 16 et 17) pour
-- une base déjà seedée : le seed ne tourne qu'au premier setup. Sur une base
-- neuve (législatures pas encore seedées), rien n'est inséré ici et c'est
-- seed.sql qui s'en charge. Un domaine par archive : param_data_sources est
-- unique par (domaine, législature).
INSERT INTO "ref_data_domains" ("code", "description")
SELECT v.code, v.description
FROM (VALUES ('questions_gouvernement', 'Questions au Gouvernement'),
             ('questions_orales_sans_debat', 'Questions orales sans débat'),
             ('questions_ecrites', 'Questions écrites')) AS v(code, description)
WHERE EXISTS (SELECT 1 FROM "param_legislatures" WHERE "number" IN (16, 17))
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "param_data_sources" ("domain_id", "legislature_id", "download_url", "file_name")
SELECT d."id",
       l."id",
       'https://data.assemblee-nationale.fr/static/openData/repository/' || l."number" || '/questions/' || v.chemin || '/' || v.fichier,
       v.fichier
FROM (VALUES ('questions_gouvernement', 'questions_gouvernement', 'Questions_gouvernement.json.zip'),
             ('questions_orales_sans_debat', 'questions_orales_sans_debat', 'Questions_orales_sans_debat.json.zip'),
             ('questions_ecrites', 'questions_ecrites', 'Questions_ecrites.json.zip')) AS v(code, chemin, fichier)
         JOIN "ref_data_domains" d ON d."code" = v.code
         JOIN "param_legislatures" l ON l."number" IN (16, 17)
ON CONFLICT ("domain_id", "legislature_id") DO NOTHING;
