export interface IESCOSearchResult {
    className: string;
    classId: string;
    uri: string;
    title: string;
    score: number;
}

export interface IESCOOccupation {
    className: string;
    classId: string;
    uri: string;
    title: string;
    description: {
        en: {
            literal: string;
        };
    };
    _links: {
        hasEssentialSkill: IESCOLink[];
        hasOptionalSkill: IESCOLink[];
    };
}

export interface IESCOLink {
    uri: string;
    title: string;
    href: string;
}

export interface IESCOSkill {
    title: string;
    uri: string;
    type: 'essential' | 'optional';
}
