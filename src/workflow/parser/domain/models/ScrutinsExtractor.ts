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

export class ScrutinsExtractor implements IExtractor {
    private deputesSet = new Set<string>();
    private groupesSet = new Set<string>();
    private scrutins: Scrutin[] = [];
    private scrutinsGroupes: ScrutinGroupe[] = [];
    private votesDeputes: VoteDepute[] = [];
    private scrutinsAgregats: ScrutinAgregat[] = [];
    private scrutinsGroupesAgregats: ScrutinGroupeAgregat[] = [];
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
            scrutins: this.scrutins,
            scrutinsGroupes: this.scrutinsGroupes,
            votesDeputes: this.votesDeputes,
            scrutinsAgregats: this.scrutinsAgregats,
            scrutinsGroupesAgregats: this.scrutinsGroupesAgregats,
            groupes: Array.from(this.groupesSet).map(id => ({ id })),
            deputes: Array.from(this.deputesSet).map(id => ({ id }))
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

        // Extract scrutin
        this.extractScrutin(scrutin);

        // Extract aggregates
        if (scrutin.syntheseVote) {
            this.extractScrutinAgregats(scrutin);
        }

        // Extract groups and votes
        const ventilation = scrutin.ventilationVotes || scrutin.scrutins || scrutin.groupes;
        if (ventilation) {
            this.extractGroupesAndVotes(scrutin.uid, ventilation);
        }
    }

    private extractScrutin(scrutin: any): void {
        const scrutinData: Scrutin = {
            uid: scrutin.uid,
            numero: scrutin.numero || '',
            legislature: scrutin.legislature || '',
            date_scrutin: scrutin.dateScrutin || '',
            titre: scrutin.titre || scrutin.objet?.libelle || '',
            type_scrutin_code: scrutin.typeVote?.codeTypeVote || null,
            type_scrutin_libelle: scrutin.typeVote?.libelleTypeVote || null,
            type_majorite: scrutin.typeVote?.typeMajorite || null,
            resultat_code: scrutin.sort?.code || null,
            resultat_libelle: scrutin.sort?.libelle || null
        };
        this.scrutins.push(scrutinData);
    }

    private extractScrutinAgregats(scrutin: any): void {
        const agregats: ScrutinAgregat = {
            scrutin_uid: scrutin.uid,
            nombre_votants: parseInt(scrutin.syntheseVote.nombreVotants) || 0,
            suffrages_exprimes: parseInt(scrutin.syntheseVote.suffragesExprimes) || 0,
            suffrages_requis: parseInt(scrutin.syntheseVote.nbrSuffragesRequis) || 0,
            total_pour: parseInt(scrutin.syntheseVote.decompte?.pour) || 0,
            total_contre: parseInt(scrutin.syntheseVote.decompte?.contre) || 0,
            total_abstentions: parseInt(scrutin.syntheseVote.decompte?.abstentions) || 0,
            total_non_votants: parseInt(scrutin.syntheseVote.decompte?.nonVotants) || 0,
            total_non_votants_volontaires: parseInt(scrutin.syntheseVote.decompte?.nonVotantsVolontaires) || 0
        };
        this.scrutinsAgregats.push(agregats);
    }

    private extractGroupesAndVotes(scrutinUid: string, ventilation: any): void {
        const organe = ventilation.organe || ventilation;
        const groupsData = organe.groupes?.groupe || organe.groupe || [];
        const groupsArray = Array.isArray(groupsData) ? groupsData : [groupsData];

        for (const group of groupsArray) {
            if (!group || !group.organeRef) continue;

            // Register groupe
            this.groupesSet.add(group.organeRef);

            // Extract scrutin_groupe
            this.extractScrutinGroupe(scrutinUid, group);

            // Extract groupe aggregates
            if (group.vote?.decompteVoix) {
                this.extractScrutinGroupeAgregats(scrutinUid, group);
            }

            // Extract individual votes
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
        const scrutinGroupe: ScrutinGroupe = {
            scrutin_uid: scrutinUid,
            groupe_id: group.organeRef,
            nombre_membres: parseInt(group.nombreMembresGroupe) || 0,
            position_majoritaire: group.vote?.positionMajoritaire || ''
        };
        this.scrutinsGroupes.push(scrutinGroupe);
    }

    private extractScrutinGroupeAgregats(scrutinUid: string, group: any): void {
        const groupeAgregats: ScrutinGroupeAgregat = {
            scrutin_uid: scrutinUid,
            groupe_id: group.organeRef,
            pour: parseInt(group.vote.decompteVoix.pour) || 0,
            contre: parseInt(group.vote.decompteVoix.contre) || 0,
            abstentions: parseInt(group.vote.decompteVoix.abstentions) || 0,
            non_votants: parseInt(group.vote.decompteVoix.nonVotants) || 0,
            non_votants_volontaires: parseInt(group.vote.decompteVoix.nonVotantsVolontaires) || 0
        };
        this.scrutinsGroupesAgregats.push(groupeAgregats);
    }

    private extractVotes(scrutinUid: string, groupeId: string, votesData: any, position: string): void {
        if (!votesData) return;

        const voters = votesData.votant || [];
        const votersArray = Array.isArray(voters) ? voters : [voters];

        for (const voter of votersArray) {
            if (!voter.acteurRef) continue;

            // Register depute
            this.deputesSet.add(voter.acteurRef);

            const vote: VoteDepute = {
                scrutin_uid: scrutinUid,
                depute_id: voter.acteurRef,
                groupe_id: groupeId,
                mandat_ref: voter.mandatRef || '',
                position: position,
                cause_position: voter.causePositionVote || null,
                par_delegation: voter.parDelegation === 'true' || voter.parDelegation === true ? true : null
            };
            this.votesDeputes.push(vote);
        }
    }
}