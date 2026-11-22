-- ref_portraits : référentiel manuel — portraits de personnalités qui n'ont pas
-- de photo de député dans ref_acteurs_photos (Président de la République,
-- Premiers ministres qui n'ont pas siégé pendant les législatures couvertes…).
--
-- Images issues de Wikimedia Commons, redimensionnées, servies par le front
-- depuis public/assets/imgs/personnalites/. "auteur" et "licence" sont des
-- crédits À AFFICHER (CC BY-SA, Licence Ouverte) : ne pas ajouter de portrait
-- sans eux. "acteur_uid" : identifiant AN (PAxxx) quand la personne existe
-- dans `acteurs`, NULL sinon (ex. Emmanuel Macron, jamais député).
--
-- Une ligne par personne, clé "slug" (prenom-nom, sans accents).

INSERT INTO ref_portraits (slug, acteur_uid, photo_path, auteur, licence, licence_url, source_url)
VALUES
    ('emmanuel-macron', NULL,
     '/assets/imgs/personnalites/emmanuel-macron.jpg',
     'The White House', 'Domaine public', NULL,
     'https://commons.wikimedia.org/wiki/File:Emmanuel_Macron_in_2019.jpg'),

    ('sebastien-lecornu', 'PA643210',
     '/assets/imgs/personnalites/sebastien-lecornu.jpg',
     'Patrice Normand / Leextra', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/',
     'https://commons.wikimedia.org/wiki/File:Portrait_officiel_de_S%C3%A9bastien_Lecornu_-_Ministre_des_Arm%C3%A9es_(cropped_2).jpg'),

    ('francois-bayrou', 'PA410',
     '/assets/imgs/personnalites/francois-bayrou.jpg',
     'Service photographique de Matignon', 'Licence Ouverte', 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/',
     'https://commons.wikimedia.org/wiki/File:Bayrou_Matignon_(3x4_crop).jpg'),

    ('michel-barnier', 'PA368',
     '/assets/imgs/personnalites/michel-barnier.jpg',
     'Florian David', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/',
     'https://commons.wikimedia.org/wiki/File:Barnier_Portrait_(3x4_cropped).jpg')
ON CONFLICT (slug) DO UPDATE
    SET acteur_uid  = EXCLUDED.acteur_uid,
        photo_path  = EXCLUDED.photo_path,
        auteur      = EXCLUDED.auteur,
        licence     = EXCLUDED.licence,
        licence_url = EXCLUDED.licence_url,
        source_url  = EXCLUDED.source_url,
        updated_at  = now();
