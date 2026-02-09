import {CurrentLegislatureWithRelation, IParamCurrentLegislatureService} from "../IParamCurrentLegislature.service";
import {IParamCurrentLegislatureRepository} from "../../repositories/IParamCurrentLegislature.repository";
import {ParamCurrentLegislatureRepository} from "../../repositories/impl/ParamCurrentLegislatue.repository";

export class ParamCurrentLegislatureService implements IParamCurrentLegislatureService {
    private repository: IParamCurrentLegislatureRepository;

    constructor(repository?: IParamCurrentLegislatureRepository) {
        this.repository = repository || new ParamCurrentLegislatureRepository();
    }

    async getCurrentLegislature(): Promise<CurrentLegislatureWithRelation | null> {
        return this.repository.getCurrentLegislature();
    }

    async getCurrentLegislatureNumber(): Promise<number | null> {
        return this.repository.getCurrentLegislatureNumber();
    }

    async isCurrentLegislature(legislatureNumber: number): Promise<boolean> {
        return this.repository.isCurrentLegislature(legislatureNumber);
    }

    async isArchiveLegislature(legislatureNumber: number): Promise<boolean> {
        const isCurrent = await this.isCurrentLegislature(legislatureNumber);
        return !isCurrent;
    }
}