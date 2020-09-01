"use strict";

sap.ui.define([], function () {
  "use strict";

  var constants = {
    ACTION: {
      SAVE: {
        successMessage: "The request was saved",
        eventMethod: "fireSaved"
      },
      SUBMIT: {
        successMessage: "The request was submitted",
        eventMethod: "fireSubmitted"
      },
      APPROVE: {
        successMessage: "The request was approved",
        eventMethod: "fireApproved"
      },
      REJECT: {
        successMessage: "The request was rejected",
        eventMethod: "fireRejected"
      }
    },
    ROLE: {
      REQUESTOR: "R",
      APPROVER: "A"
    },
    STATUS: {
      SAVED: "",
      NEEDS_APPROVAL: "N",
      APPROVED: "A",
      REJECTED: "R"
    }
  };
  return constants;
});
