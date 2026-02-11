import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export interface Submission {
    id: bigint;
    media: ExternalBlob;
    studentId: string;
    assessment: string;
    submittedBy?: Principal;
    mediaType: MediaType;
    course: string;
    submittedAtUtc: Time;
}
export interface UserProfile {
    name: string;
    email?: string;
}
export enum MediaType {
    audio = "audio",
    video = "video"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createSubmission(id: bigint, studentId: string, course: string, assessment: string, media: ExternalBlob, mediaType: MediaType): Promise<void>;
    deleteSubmission(id: bigint): Promise<void>;
    getAllSubmissions(): Promise<Array<Submission>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getSubmission(id: bigint): Promise<Submission>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
