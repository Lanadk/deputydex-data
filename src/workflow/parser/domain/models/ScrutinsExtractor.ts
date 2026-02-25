import * as fs from 'fs';
import * as path from 'path';
import {
    Depute,
    GroupeParlementaire,
    Scrutin,
    ScrutinAgregat,
    VoteDepute,
    ScrutinGroupe,
    ScrutinGroupeAgregat
} from './/entities/Scrutin.entity';
import {IExtractor} from "../../infrastructure/IExtractor";
import {computeRowHash} from "../../../../utils/hash";

export class ScrutinsExtractor implements IExtractor {
    private deputesSet = new Set<string>();
    private groupesSet = new Set<string>();
    private scrutins: Scrutin[] = [];
    private scrutinsGroupes: ScrutinGroupe[] = [];
    private votesDeputes: VoteDepute[] = [];
    private scrutinsAgregats: ScrutinAgregat[] = [];
    private scrutinsGroupesAgregats: ScrutinGroupeAgregat[] = [];
    private errors: Array<{ file: string; error: string }> = [];

    constructor(private readonly legislature_snapshot: number) {
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
            scrutins: this.scrutins,
            scrutinsGroupes: this.scrutinsGroupes,
            votesDeputes: this.votesDeputes,
            scrutinsAgregats: this.scrutinsAgregats,
            scrutinsGroupesAgregats: this.scrutinsGroupesAgregats,
            groupes: Array.from(this.groupesSet).map(id => {
                const obj = { id, legislature_snapshot: this.legislature_snapshot };
                return { ...obj, row_hash: computeRowHash(obj) };
            }),
            deputes: Array.from(this.deputesSet).map(id => {
                const obj = { id, legislature_snapshot: this.legislature_snapshot };
                return { ...obj, row_hash: computeRowHash(obj) };
            })
        };
    }

    getErrors(): Array<{ file: string; error: string }> {
        return this.errors;
    }

    private extractData(data: any): void {
        const scrutin = data.scrutin || data;

        if (!scrutin.uid) {
            throw new Error('Missing uid');
        }

        this.extractScrutin(scrutin);

        if (scrutin.syntheseVote) {
            this.extractScrutinAgregats(scrutin);
        }

        const ventilation = scrutin.ventilationVotes || scrutin.scrutins || scrutin.groupes;
        if (ventilation) {
            this.extractGroupesAndVotes(scrutin.uid, ventilation);
        }
    }

    private extractScrutin(scrutin: any): void {
        const scrutinData = {
            uid: scrutin.uid,
            numero: scrutin.numero || '',
            legislature: scrutin.legislature || '',
            date_scrutin: scrutin.dateScrutin || '',
            titre: scrutin.titre || scrutin.objet?.libelle || '',
            type_scrutin_code: scrutin.typeVote?.codeTypeVote || null,
            type_scrutin_libelle: scrutin.typeVote?.libelleTypeVote || null,
            type_majorite: scrutin.typeVote?.typeMajorite || null,
            resultat_code: scrutin.sort?.code || null,
            resultat_libelle: scrutin.sort?.libelle || null,
            legislature_snapshot: this.legislature_snapshot,
        };
        this.scrutins.push({...scrutinData, row_hash: computeRowHash(scrutinData)});
    }

    private extractScrutinAgregats(scrutin: any): void {
        const agregatsData = {
            scrutin_uid: scrutin.uid,
            nombre_votants: parseInt(scrutin.syntheseVote.nombreVotants) || 0,
            suffrages_exprimes: parseInt(scrutin.syntheseVote.suffragesExprimes) || 0,
            suffrages_requis: parseInt(scrutin.syntheseVote.nbrSuffragesRequis) || 0,
            total_pour: parseInt(scrutin.syntheseVote.decompte?.pour) || 0,
            total_contre: parseInt(scrutin.syntheseVote.decompte?.contre) || 0,
            total_abstentions: parseInt(scrutin.syntheseVote.decompte?.abstentions) || 0,
            total_non_votants: parseInt(scrutin.syntheseVote.decompte?.nonVotants) || 0,
            total_non_votants_volontaires: parseInt(scrutin.syntheseVote.decompte?.nonVotantsVolontaires) || 0,
            legislature_snapshot: this.legislature_snapshot,
        };
        this.scrutinsAgregats.push({...agregatsData, row_hash: computeRowHash(agregatsData)});
    }

    private extractGroupesAndVotes(scrutinUid: string, ventilation: any): void {
        const organe = ventilation.organe || ventilation;
        const groupsData = organe.groupes?.groupe || organe.groupe || [];
        const groupsArray = Array.isArray(groupsData) ? groupsData : [groupsData];

        for (const group of groupsArray) {
            if (!group || !group.organeRef) continue;

            this.groupesSet.add(group.organeRef);
            this.extractScrutinGroupe(scrutinUid, group);

            if (group.vote?.decompteVoix) {
                this.extractScrutinGroupeAgregats(scrutinUid, group);
            }

            const decompteNominatif = group.vote?.decompteNominatif;
            if (decompteNominatif) {
                this.extractVotes(scrutinUid, group.organeRef, decompteNominatif.pours, 'pour');
                this.extractVotes(scrutinUid, group.organeRef, decompteNominatif.contres, 'contre');
                this.extractVotes(scrutinUid, group.organeRef, decompteNominatif.abstentions, 'abstention');
                this.extractVotes(scrutinUid, group.organeRef, decompteNominatif.nonVotants, 'non_votant');
            }
        }
    }

    private extractScrutinGroupe(scrutinUid: string, group: any): void {
        const scrutinGroupeData = {
            scrutin_uid: scrutinUid,
            groupe_id: group.organeRef,
            groupe_legislature: this.legislature_snapshot,
            nombre_membres: parseInt(group.nombreMembresGroupe) || 0,
            position_majoritaire: group.vote?.positionMajoritaire || '',
            legislature_snapshot: this.legislature_snapshot,
        };
        this.scrutinsGroupes.push({...scrutinGroupeData, row_hash: computeRowHash(scrutinGroupeData)});
    }

    private extractScrutinGroupeAgregats(scrutinUid: string, group: any): void {
        const groupeAgregatsData = {
            scrutin_uid: scrutinUid,
            groupe_id: group.organeRef,
            groupe_legislature: this.legislature_snapshot,
            pour: parseInt(group.vote.decompteVoix.pour) || 0,
            contre: parseInt(group.vote.decompteVoix.contre) || 0,
            abstentions: parseInt(group.vote.decompteVoix.abstentions) || 0,
            non_votants: parseInt(group.vote.decompteVoix.nonVotants) || 0,
            non_votants_volontaires: parseInt(group.vote.decompteVoix.nonVotantsVolontaires) || 0,
            legislature_snapshot: this.legislature_snapshot,
        };
        this.scrutinsGroupesAgregats.push({...groupeAgregatsData, row_hash: computeRowHash(groupeAgregatsData)});
    }

    private extractVotes(scrutinUid: string, groupeId: string, votesData: any, position: string): void {
        if (!votesData) return;

        const voters = votesData.votant || [];
        const votersArray = Array.isArray(voters) ? voters : [voters];

        for (const voter of votersArray) {
            if (!voter.acteurRef) continue;

            this.deputesSet.add(voter.acteurRef);

            const voteData = {
                scrutin_uid: scrutinUid,
                depute_id: voter.acteurRef,
                groupe_id: groupeId,
                groupe_legislature: this.legislature_snapshot,
                mandat_ref: voter.mandatRef || '',
                position: position,
                cause_position: voter.causePositionVote || null,
                par_delegation: voter.parDelegation === 'true' || voter.parDelegation === true ? true : null,
                legislature_snapshot: this.legislature_snapshot,
            };
            this.votesDeputes.push({...voteData, row_hash: computeRowHash(voteData)});
        }
    }
}