import * as fs from 'fs';
import * as path from 'path';
import {
    Acteur,
    ActeurAdresseMail,
    ActeurAdressePostale,
    ActeurReseauSocial,
    ActeurTelephone
} from "./entities/Acteur.entity";
import {IExtractor} from "../../infrastructure/IExtractor";
import {computeRowHash} from "../../../../utils/hash";


export class ActeursExtractor implements IExtractor {
    private acteurs: Acteur[] = [];
    private acteursAdressesPostales: ActeurAdressePostale[] = [];
    private acteursAdressesMails: ActeurAdresseMail[] = [];
    private acteursReseauxSociaux: ActeurReseauSocial[] = [];
    private acteursTelephones: ActeurTelephone[] = [];
    private errors: Array<{ file: string; error: string }> = [];

    constructor(private readonly legislature_snapshot: number) {}

    async processFile(filePath: string): Promise<void> {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);
            this.extractData(data);
        } catch (error) {
            this.errors.push({
                file: path.basename(filePath),
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    getTables(): Record<string, any[]> {
        return {
            acteurs: this.acteurs,
            acteursAdressesPostales: this.acteursAdressesPostales,
            acteursAdressesMails: this.acteursAdressesMails,
            acteursReseauxSociaux: this.acteursReseauxSociaux,
            acteursTelephones: this.acteursTelephones
        };
    }

    getErrors(): Array<{ file: string; error: string }> {
        return this.errors;
    }

    private extractData(data: any): void {
        const acteur = data.acteur || data;
        if (!acteur.uid) throw new Error('Missing uid');

        const uid = typeof acteur.uid === 'string' ? acteur.uid : acteur.uid['#text'];

        // legislature_snapshot est inclus dans le hash pour qu'un même acteur
        // dans deux législatures différentes ait un hash différent
        const acteurObj = {
            uid,
            civilite: acteur.etatCivil?.ident?.civ || null,
            prenom: acteur.etatCivil?.ident?.prenom || null,
            nom: acteur.etatCivil?.ident?.nom || null,
            nom_alpha: acteur.etatCivil?.ident?.alpha || null,
            trigramme: acteur.etatCivil?.ident?.trigramme || null,
            date_naissance: acteur.etatCivil?.infoNaissance?.dateNais || null,
            ville_naissance: acteur.etatCivil?.infoNaissance?.villeNais || null,
            departement_naissance: acteur.etatCivil?.infoNaissance?.depNais || null,
            pays_naissance: acteur.etatCivil?.infoNaissance?.paysNais || null,
            date_deces: acteur.etatCivil?.dateDeces || null,
            profession_libelle: acteur.profession?.libelleCourant || null,
            profession_categorie: acteur.profession?.socProcINSEE?.catSocPro || null,
            profession_famille: acteur.profession?.socProcINSEE?.famSocPro || null,
            uri_hatvp: acteur.uri_hatvp || null,
            legislature_snapshot: this.legislature_snapshot,
        };
        this.acteurs.push({ ...acteurObj, row_hash: computeRowHash(acteurObj) });

        if (!acteur.adresses?.adresse) return;

        const adresses = Array.isArray(acteur.adresses.adresse)
            ? acteur.adresses.adresse
            : [acteur.adresses.adresse];

        for (const adresse of adresses) {
            if (!adresse) continue;
            this.extractAdresse(uid, adresse);
        }
    }

    private extractAdresse(acteurUid: string, adresse: any): void {
        const xsiType = adresse['@xsi:type'];

        switch (xsiType) {
            case 'AdressePostale_Type': {
                const obj = {
                    acteur_uid: acteurUid,
                    uid_adresse: adresse.uid || '',
                    type_code: adresse.type || null,
                    type_libelle: adresse.typeLibelle || null,
                    intitule: adresse.intitule || null,
                    numero_rue: adresse.numeroRue || null,
                    nom_rue: adresse.nomRue || null,
                    complement_adresse: adresse.complementAdresse || null,
                    code_postal: adresse.codePostal || null,
                    ville: adresse.ville || null,
                    legislature_snapshot: this.legislature_snapshot,
                };
                this.acteursAdressesPostales.push({ ...obj, row_hash: computeRowHash(obj) });
                break;
            }

            case 'AdresseMail_Type': {
                const obj = {
                    acteur_uid: acteurUid,
                    uid_adresse: adresse.uid || '',
                    type_code: adresse.type || null,
                    type_libelle: adresse.typeLibelle || null,
                    email: adresse.valElec || '',
                    legislature_snapshot: this.legislature_snapshot,
                };
                this.acteursAdressesMails.push({ ...obj, row_hash: computeRowHash(obj) });
                break;
            }

            case 'AdresseSiteWeb_Type': {
                const obj = {
                    acteur_uid: acteurUid,
                    uid_adresse: adresse.uid || '',
                    type_code: adresse.type || null,
                    type_libelle: adresse.typeLibelle || null,
                    plateforme: this.detectPlateforme(adresse.typeLibelle || ''),
                    identifiant: adresse.valElec || '',
                    legislature_snapshot: this.legislature_snapshot,
                };
                this.acteursReseauxSociaux.push({ ...obj, row_hash: computeRowHash(obj) });
                break;
            }

            case 'AdresseTelephonique_Type': {
                const obj = {
                    acteur_uid: acteurUid,
                    uid_adresse: adresse.uid || '',
                    type_code: adresse.type || null,
                    type_libelle: adresse.typeLibelle || null,
                    adresse_rattachement: adresse.adresseDeRattachement || null,
                    numero: adresse.valElec || '',
                    legislature_snapshot: this.legislature_snapshot,
                };
                this.acteursTelephones.push({ ...obj, row_hash: computeRowHash(obj) });
                break;
            }
        }
    }

    private detectPlateforme(typeLibelle: string): string {
        const libelle = typeLibelle.toLowerCase();
        if (libelle.includes('facebook')) return 'facebook';
        if (libelle.includes('twitter')) return 'twitter';
        if (libelle.includes('instagram')) return 'instagram';
        if (libelle.includes('linkedin')) return 'linkedin';
        if (libelle.includes('youtube')) return 'youtube';
        return 'site_web';
    }
}