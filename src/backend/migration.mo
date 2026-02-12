import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import Time "mo:core/Time";

module {
  type OldActor = {
    submissionMap : Map.Map<Nat, Submission>;
    userProfiles : Map.Map<Principal, UserProfile>;
    nextSubmissionId : Nat;
    sessions : Map.Map<Principal, Session>;
  };

  type NewActor = {
    submissionMap : Map.Map<Nat, Submission>;
    userProfiles : Map.Map<Principal, UserProfile>;
    nextSubmissionId : Nat;
  };

  public type MediaType = {
    #audio;
    #video;
  };

  public type BlobMetadata = {
    filename : Text;
    mimeType : Text;
    sizeBytes : Nat;
  };

  public type Submission = {
    id : Nat;
    studentId : Text;
    course : Text;
    assessment : Text;
    submittedAtUtc : Time.Time;
    media : Storage.ExternalBlob;
    mediaType : MediaType;
    metadata : BlobMetadata;
    submittedBy : ?Principal;
    originalFilename : Text;
    downloadFilename : Text;
  };

  public type UserProfile = {
    name : Text;
    email : ?Text;
  };

  public type Session = {
    role : ?Text;
    createdAt : Time.Time;
  };

  // Migration function drops sessions state.
  public func run(old : OldActor) : NewActor {
    {
      submissionMap = old.submissionMap;
      userProfiles = old.userProfiles;
      nextSubmissionId = old.nextSubmissionId;
    };
  };
};
