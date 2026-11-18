-- Accès aux amendements d'un député sur une législature (détail de l'onglet
-- « Dossiers législatifs » de la fiche député) : évite un scan complet.
-- CreateIndex
CREATE INDEX "amendements_acteur_uid_legislature_snapshot_idx" ON "amendements"("acteur_uid", "legislature_snapshot");
