import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  public type MediaType = {
    #audio;
    #video;
  };

  public type Submission = {
    id : Nat;
    studentId : Text;
    course : Text;
    assessment : Text;
    submittedAtUtc : Time.Time;
    media : Storage.ExternalBlob;
    mediaType : MediaType;
    submittedBy : ?Principal;
  };

  module Submission {
    public func compare(a : Submission, b : Submission) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  public type UserProfile = {
    name : Text;
    email : ?Text;
  };

  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  let submissionMap = Map.empty<Nat, Submission>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextSubmissionId : Nat = 0;

  public func getServerTime() : async ?Time.Time {
    ?Time.now();
  };

  // User Profile Management (required by frontend)
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

  // Submission Management
  public query ({ caller }) func userHasSubmission(studentId : Text, assessment : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check submissions");
    };
    submissionMap.values().any(
      func(submission) {
        submission.studentId == studentId and submission.assessment == assessment;
      }
    );
  };

  public query ({ caller }) func getStudentIdBySubmission(id : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query submission ownership");
    };
    switch (submissionMap.get(id)) {
      case (null) { Runtime.trap("Submission does not exist") };
      case (?submission) { submission.studentId };
    };
  };

  // Admin Gateway: All admin-only public endpoints now require admin
  public query ({ caller }) func getSubmission(id : Nat) : async Submission {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view submission details");
    };
    switch (submissionMap.get(id)) {
      case (null) { Runtime.trap("Submission does not exist") };
      case (?submission) { submission };
    };
  };

  public query ({ caller }) func getAllSubmissions() : async [Submission] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list all submissions");
    };
    submissionMap.values().toArray().sort();
  };

  public shared ({ caller }) func createSubmission(studentId : Text, course : Text, assessment : Text, media : Storage.ExternalBlob, mediaType : MediaType) : async () {
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
      submittedBy = ?caller;
    };
    submissionMap.add(nextSubmissionId, submission);
    nextSubmissionId += 1;
  };

  public shared ({ caller }) func deleteSubmissionById(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete submissions by id");
    };
    switch (submissionMap.get(id)) {
      case (null) { Runtime.trap("Submission does not exist") };
      case (?submission) {
        submissionMap.remove(id);
      };
    };
  };

  public shared ({ caller }) func deleteSubmissionByStudentId(studentId : Text, assessment : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete submissions by id");
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
};
