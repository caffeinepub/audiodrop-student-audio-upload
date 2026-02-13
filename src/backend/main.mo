import Array "mo:core/Array";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Time "mo:core/Time";

import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
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

  public type SubmissionIdInfo = {
    id : Nat;
    studentId : Text;
    assessment : Text;
  };

  public type SubmissionInfo = {
    studentId : Text;
    assessment : Text;
    mediaType : MediaType;
    course : Text;
  };

  public type SubmissionIdAndMedia = {
    id : Nat;
    media : Storage.ExternalBlob;
    mediaType : MediaType;
  };

  public type ExistingSubmission = {
    id : Nat;
    studentId : Text;
    assessment : Text;
    mediaType : MediaType;
    course : Text;
  };

  public type UserProfile = {
    name : Text;
    email : ?Text;
  };

  public type DownloadResponse = {
    #ok : {
      data : Storage.ExternalBlob;
      fileName : Text;
      fileType : Text;
      originalFileName : Text;
    };
    #notFound : Text;
    #forbidden : Text;
  };

  public type HealthStatus = {
    backendVersion : Text;
    backendStatus : BackendStatus;
  };

  public type BackendStatus = {
    #online;
    #offline;
    #degraded;
  };

  module Submission {
    public func compare(a : Submission, b : Submission) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  func getLastElement<T>(arr : [T]) : ?T {
    if (arr.isEmpty()) {
      null;
    } else {
      ?arr[arr.size() - 1];
    };
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  let submissionMap = Map.empty<Nat, Submission>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextSubmissionId : Nat = 0;

  // Health check endpoint for front-end - accessible to all including guests
  public query ({ caller }) func health() : async Text {
    "ok";
  };

  // Alternative health check name for compatibility
  public query ({ caller }) func getVersion() : async Text {
    "v1.3";
  };

  public func getServerTime() : async ?Time.Time {
    ?Time.now();
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func adminSubmissions(studentId : Text) : async [ExistingSubmission] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view submissions");
    };
    submissionMap.values().toArray().filter(
      func(submission) { submission.studentId == studentId }
    ).map<Submission, ExistingSubmission>(
      func(submission) {
        {
          id = submission.id;
          studentId = submission.studentId;
          assessment = submission.assessment;
          mediaType = submission.mediaType;
          course = submission.course;
        };
      }
    );
  };

  public query ({ caller }) func getAllSubmissions() : async [Submission] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all submissions");
    };
    submissionMap.values().toArray().sort();
  };

  public query ({ caller }) func listSubmissions() : async [Submission] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list submissions");
    };
    submissionMap.values().toArray().sort();
  };

  public query ({ caller }) func adminDownloadSubmission(id : Nat) : async DownloadResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      return #forbidden("Unauthorized: Only admins can download submissions");
    };

    switch (submissionMap.get(id)) {
      case (null) {
        #notFound("Submission not found");
      };
      case (?submission) {
        #ok({
          data = submission.media;
          fileName = submission.downloadFilename;
          fileType = "audio/mpeg";
          originalFileName = submission.originalFilename;
        });
      };
    };
  };

  public shared ({ caller }) func adminCreateSubmission(studentId : Text, course : Text, assessment : Text, media : Storage.ExternalBlob, metadata : BlobMetadata, mediaType : MediaType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create submissions");
    };
    if (submissionMap.values().any(func(submission) { submission.studentId == studentId })) {
      Runtime.trap("Submission for this student already exists");
    };
    let submission : Submission = {
      id = nextSubmissionId;
      studentId;
      course;
      assessment;
      submittedAtUtc = Time.now();
      mediaType;
      media;
      metadata = {
        filename = metadata.filename;
        mimeType = "audio/mpeg";
        sizeBytes = metadata.sizeBytes;
      };
      submittedBy = ?caller;
      originalFilename = metadata.filename;
      downloadFilename = nextSubmissionId.toText().concat(".mp3");
    };
    submissionMap.add(nextSubmissionId, submission);
    nextSubmissionId += 1;
  };

  public shared ({ caller }) func adminDeleteSubmissionById(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete submissions");
    };
    switch (submissionMap.get(id)) {
      case (null) { Runtime.trap("Submission does not exist") };
      case (?submission) {
        submissionMap.remove(id);
      };
    };
  };

  public shared ({ caller }) func adminDeleteSubmissionByStudentId(studentId : Text, assessment : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete submissions");
    };
    let submissions = submissionMap.entries().toArray();
    if (submissions.size() == 0) {
      Runtime.trap("Submission does not exist");
    };
    for ((id, submission) in submissions.values()) {
      if (submission.studentId == studentId and submission.assessment == assessment) {
        submissionMap.remove(id);
        return;
      };
    };
    Runtime.trap("Submission does not exist");
  };

  public shared ({ caller }) func createSubmission(studentId : Text, course : Text, assessment : Text, media : Storage.ExternalBlob, metadata : BlobMetadata, mediaType : MediaType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create submissions");
    };
    if (submissionMap.values().any(func(submission) { submission.studentId == studentId })) {
      Runtime.trap("Submission for this student already exists");
    };
    let submission : Submission = {
      id = nextSubmissionId;
      studentId;
      course;
      assessment;
      submittedAtUtc = Time.now();
      mediaType;
      media;
      metadata = {
        filename = metadata.filename;
        mimeType = "audio/mpeg";
        sizeBytes = metadata.sizeBytes;
      };
      submittedBy = ?caller;
      originalFilename = metadata.filename;
      downloadFilename = nextSubmissionId.toText().concat(".mp3");
    };
    submissionMap.add(nextSubmissionId, submission);
    nextSubmissionId += 1;
  };
};
