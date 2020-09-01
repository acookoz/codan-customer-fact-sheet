"use strict";

sap.ui.define(["sap/ui/base/Object", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/m/StandardListItem"], function (Object, Filter, FilterOperator, StandardListItem) {
  "use strict";

  return Object.extend("factsheet.req.customer.codan.controller.FindForwardingAgentDialog", {
    _oOwnerComponent: null,
    // set in open()
    _oResultsList: null,
    // set in _getResultsList()
    _getDialog: function _getDialog() {
      // create dialog lazily
      if (!this._oDialog) {
        // create dialog via fragment factory
        this._oDialog = sap.ui.xmlfragment("factsheet.req.customer.codan.view.dialog.FindForwardingAgentDialog", this);
      }

      return this._oDialog;
    },
    open: function open(oView, oOwnerComponent) {
      this._oOwnerComponent = oOwnerComponent;

      var oDialog = this._getDialog(); // connect dialog to view (models, lifecycle)


      oView.addDependent(oDialog); // open dialog

      oDialog.open();
    },
    _deselectItem: function _deselectItem() {
      var oList = this._getResultsList();

      var oSelectedItem = oList.getSelectedItem();

      if (oSelectedItem) {
        oList.setSelectedItem(oSelectedItem, false);
      }
    },
    clearSearchResults: function clearSearchResults() {
      var oResultsList = this._getResultsList();

      oResultsList.setVisible(false);
      oResultsList.unbindItems();
    },
    search: function search() {
      var sCompanyCode = this._oOwnerComponent._oViewModel.getProperty("/state/request/companyCode");

      var sSearchTerm = this._getSearchTerm();

      if (!sSearchTerm) {
        return;
      }

      var oResultsList = this._getResultsList();

      var aFilters = [new Filter({
        path: "property",
        operator: FilterOperator.EQ,
        value1: "forwardingAgent"
      }), new Filter({
        path: "filterValue",
        operator: FilterOperator.EQ,
        value1: sCompanyCode
      }), new Filter({
        path: "filterValue2",
        operator: FilterOperator.EQ,
        value1: sSearchTerm
      })];
      oResultsList.bindItems({
        path: "oDataModel>/ValueHelpResults",
        filters: aFilters,
        template: new StandardListItem({
          title: "{oDataModel>value}",
          description: "{oDataModel>key}"
        }),
        templateShareable: false
      });
      oResultsList.setVisible(true);
    },
    onSelection: function onSelection() {
      var oList = this._getResultsList();

      var oItem = oList.getSelectedItem();

      var _oItem$getBindingCont = oItem.getBindingContext("oDataModel"),
          oModel = _oItem$getBindingCont.oModel,
          sPath = _oItem$getBindingCont.sPath;

      var oData = oModel.getProperty(sPath);
      var oViewModel = this._oOwnerComponent._oViewModel;
      oViewModel.setProperty("/state/request/forwardingAgent", oData.key);
      oViewModel.setProperty("/state/request/forwardingAgentName", oData.value);
      this.closeDialog();
    },
    _getResultsList: function _getResultsList() {
      if (!this._oResultsList) {
        this._oResultsList = sap.ui.getCore().byId("forwardingAgentSearchResults");
      }

      return this._oResultsList;
    },
    _getSearchTerm: function _getSearchTerm() {
      return this._oOwnerComponent._oViewModel.getProperty("/search/forwardingAgent");
    },
    closeDialog: function closeDialog() {
      this._deselectItem();

      this._getDialog().close();
    }
  });
});
