// This file exports the IDL factory for the backend canister

import { IDL } from '@dfinity/candid';

export const idlFactory = ({ IDL }: { IDL: any }) => {
  const MediaType = IDL.Variant({ 'audio': IDL.Null, 'video': IDL.Null });
  const BlobMetadata = IDL.Record({
    'mimeType': IDL.Text,
    'filename': IDL.Text,
    'sizeBytes': IDL.Nat,
  });
  const Time = IDL.Int;
  const ExternalBlob = IDL.Text;
  const Submission = IDL.Record({
    'id': IDL.Nat,
    'media': ExternalBlob,
    'downloadFilename': IDL.Text,
    'studentId': IDL.Text,
    'originalFilename': IDL.Text,
    'assessment': IDL.Text,
    'metadata': BlobMetadata,
    'submittedBy': IDL.Opt(IDL.Principal),
    'mediaType': MediaType,
    'course': IDL.Text,
    'submittedAtUtc': Time,
  });
  const ExistingSubmission = IDL.Record({
    'id': IDL.Nat,
    'studentId': IDL.Text,
    'assessment': IDL.Text,
    'mediaType': MediaType,
    'course': IDL.Text,
  });
  const DownloadResponse = IDL.Variant({
    'ok': IDL.Record({
      'originalFileName': IDL.Text,
      'data': ExternalBlob,
      'fileName': IDL.Text,
      'fileType': IDL.Text,
    }),
    'forbidden': IDL.Text,
    'notFound': IDL.Text,
  });
  const UserProfile = IDL.Record({
    'name': IDL.Text,
    'email': IDL.Opt(IDL.Text),
  });
  const UserRole = IDL.Variant({
    'admin': IDL.Null,
    'user': IDL.Null,
    'guest': IDL.Null,
  });

  return IDL.Service({
    'adminCreateSubmission': IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, ExternalBlob, BlobMetadata, MediaType],
      [],
      [],
    ),
    'adminDeleteSubmissionById': IDL.Func([IDL.Nat], [], []),
    'adminDeleteSubmissionByStudentId': IDL.Func([IDL.Text, IDL.Text], [], []),
    'adminDownloadSubmission': IDL.Func([IDL.Nat], [DownloadResponse], ['query']),
    'adminSubmissions': IDL.Func([IDL.Text], [IDL.Vec(ExistingSubmission)], ['query']),
    'assignCallerUserRole': IDL.Func([IDL.Principal, UserRole], [], []),
    'createSubmission': IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, ExternalBlob, BlobMetadata, MediaType],
      [],
      [],
    ),
    'getAllSubmissions': IDL.Func([], [IDL.Vec(Submission)], ['query']),
    'getCallerUserProfile': IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'getCallerUserRole': IDL.Func([], [UserRole], ['query']),
    'getServerTime': IDL.Func([], [IDL.Opt(Time)], []),
    'getUserProfile': IDL.Func([IDL.Principal], [IDL.Opt(UserProfile)], ['query']),
    'getVersion': IDL.Func([], [IDL.Text], ['query']),
    'health': IDL.Func([], [IDL.Text], ['query']),
    'isCallerAdmin': IDL.Func([], [IDL.Bool], ['query']),
    'listSubmissions': IDL.Func([], [IDL.Vec(Submission)], ['query']),
    'saveCallerUserProfile': IDL.Func([UserProfile], [], []),
  });
};
