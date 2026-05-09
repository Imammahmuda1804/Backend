export declare const ROLES: {
    readonly ADMIN: "ADMIN";
    readonly USER: "USER";
};
export type RoleType = (typeof ROLES)[keyof typeof ROLES];
