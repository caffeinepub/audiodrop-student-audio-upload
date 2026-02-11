import Map "mo:core/Map";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";
import Principal "mo:core/Principal";

module {
  type OldSubmission = {
    id : Nat;
    studentId : Text;
    course : Text;
    assessment : Text;
    submittedAtUtc : Time.Time;
    audio : Storage.ExternalBlob;
  };

  type OldActor = {
    submissionMap : Map.Map<Nat, OldSubmission>;
  };

  type MediaType = {
    #audio;
    #video;
  };

  type NewSubmission = {
    id : Nat;
    studentId : Text;
    course : Text;
    assessment : Text;
    submittedAtUtc : Time.Time;
    media : Storage.ExternalBlob;
    mediaType : MediaType;
    submittedBy : ?Principal; // Changed to optional
  };

  type NewActor = {
    submissionMap : Map.Map<Nat, NewSubmission>;
  };

  // No Principal.fromText, use null instead to represent anonymous principal
  public func run(old : OldActor) : NewActor {
    let newSubmissionMap = old.submissionMap.map<Nat, OldSubmission, NewSubmission>(
      func(_id, oldSub) {
        { oldSub with media = oldSub.audio; mediaType = #audio; submittedBy = null };
      }
    );
    { submissionMap = newSubmissionMap };
  };
};
