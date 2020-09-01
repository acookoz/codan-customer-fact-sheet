"use strict";

sap.ui.define(["sap/m/ButtonType"], function (ButtonType) {
  "use strict";

  return {
    newExplainTextVisible: function newExplainTextVisible(sCustomerId, sStatus) {
      return !sCustomerId && !sStatus;
    },
    findOrChangeButtonIcon: function findOrChangeButtonIcon(sExistingValue) {
      return !sExistingValue ? "sap-icon://search" : "sap-icon://edit";
    },
    findOrChangeButtonType: function findOrChangeButtonType(sExistingValue) {
      return !sExistingValue ? ButtonType.Emphasized : ButtonType.Default;
    },
    countryDependentFieldEnabled: function countryDependentFieldEnabled(sCountry, bFormEditable) {
      return !!sCountry && bFormEditable;
    },
    regionRequired: function regionRequired(sCountry, bFormEditable, aRegions) {
      return !!sCountry && bFormEditable && aRegions.findIndex(function (oRegion) {
        return oRegion.country === sCountry;
      }) > -1;
    },
    abnLabelText: function abnLabelText(sCountry) {
      return sCountry === "AU" ? "ABN" : "Tax Number";
    }
  };
});
