import {
    CurrentLegislatureWithRelation,
    IParamCurrentLegislatureRepository
} from "../IParamCurrentLegislature.repository";
import {prisma} from "../../../../../../../prisma/prisma";

export class ParamCurrentLegislatureRepository implements IParamCurrentLegislatureRepository {
    async getCurrentLegislature(): Promise<CurrentLegislatureWithRelation | null> {
        return prisma.paramCurrentLegislature.findFirst({
            include: {
                legislature: true
            }
        });
    }

    async getCurrentLegislatureNumber(): Promise<number | null> {
        const current = await this.getCurrentLegislature();
        return current?.number || null;
    }

    async isCurrentLegislature(legislatureNumber: number): Promise<boolean> {
        const currentNumber = await this.getCurrentLegislatureNumber();
        return currentNumber === legislatureNumber;
    }
}