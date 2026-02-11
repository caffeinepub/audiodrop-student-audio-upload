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

  module Submission {
    public func compare(a : Submission, b : Submission) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  // Helper function to safely get the last element of an array
  func getLastElement<T>(arr : [T]) : ?T {
    if (arr.isEmpty()) {
      null;
    } else {
      ?arr[arr.size() - 1];
    };
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

  public query ({ caller }) func checkHasSubmissionId(studentId : Text, assessment : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can check submission existence");
    };
    if (submissionMap.values().any(
      func(submission) {
        submission.studentId == studentId and submission.assessment == assessment;
      }
    )) {
      return true;
    };
    false;
  };

  public query ({ caller }) func getSubmissionIdFromStudentId(studentId : Text, assessment : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access submission IDs");
    };
    for (submission in submissionMap.values()) {
      if (submission.studentId == studentId and submission.assessment == assessment) {
        return submission.id;
      };
    };
    Runtime.trap("Submission does not exist");
  };

  public query ({ caller }) func checkAndGetSubmissionId(studentId : Text, assessment : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access submission IDs");
    };
    for (submission in submissionMap.values()) {
      if (submission.studentId == studentId and submission.assessment == assessment) {
        return submission.id;
      };
    };
    Runtime.trap("Submission does not exist");
  };

  public query ({ caller }) func getSubmissionIdInfoByStudentId(studentId : Text) : async [SubmissionIdInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access submission information");
    };
    submissionMap.values().toArray().filter(
      func(submission) { submission.studentId == studentId }
    ).map<Submission, SubmissionIdInfo>(
      func(submission) {
        {
          id = submission.id;
          studentId = submission.studentId;
          assessment = submission.assessment;
        };
      }
    );
  };

  public query ({ caller }) func usersubmissionInfo(studentId : Text) : async ?SubmissionInfo {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access submission information");
    };
    let submissions = submissionMap.values().toArray().filter(
      func(submission) { submission.studentId == studentId }
    );

    switch (submissions.size()) {
      case (0) {
        null;
      };
      case (size) {
        let latestSubmission = submissions[size - 1];
        ?{
          studentId = latestSubmission.studentId;
          assessment = latestSubmission.assessment;
          course = latestSubmission.course;
          mediaType = latestSubmission.mediaType;
        };
      };
    };
  };

  public query ({ caller }) func adminCheckAndGetSubmissionId(id : Nat) : async ?SubmissionIdAndMedia {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access submission contents");
    };
    switch (submissionMap.get(id)) {
      case (null) { null };
      case (?submission) {
        ?{
          id;
          media = submission.media;
          mediaType = submission.mediaType;
        };
      };
    };
  };

  public query ({ caller }) func dataCheckAndGetSubmissionId(studentId : Text, assessment : Text) : async ?Submission {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access submission data");
    };
    let matchingSubmissions = submissionMap.values().toArray().filter(
      func(submission) {
        submission.studentId == studentId and submission.assessment == assessment;
      }
    );
    getLastElement(matchingSubmissions);
  };

  public query ({ caller }) func checkAndGetSubmissionIdAdmin(studentId : Text, assessment : Text) : async ?Submission {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access submission details");
    };
    let matchingSubmissions = submissionMap.values().toArray().filter(
      func(submission) {
        submission.studentId == studentId and submission.assessment == assessment;
      }
    );
    getLastElement(matchingSubmissions);
  };

  public query ({ caller }) func getSubmissionId() : async [Nat] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list submission IDs");
    };
    submissionMap.keys().toArray();
  };

  public query ({ caller }) func getMediaUrlOfSubmission(submissionId : Nat) : async Storage.ExternalBlob {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access media URLs");
    };
    switch (submissionMap.get(submissionId)) {
      case (null) { Runtime.trap("Submission does not exist") };
      case (?submission) { submission.media };
    };
  };

  public query ({ caller }) func getStudentIdBySubmission(id : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access student information");
    };
    switch (submissionMap.get(id)) {
      case (null) { Runtime.trap("Submission does not exist") };
      case (?submission) { submission.studentId };
    };
  };

  // Admin Gateway: All admin-only public endpoints now require admin
  public query ({ caller }) func adminSubmissions(studentId : Text) : async [ExistingSubmission] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get all submissions");
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

  public query ({ caller }) func adminGetSubmission(id : Nat) : async Submission {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access submission details");
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
    // No authentication required - public student upload flow
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

  public shared ({ caller }) func adminCreateSubmission(studentId : Text, course : Text, assessment : Text, media : Storage.ExternalBlob, mediaType : MediaType) : async () {
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
      submittedBy = ?caller;
    };
    submissionMap.add(nextSubmissionId, submission);
    nextSubmissionId += 1;
  };

  public shared ({ caller }) func deleteSubmissionById(id : Nat) : async () {
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

  public shared ({ caller }) func deleteSubmissionByStudentId(studentId : Text, assessment : Text) : async () {
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

  public shared ({ caller }) func adminDeleteSubmissionByStudentId(studentId : Text, assessment : Text) : async () {
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
