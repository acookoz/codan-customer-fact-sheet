"use strict";

sap.ui.define(["sap/ui/model/json/JSONModel", "sap/ui/Device"], function (JSONModel, Device) {
  "use strict";

  return {
    createDeviceModel: function createDeviceModel() {
      var oModel = new JSONModel(Device);
      oModel.setDefaultBindingMode("OneWay");
      return oModel;
    },
    createViewModelData: function createViewModelData() {
      return {
        state: {
          editable: false,
          busy: false,
          hideCustomerHeader: false,
          request: {},
          decisionText: ""
        },
        search: {
          salesAdministrator: "",
          salesEmployee: "",
          forwardingAgent: ""
        }
      };
    }
  };
});
