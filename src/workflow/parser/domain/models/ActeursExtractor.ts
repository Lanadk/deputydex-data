import * as fs from 'fs';
import * as path from 'path';
import {
    Acteur,
    ActeurAdresseMail,
    ActeurAdressePostale,
    ActeurReseauSocial,
    ActeurTelephone
} from "./entities/Acteur.entity";
import {Mandat, MandatSuppleant} from "./entities/Mandat.entity";
import {IExtractor} from "../../infrastructure/IExtractor";
import {computeRowHash} from "../../../../utils/hash";
import {extractNilableValue} from "../../infrastructure/impl/xml-nil.utils";


export class ActeursExtractor implements IExtractor {
    private acteurs: Acteur[] = [];
    private acteursAdressesPostales: ActeurAdressePostale[] = [];
    private groupesSet = new Set<string>();
    private acteursAdressesMails: ActeurAdresseMail[] = [];
    private acteursReseauxSociaux: ActeurReseauSocial[] = [];
    private acteursTelephones: ActeurTelephone[] = [];
    private mandats: Mandat[] = [];
    private mandatsSuppleants: MandatSuppleant[] = [];
    private errors: Array<{ file: string; error: string }> = [];

    constructor(private readonly legislatureSnapshot: number) {
    }

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
            acteursTelephones: this.acteursTelephones,
            mandats: this.mandats,
            mandatsSuppleants: this.mandatsSuppleants,
            groupesVuDesMandats: Array.from(this.groupesSet).map(id => {
                const obj = { id, legislature_snapshot: this.legislatureSnapshot };
                return { ...obj, row_hash: computeRowHash(obj) };
            }),
        };
    }

    getErrors(): Array<{ file: string; error: string }> {
        return this.errors;
    }

    private extractData(data: any): void {
        const acteur = data.acteur || data;
        if (!acteur.uid) throw new Error('Missing uid');

        const uid = typeof acteur.uid === 'string' ? acteur.uid : acteur.uid['#text'];

        const acteurObj = {
            uid,
            civilite: extractNilableValue(acteur.etatCivil?.ident?.civ),
            prenom: extractNilableValue(acteur.etatCivil?.ident?.prenom),
            nom: extractNilableValue(acteur.etatCivil?.ident?.nom),
            nom_alpha: extractNilableValue(acteur.etatCivil?.ident?.alpha),
            trigramme: extractNilableValue(acteur.etatCivil?.ident?.trigramme),
            date_naissance: extractNilableValue(acteur.etatCivil?.infoNaissance?.dateNais),
            ville_naissance: extractNilableValue(acteur.etatCivil?.infoNaissance?.villeNais),
            departement_naissance: extractNilableValue(acteur.etatCivil?.infoNaissance?.depNais),
            pays_naissance: extractNilableValue(acteur.etatCivil?.infoNaissance?.paysNais),
            date_deces: extractNilableValue(acteur.etatCivil?.dateDeces),
            profession_libelle: extractNilableValue(acteur.profession?.libelleCourant),
            profession_categorie: extractNilableValue(acteur.profession?.socProcINSEE?.catSocPro),
            profession_famille: extractNilableValue(acteur.profession?.socProcINSEE?.famSocPro),
            uri_hatvp: extractNilableValue(acteur.uri_hatvp),
            legislature_snapshot: this.legislatureSnapshot,
        };
        this.acteurs.push({...acteurObj, row_hash: computeRowHash(acteurObj)});

        // Adresses (inchangé)
        if (acteur.adresses?.adresse) {
            const adresses = Array.isArray(acteur.adresses.adresse)
                ? acteur.adresses.adresse
                : [acteur.adresses.adresse];

            for (const adresse of adresses) {
                if (!adresse) continue;
                this.extractAdresse(uid, adresse);
            }
        }

        //idempotent si absent
        if (acteur.mandats?.mandat) {
            const mandats = Array.isArray(acteur.mandats.mandat)
                ? acteur.mandats.mandat
                : [acteur.mandats.mandat];

            for (const mandat of mandats) {
                if (!mandat) continue;
                this.extractMandat(uid, mandat);
            }
        }
    }

    private extractMandat(acteurUid: string, mandat: any): void {
        if (!mandat.uid) return;

        const uid = typeof mandat.uid === 'string' ? mandat.uid : mandat.uid['#text'];
        const election = mandat.election;
        const mandature = mandat.mandature;

        //extraction du groupe parlementaire vu des mandats
        const groupeId = this.extractOrganeRef(mandat.organes);
        if (mandat.typeOrgane === 'GP' && groupeId) {
            this.groupesSet.add(groupeId);
        }

        const mandatObj = {
            uid,
            acteur_uid: acteurUid,
            legislature: parseInt(mandat.legislature) || 0,
            type_organe: mandat.typeOrgane || '',
            date_debut: mandat.dateDebut || '',
            date_fin: mandat.dateFin || null,
            date_publication: mandat.datePublication || null,
            preseance: parseInt(mandat.preseance) || 0,
            nomin_principale: parseInt(mandat.nominPrincipale) || 0,
            code_qualite: mandat.infosQualite?.codeQualite || '',
            lib_qualite: mandat.infosQualite?.libQualite || '',
            lib_qualite_sex: mandat.infosQualite?.libQualiteSex || '',
            organe_uid: groupeId,
            // Élection
            election_region: extractNilableValue(election?.lieu?.region),
            election_region_type: extractNilableValue(election?.lieu?.regionType),
            election_departement: extractNilableValue(election?.lieu?.departement),
            election_num_departement: extractNilableValue(election?.lieu?.numDepartement),
            election_num_circo: extractNilableValue(election?.lieu?.numCirco),
            election_cause_mandat: extractNilableValue(election?.causeMandat),
            election_ref_circonscription: extractNilableValue(election?.refCirconscription),

            // Mandature
            mandature_date_prise_fonction: extractNilableValue(mandature?.datePriseFonction),
            mandature_cause_fin: extractNilableValue(mandature?.causeFin),
            mandature_premiere_election:
                mandature?.premiereElection === '1' ||
                mandature?.premiereElection === true ||
                mandature?.premiereElection === 1
                    ? true
                    : mandature?.premiereElection != null ? false : null,
            mandature_place_hemicycle: extractNilableValue(mandature?.placeHemicycle),
            mandature_mandat_remplace_ref: extractNilableValue(mandature?.mandatRemplaceRef),

            legislature_snapshot: this.legislatureSnapshot,
        };

        this.mandats.push({...mandatObj, row_hash: computeRowHash(mandatObj)});

        // Suppléants
        if (mandat.suppleants?.suppleant) {
            const suppleants = Array.isArray(mandat.suppleants.suppleant)
                ? mandat.suppleants.suppleant
                : [mandat.suppleants.suppleant];

            for (const suppleant of suppleants) {
                if (!suppleant?.suppleantRef) continue;

                const suppleantObj = {
                    mandat_uid: uid,
                    suppleant_uid: suppleant.suppleantRef,
                    date_debut: suppleant.dateDebut || '',
                    date_fin: suppleant.dateFin || null,
                    legislature_snapshot: this.legislatureSnapshot,
                };

                this.mandatsSuppleants.push({...suppleantObj, row_hash: computeRowHash(suppleantObj)});
            }
        }
    }

    private extractOrganeRef(organes: any): string {
        if (!organes) return '';
        if (typeof organes.organeRef === 'string') return organes.organeRef;
        if (organes.organeRef?.['#text']) return organes.organeRef['#text'];
        if (Array.isArray(organes.organeRef) && organes.organeRef.length > 0) {
            return typeof organes.organeRef[0] === 'string'
                ? organes.organeRef[0]
                : organes.organeRef[0]['#text'] || '';
        }
        return '';
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
                    legislature_snapshot: this.legislatureSnapshot,
                };
                this.acteursAdressesPostales.push({...obj, row_hash: computeRowHash(obj)});
                break;
            }

            case 'AdresseMail_Type': {
                const obj = {
                    acteur_uid: acteurUid,
                    uid_adresse: adresse.uid || '',
                    type_code: adresse.type || null,
                    type_libelle: adresse.typeLibelle || null,
                    email: adresse.valElec || '',
                    legislature_snapshot: this.legislatureSnapshot,
                };
                this.acteursAdressesMails.push({...obj, row_hash: computeRowHash(obj)});
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
                    legislature_snapshot: this.legislatureSnapshot,
                };
                this.acteursReseauxSociaux.push({...obj, row_hash: computeRowHash(obj)});
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
                    legislature_snapshot: this.legislatureSnapshot,
                };
                this.acteursTelephones.push({...obj, row_hash: computeRowHash(obj)});
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