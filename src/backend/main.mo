import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";

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

  public type Session = {
    role : ?Text;
    createdAt : Time.Time;
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
  let sessions = Map.empty<Principal, Session>();
  var nextSubmissionId : Nat = 0;

  // Session management helper functions
  func getSession(caller : Principal) : ?Session {
    sessions.get(caller);
  };

  func isAdminSession(caller : Principal) : Bool {
    switch (getSession(caller)) {
      case (?session) {
        switch (session.role) {
          case (?"admin") { true };
          case (_) { false };
        };
      };
      case (null) { false };
    };
  };

  func requireAdminSession(caller : Principal) {
    if (not isAdminSession(caller)) {
      Runtime.trap("Forbidden: Admin session required");
    };
  };

  // Check if a string is empty or contains only whitespace
  func isEmpty(text : Text) : Bool {
    text.trim(#char(' ')).isEmpty();
  };

  // Capitalizes the first character of a Text
  func capitalizeFirst(text : Text) : Text {
    switch (text.size()) {
      case (0) { text };
      case (_) {
        let chars = text.toArray();
        let firstChar = chars[0].toText();
        let restChars = chars.sliceToArray(1, chars.size());
        switch (restChars.size()) {
          case (0) { firstChar };
          case (_) { firstChar.concat(Text.fromArray(restChars)) };
        };
      };
    };
  };

  // Normalizes the username input for comparison
  func formatUsername(username : Text) : Text {
    let trimmed = username.trim(#char(' '));
    if (trimmed.trim(#char(' ')).isEmpty()) {
      return trimmed;
    };
    let formatted = capitalizeFirst(trimmed);
    formatted.trim(#char(' '));
  };

  // Newtypes for admin login
  public type AdminLoginRequest = {
    username : Text;
    password : Text;
  };

  public type AdminLoginResponse = {
    #ok : Bool;
    #error : Text;
  };

  // Admin login endpoint via POST /api/admin/login
  // Accepts { "username": "...", "password": "..." }
  // Normalizes username and validates against "OP Admin"
  // Validates password against "Hellyea11"
  // On success, sets admin role and returns ok response
  // On failure, returns error response
  public shared ({ caller }) func adminLogin(body : AdminLoginRequest) : async AdminLoginResponse {
    if (isEmpty(body.username) or isEmpty(body.password)) {
      return #error("Username and password cannot be empty");
    };

    let formattedUsername = formatUsername(body.username);
    let isMatch = formattedUsername == "OP Admin" and body.password.trim(#char(' ')) == "Hellyea11";

    if (isMatch) {
      let session : Session = {
        role = ?"admin";
        createdAt = Time.now();
      };
      sessions.add(caller, session);
      #ok(true);
    } else {
      #error("Invalid admin credentials");
    };
  };

  // Admin logout endpoint - clears session role
  public shared ({ caller }) func adminLogout() : async () {
    sessions.remove(caller);
  };

  // Check current session status
  public query ({ caller }) func getSessionRole() : async ?Text {
    switch (getSession(caller)) {
      case (?session) { session.role };
      case (null) { null };
    };
  };

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

  // Admin Gateway: All admin-only public endpoints now require session role check
  // This endpoint lists submissions for a specific student
  public query ({ caller }) func adminSubmissions(studentId : Text) : async [ExistingSubmission] {
    requireAdminSession(caller);
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

  // Legacy endpoint - kept for backward compatibility
  public query ({ caller }) func getAllSubmissions() : async [Submission] {
    requireAdminSession(caller);
    submissionMap.values().toArray().sort();
  };

  // Primary admin submissions list endpoint - used by Admin Dashboard
  // Authorization: admin session role only
  // Returns all submissions directly from submissionMap
  public query ({ caller }) func listSubmissions() : async [Submission] {
    requireAdminSession(caller);
    submissionMap.values().toArray().sort();
  };

  // Admin-only download endpoint
  // Authorization: Requires authenticated admin session (session.role == "admin")
  // Returns controlled responses (no traps):
  // - #forbidden if caller is not admin
  // - #notFound if submission doesn't exist
  // - #ok with file data, mimeType, and fileName on success
  public query ({ caller }) func adminDownloadSubmission(id : Nat) : async DownloadResponse {
    // Check admin session authorization first
    if (not isAdminSession(caller)) {
      return #forbidden("Unauthorized: Admin session required");
    };

    // Look up submission by id
    switch (submissionMap.get(id)) {
      case (null) {
        #notFound("Submission not found");
      };
      case (?submission) {
        // Extract file information from the media blob
        let media = submission.media;

        // Construct filename from submission metadata
        let fileName = "submission_" # submission.id.toText() # "_" # submission.studentId;

        // Return the file data with proper headers
        #ok({
          data = media;
          fileName = fileName;
          fileType = "webm"; // Use correct file extension for admin downloads
          originalFileName = "audio_submission.webm"; // Use correct original filename for admin downloads
        });
      };
    };
  };

  public shared ({ caller }) func adminCreateSubmission(studentId : Text, course : Text, assessment : Text, media : Storage.ExternalBlob, mediaType : MediaType) : async () {
    requireAdminSession(caller);
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

  public shared ({ caller }) func adminDeleteSubmissionById(id : Nat) : async () {
    requireAdminSession(caller);
    switch (submissionMap.get(id)) {
      case (null) { Runtime.trap("Submission does not exist") };
      case (?submission) {
        submissionMap.remove(id);
      };
    };
  };

  public shared ({ caller }) func adminDeleteSubmissionByStudentId(studentId : Text, assessment : Text) : async () {
    requireAdminSession(caller);
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

  public shared ({ caller }) func createSubmission(studentId : Text, course : Text, assessment : Text, media : Storage.ExternalBlob, mediaType : MediaType) : async () {
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
};
