import * as fs from 'fs';
import * as path from 'path';
import { Mandat, MandatSuppleant } from "./entities/Mandat.entity";
import { IExtractor } from "../../infrastructure/IExtractor";

export class MandatsExtractor implements IExtractor {
    private mandats: Mandat[] = [];
    private mandatsSuppleants: MandatSuppleant[] = [];
    private errors: Array<{ file: string; error: string }> = [];

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
            mandats: this.mandats,
            mandatsSuppleants: this.mandatsSuppleants
        };
    }

    getErrors(): Array<{ file: string; error: string }> {
        return this.errors;
    }

    private extractData(data: any): void {
        const mandat = data.mandat || data;

        if (!mandat.uid) {
            throw new Error('Missing uid');
        }

        const uid = typeof mandat.uid === 'string' ? mandat.uid : mandat.uid['#text'];
        const acteurRef = typeof mandat.acteurRef === 'string' ? mandat.acteurRef : mandat.acteurRef?.['#text'];

        // Élection
        const election = mandat.election;

        // Mandature
        const mandature = mandat.mandature;

        // Extraire le mandat principal
        const mandatData: Mandat = {
            uid,
            acteur_uid: acteurRef || '',
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
            organe_uid: this.extractOrganeRef(mandat.organes),

            // Élection
            election_region: election?.lieu?.region || null,
            election_region_type: election?.lieu?.regionType || null,
            election_departement: election?.lieu?.departement || null,
            election_num_departement: election?.lieu?.numDepartement || null,
            election_num_circo: election?.lieu?.numCirco || null,
            election_cause_mandat: election?.causeMandat || null,
            election_ref_circonscription: election?.refCirconscription || null,

            // Mandature
            mandature_date_prise_fonction: mandature?.datePriseFonction || null,
            mandature_cause_fin: mandature?.causeFin || null,
            mandature_premiere_election:
                mandature?.premiereElection === '1' ||
                mandature?.premiereElection === true ||
                mandature?.premiereElection === 1,
            mandature_place_hemicycle: mandature?.placeHemicycle || null,
            mandature_mandat_remplace_ref: mandature?.mandatRemplaceRef || null
        };

        this.mandats.push(mandatData);

        // Extraire les suppléants (peut être 0, 1 ou plusieurs)
        this.extractSuppleants(uid, mandat.suppleants);
    }

    private extractSuppleants(mandatUid: string, suppleants: any): void {
        if (!suppleants?.suppleant) return;

        // Normaliser en array
        const suppleantsList = Array.isArray(suppleants.suppleant)
            ? suppleants.suppleant
            : [suppleants.suppleant];

        for (const suppleant of suppleantsList) {
            if (!suppleant.suppleantRef) continue;

            this.mandatsSuppleants.push({
                mandat_uid: mandatUid,
                suppleant_uid: suppleant.suppleantRef,
                date_debut: suppleant.dateDebut || '',
                date_fin: suppleant.dateFin || null
            });
        }
    }

    private extractOrganeRef(organes: any): string {
        if (!organes) return '';

        // Cas 1 : organeRef direct
        if (typeof organes.organeRef === 'string') {
            return organes.organeRef;
        }

        // Cas 2 : organeRef avec #text
        if (organes.organeRef?.['#text']) {
            return organes.organeRef['#text'];
        }

        // Cas 3 : Array d'organeRef (prendre le premier)
        if (Array.isArray(organes.organeRef) && organes.organeRef.length > 0) {
            return typeof organes.organeRef[0] === 'string'
                ? organes.organeRef[0]
                : organes.organeRef[0]['#text'] || '';
        }

        return '';
    }
}