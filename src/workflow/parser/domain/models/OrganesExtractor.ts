import * as fs from 'fs';
import * as path from 'path';
import {Organe} from "./entities/Organe.entity";
import {IExtractor} from "../../infrastructure/IExtractor";
import {computeRowHash} from "../../../../utils/hash";
import {extractNilableValue, toIntOrNull} from "../../infrastructure/impl/xml-nil.utils";

/**
 * Extrait les organes (fichiers `acteurs/json/organe/*.json` du jeu AMO) :
 * commissions, groupes, ministères, gouvernements… Les mandats y font
 * référence par `organe_uid`.
 */
export class OrganesExtractor implements IExtractor {
    private organes: Organe[] = [];
    private errors: Array<{ file: string; error: string }> = [];

    constructor(private readonly legislatureSnapshot: number) {
    }

    async processFile(filePath: string): Promise<void> {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            this.extractData(JSON.parse(content));
        } catch (error) {
            this.errors.push({
                file: path.basename(filePath),
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    getTables(): Record<string, any[]> {
        return {organes: this.organes};
    }

    getErrors(): Array<{ file: string; error: string }> {
        return this.errors;
    }

    clearTables(): void {
        this.organes = [];
    }

    private extractData(data: any): void {
        const organe = data.organe || data;
        const uid = extractNilableValue(organe.uid);
        if (!uid) throw new Error('Missing uid');
        const codeType = extractNilableValue(organe.codeType);
        if (!codeType) throw new Error(`Missing codeType for ${uid}`);

        const organeObj = {
            uid,
            code_type: codeType,
            libelle: extractNilableValue(organe.libelle),
            libelle_edition: extractNilableValue(organe.libelleEdition),
            libelle_abrege: extractNilableValue(organe.libelleAbrege),
            libelle_abrev: extractNilableValue(organe.libelleAbrev),
            date_debut: extractNilableValue(organe.viMoDe?.dateDebut),
            date_fin: extractNilableValue(organe.viMoDe?.dateFin),
            organe_parent_uid: extractNilableValue(organe.organeParent),
            organe_precedent_uid: extractNilableValue(organe.organePrecedentRef),
            preseance: toIntOrNull(organe.preseance),
            legislature: toIntOrNull(organe.legislature),
            legislature_snapshot: this.legislatureSnapshot,
        };
        this.organes.push({...organeObj, row_hash: computeRowHash(organeObj)});
    }
}
