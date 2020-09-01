"use strict";

sap.ui.define(["sap/ui/base/Object", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/m/StandardListItem"], function (Object, Filter, FilterOperator, StandardListItem) {
  "use strict";

  return Object.extend("factsheet.req.customer.codan.controller.FindEmployeeDialog", {
    _oOwnerComponent: null,
    // set in open()
    _oResultsList: null,
    // set in _getResultsList()
    _oSearchField: null,
    // set in _getSearchField()
    _sProperty: null,
    // Target property for selected key - set in open()
    _sNameProperty: null,
    // Target property for selected value (ie employee name) - set in open()
    _getDialog: function _getDialog() {
      // create dialog lazily
      if (!this._oDialog) {
        // create dialog via fragment factory
        this._oDialog = sap.ui.xmlfragment("factsheet.req.customer.codan.view.dialog.FindEmployeeDialog", this);
      }

      return this._oDialog;
    },
    open: function open(oView, oOwnerComponent, sProperty, sNameProperty, sDialogTitle) {
      this._oOwnerComponent = oOwnerComponent;
      this._sProperty = sProperty;
      this._sNameProperty = sNameProperty; // Create and/or get dialog and connect to view (models, lifecycle)

      var oDialog = this._getDialog();

      oDialog.setTitle(sDialogTitle);
      oView.addDependent(oDialog); // Bind search field to correct property

      var oSearchField = this._getSearchField();

      oSearchField.bindValue({
        path: "viewModel>/search/".concat(sProperty),
        model: oOwnerComponent._oViewModel
      }); // Clear any previous search results - might relate to a totally different target property

      this.clearSearchResults(); // open dialog

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
      var sSearchTerm = this._getSearchTerm();

      if (!sSearchTerm) {
        return;
      }

      var oResultsList = this._getResultsList();

      var aFilters = [new Filter({
        path: "property",
        operator: FilterOperator.EQ,
        value1: this._sProperty
      }), new Filter({
        path: "filterValue",
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
      oViewModel.setProperty("/state/request/".concat(this._sProperty), oData.key);
      oViewModel.setProperty("/state/request/".concat(this._sNameProperty), oData.value);
      this.closeDialog();
    },
    _getSearchField: function _getSearchField() {
      if (!this._oSearchField) {
        this._oSearchField = sap.ui.getCore().byId("employeeSearchField");
      }

      return this._oSearchField;
    },
    _getResultsList: function _getResultsList() {
      if (!this._oResultsList) {
        this._oResultsList = sap.ui.getCore().byId("employeeSearchResults");
      }

      return this._oResultsList;
    },
    _getSearchTerm: function _getSearchTerm() {
      return this._oOwnerComponent._oViewModel.getProperty("/search/".concat(this._sProperty));
    },
    closeDialog: function closeDialog() {
      this._deselectItem();

      this._getDialog().close();
    }
  });
});
