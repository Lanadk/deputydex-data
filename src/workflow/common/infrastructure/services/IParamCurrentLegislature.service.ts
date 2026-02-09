export interface CurrentLegislatureWithRelation {
    legislatureId: number;
    number: number;
    updatedAt: Date;
    legislature: {
        id: number;
        number: number;
        startDate: Date | null;
        endDate: Date | null;
        createdAt: Date;
        updatedAt: Date;
    };
}

export interface IParamCurrentLegislatureService {
    getCurrentLegislature(): Promise<CurrentLegislatureWithRelation | null>;
    getCurrentLegislatureNumber(): Promise<number | null>;
    isCurrentLegislature(legislatureNumber: number): Promise<boolean>;
    isArchiveLegislature(legislatureNumber: number): Promise<boolean>;
}