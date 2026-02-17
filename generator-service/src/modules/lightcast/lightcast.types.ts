export interface ILightcastAuthResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
}

export interface ILightcastSkill {
    id: string;
    name: string;
    type: string;
    infoUrl: string;
}

export interface ILightcastSkillResponse {
    data: ILightcastSkill[];
}
