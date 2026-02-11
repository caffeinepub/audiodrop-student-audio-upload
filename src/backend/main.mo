import Array "mo:core/Array";
import List "mo:core/List";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Blob "mo:core/Blob";
import Principal "mo:core/Principal";

import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
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
    submittedBy : ?Principal; // Changed to optional
  };

  module Submission {
    public func compare(a : Submission, b : Submission) : Order.Order {
      Text.compare(a.studentId, b.studentId);
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

  // Admin-only: View individual submission details
  public query ({ caller }) func getSubmission(id : Nat) : async Submission {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view submission details");
    };
    switch (submissionMap.get(id)) {
      case (null) { Runtime.trap("Submission does not exist") };
      case (?submission) { submission };
    };
  };

  // Admin-only: List all submissions
  public query ({ caller }) func getAllSubmissions() : async [Submission] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list all submissions");
    };
    submissionMap.values().toArray().sort();
  };

  // User-only: Authenticated users can create submissions
  // This is the student-facing upload endpoint
  public shared ({ caller }) func createSubmission(id : Nat, studentId : Text, course : Text, assessment : Text, media : Storage.ExternalBlob, mediaType : MediaType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create submissions");
    };
    if (submissionMap.containsKey(id)) {
      Runtime.trap("Submission already exists");
    };
    let submission : Submission = {
      id;
      studentId;
      course;
      assessment;
      submittedAtUtc = Time.now();
      mediaType;
      media;
      submittedBy = ?caller;
    };
    submissionMap.add(id, submission);
  };

  // Admin-only: Delete submission
  public shared ({ caller }) func deleteSubmission(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete submissions");
    };
    switch (submissionMap.get(id)) {
      case (null) { Runtime.trap("Submission does not exist") };
      case (?submission) {
        // Remove the submission from the map
        submissionMap.remove(id);
        // Note: Media blob cleanup would be handled by the storage system
      };
    };
  };
};
