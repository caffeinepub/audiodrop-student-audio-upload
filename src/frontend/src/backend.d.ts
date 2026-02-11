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
export type DownloadResponse = {
    __kind__: "ok";
    ok: {
        originalFileName: string;
        data: ExternalBlob;
        fileName: string;
        fileType: string;
    };
} | {
    __kind__: "forbidden";
    forbidden: string;
} | {
    __kind__: "notFound";
    notFound: string;
};
export type AdminLoginResponse = {
    __kind__: "ok";
    ok: boolean;
} | {
    __kind__: "error";
    error: string;
};
export interface AdminLoginRequest {
    username: string;
    password: string;
}
export type Time = bigint;
export interface ExistingSubmission {
    id: bigint;
    studentId: string;
    assessment: string;
    mediaType: MediaType;
    course: string;
}
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
    adminCreateSubmission(studentId: string, course: string, assessment: string, media: ExternalBlob, mediaType: MediaType): Promise<void>;
    adminDeleteSubmissionById(id: bigint): Promise<void>;
    adminDeleteSubmissionByStudentId(studentId: string, assessment: string): Promise<void>;
    adminDownloadSubmission(id: bigint): Promise<DownloadResponse>;
    adminLogin(body: AdminLoginRequest): Promise<AdminLoginResponse>;
    adminLogout(): Promise<void>;
    adminSubmissions(studentId: string): Promise<Array<ExistingSubmission>>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createSubmission(studentId: string, course: string, assessment: string, media: ExternalBlob, mediaType: MediaType): Promise<void>;
    getAllSubmissions(): Promise<Array<Submission>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getServerTime(): Promise<Time | null>;
    getSessionRole(): Promise<string | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listSubmissions(): Promise<Array<Submission>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
