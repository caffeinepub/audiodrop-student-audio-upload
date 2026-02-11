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
export interface SubmissionIdInfo {
    id: bigint;
    studentId: string;
    assessment: string;
}
export type Time = bigint;
export interface ExistingSubmission {
    id: bigint;
    studentId: string;
    assessment: string;
    mediaType: MediaType;
    course: string;
}
export interface SubmissionIdAndMedia {
    id: bigint;
    media: ExternalBlob;
    mediaType: MediaType;
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
export interface SubmissionInfo {
    studentId: string;
    assessment: string;
    mediaType: MediaType;
    course: string;
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
    adminCheckAndGetSubmissionId(id: bigint): Promise<SubmissionIdAndMedia | null>;
    adminCreateSubmission(studentId: string, course: string, assessment: string, media: ExternalBlob, mediaType: MediaType): Promise<void>;
    adminDeleteSubmissionById(id: bigint): Promise<void>;
    adminDeleteSubmissionByStudentId(studentId: string, assessment: string): Promise<void>;
    adminGetSubmission(id: bigint): Promise<Submission>;
    adminSubmissions(studentId: string): Promise<Array<ExistingSubmission>>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkAndGetSubmissionId(studentId: string, assessment: string): Promise<bigint>;
    checkAndGetSubmissionIdAdmin(studentId: string, assessment: string): Promise<Submission | null>;
    checkHasSubmissionId(studentId: string, assessment: string): Promise<boolean>;
    createSubmission(studentId: string, course: string, assessment: string, media: ExternalBlob, mediaType: MediaType): Promise<void>;
    dataCheckAndGetSubmissionId(studentId: string, assessment: string): Promise<Submission | null>;
    deleteSubmissionById(id: bigint): Promise<void>;
    deleteSubmissionByStudentId(studentId: string, assessment: string): Promise<void>;
    getAllSubmissions(): Promise<Array<Submission>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMediaUrlOfSubmission(submissionId: bigint): Promise<ExternalBlob>;
    getServerTime(): Promise<Time | null>;
    getStudentIdBySubmission(id: bigint): Promise<string>;
    getSubmissionId(): Promise<Array<bigint>>;
    getSubmissionIdFromStudentId(studentId: string, assessment: string): Promise<bigint>;
    getSubmissionIdInfoByStudentId(studentId: string): Promise<Array<SubmissionIdInfo>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    usersubmissionInfo(studentId: string): Promise<SubmissionInfo | null>;
}
