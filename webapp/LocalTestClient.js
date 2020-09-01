"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

/**
 * Demo/unit test page for running embedded component locally
 */

/* eslint-disable no-console */
var EXAMPLE = {
  REQUEST_ID: "0001000074",
  CUSTOMER_ID: "0000000123",
  COMPANY_CODE: "1000"
};
var TYPE = {
  EXISTING: "E",
  NEW: "N"
};
sap.ui.define(["factsheet/req/customer/codan/model/constants", "sap/ui/core/ComponentContainer", "sap/ui/model/json/JSONModel", "sap/ui/model/odata/v2/ODataModel", "sap/m/Page", "sap/m/Shell", "sap/m/Button", "sap/m/ButtonType", "sap/m/Input", "sap/m/MessageBox", "sap/m/Select", "sap/ui/core/Item", "sap/ui/core/MessageType"], function (constants, ComponentContainer, JSONModel, ODataModel, Page, Shell, Button, ButtonType, Input, MessageBox, Select, Item, MessageType) {
  "use strict";

  return {
    _oClientModel: undefined,
    _oODataModel: undefined,
    oButtons: {
      messages: undefined,
      cancel: undefined,
      reject: undefined,
      approve: undefined,
      save: undefined,
      submit: undefined,
      ok: undefined // input ok

    },
    oToolbar: undefined,
    init: function init() {
      this._oODataModel = new ODataModel("/sap/opu/odata/sap/Z_CUSTOMER_REQ_SRV/");
      this._oClientModel = new JSONModel({
        ready: false,
        role: constants.ROLE.REQUESTOR,
        requestType: TYPE.EXISTING,
        customerType: TYPE.EXISTING
      });
      var oPage = new Page({
        title: "Unit Test Customer Request Factsheet",
        "class": "sapUiContentPadding",
        enableScrolling: true,
        content: this.createPageContent()
      });
      oPage.setModel(this._oClientModel, "client");
      oPage.setModel(this._oODataModel, "odata");
      new Shell({
        app: oPage
      }).placeAt("content");

      this._resetDefaultValues();
    },

    /**
     * Create all buttons (no event handlers yet) so they can be used in view composition
     */
    createButtons: function createButtons() {
      this.oButtons.ok = new Button({
        tooltip: "Show request component for this input",
        type: ButtonType.Emphasized,
        text: "OK",
        enabled: true,
        visible: "{= !${client>/ready} }"
      });
      this.oButtons.messages = new Button({
        tooltip: "Messages",
        icon: "sap-icon://message-popup",
        enabled: false,
        visible: true
      });
      this.oButtons.save = new Button({
        text: "Save",
        type: "Emphasized",
        enabled: false,
        visible: false
      });
      this.oButtons.reject = new Button({
        text: "Reject",
        type: ButtonType.Reject,
        enabled: false,
        visible: false
      });
      this.oButtons.approve = new Button({
        text: "Approve",
        type: ButtonType.Accept,
        enabled: false,
        visible: false
      });
      this.oButtons.cancel = new Button({
        text: "Cancel",
        enabled: true,
        visible: false
      });
      this.oButtons.submit = new Button({
        text: "Submit",
        type: "Emphasized",
        enabled: false,
        visible: false
      });
    },

    /**
     * Attach button press event handlers once we have a component
     */
    attachButtonEventHandlers: function attachButtonEventHandlers(oComponent) {
      var _this = this;

      this.oButtons.ok.attachPress(function () {
        oComponent.setRole(_this._oClientModel.getProperty("/role"));

        try {
          _this._oClientModel.setProperty("/ready", true);

          _this._oClientModel.refresh();

          oComponent.setRequest({
            requestId: _this._oClientModel.getProperty("/requestId"),
            companyCode: _this._oClientModel.getProperty("/companyCode"),
            customerId: _this._oClientModel.getProperty("/customerId")
          });
        } catch (oError) {
          MessageBox.error(oError.message);
        }
      });
      this.oButtons.reject.attachPress(function () {
        oComponent.reject();
      });
      this.oButtons.approve.attachPress(function () {
        oComponent.approve();
      });
      this.oButtons.save.attachPress(function () {
        oComponent.save();
      });
      this.oButtons.cancel.attachPress(function () {
        _this._cancel();
      });
      this.oButtons.submit.attachPress(function () {
        oComponent.submit();
      });
      this.oButtons.messages.attachPress(function () {
        oComponent.displayMessages();
      });
    },
    updateButtons: function updateButtons(oRequest) {
      var sRole = this._oClientModel.getProperty("/role");

      var bReady = this._oClientModel.getProperty("/ready");

      if (!bReady) {
        // Hide buttons acting on a request since we don't have one for the current input data
        this.oButtons.cancel.setVisible(false);
        this.oButtons.save.setVisible(false);
        this.oButtons.submit.setVisible(false);
        this.oButtons.approve.setVisible(false);
        this.oButtons.reject.setVisible(false);
      } else {
        // Show hide buttons based on current role and request status
        this.oButtons.cancel.setVisible(true);
        this.oButtons.save.setVisible(sRole === constants.ROLE.REQUESTOR);
        this.oButtons.save.setEnabled(oRequest && !oRequest.status);
        this.oButtons.submit.setVisible(sRole === constants.ROLE.REQUESTOR);
        this.oButtons.submit.setEnabled(oRequest && !oRequest.status);
        this.oButtons.approve.setVisible(sRole === constants.ROLE.APPROVER);
        this.oButtons.approve.setEnabled(oRequest && oRequest.status === constants.STATUS.NEEDS_APPROVAL);
        this.oButtons.reject.setVisible(sRole === constants.ROLE.APPROVER);
        this.oButtons.reject.setEnabled(oRequest && oRequest.status === constants.STATUS.NEEDS_APPROVAL);
      }
    },
    onMessages: function onMessages(oEvent) {
      var aMessages = oEvent.getParameter("messages");

      if (aMessages.length) {
        var bHasErrors = aMessages.findIndex(function (oMessage) {
          return oMessage.type === MessageType.Error;
        }) > -1;
        var sButtonType = bHasErrors ? ButtonType.Reject : ButtonType.Emphasized;
        this.oButtons.messages.setText(aMessages.length);
        this.oButtons.messages.setType(sButtonType);
        this.oButtons.messages.setEnabled(true);
      } else {
        this.oButtons.messages.setText("");
        this.oButtons.messages.setType(ButtonType.Default);
        this.oButtons.messages.setEnabled(false);
      }

      var sMessage = "Event 'messages' triggered with ".concat(aMessages.length, " messages.");
      MessageBox.information(sMessage);
    },
    onRequestReady: function onRequestReady(oEvent) {
      var oRequest = oEvent.getParameter("request");
      var sMessage = oRequest && oRequest.id ? "Event 'ready' triggered on request ".concat(oRequest.id) : "Event 'ready' triggered on new/unsaved request";
      MessageBox.information(sMessage);
      this.updateButtons(oRequest);
    },
    onRequestSaved: function onRequestSaved(oEvent) {
      var oRequest = oEvent.getParameter("request");
      var sMessage = "Event 'saved' triggered on request ".concat(oRequest.id);
      MessageBox.information(sMessage);
    },
    onRequestApproved: function onRequestApproved(oEvent) {
      var oRequest = oEvent.getParameter("request");
      var sMessage = "Event 'approved' triggered on request ".concat(oRequest.id);
      MessageBox.information(sMessage);
      this.updateButtons(oRequest);
    },
    onRequestRejected: function onRequestRejected(oEvent) {
      var oRequest = oEvent.getParameter("request");
      var sMessage = "Event 'rejected' triggered on request ".concat(oRequest.id);
      MessageBox.information(sMessage);
      this.updateButtons(oRequest);
    },
    onRequestSubmitted: function onRequestSubmitted(oEvent) {
      var oRequest = oEvent.getParameter("request");
      var sMessage = "Event 'submitted' triggered on request ".concat(oRequest.id);
      MessageBox.information(sMessage);
      this.updateButtons(oRequest);
    },
    createPageContent: function createPageContent() {
      this.createButtons();
      this.oToolbar = this._createToolbar();

      var oComponentContainer = this._createComponent();

      var _this$_createRoleCont = this._createRoleControls(),
          _this$_createRoleCont2 = _slicedToArray(_this$_createRoleCont, 2),
          oLabelRole = _this$_createRoleCont2[0],
          oSelectRole = _this$_createRoleCont2[1];

      var _this$_createRequestI = this._createRequestIdControls(),
          _this$_createRequestI2 = _slicedToArray(_this$_createRequestI, 2),
          oLabelRequestId = _this$_createRequestI2[0],
          oInputRequestId = _this$_createRequestI2[1];

      var _this$_createCompanyC = this._createCompanyCodeControls(),
          _this$_createCompanyC2 = _slicedToArray(_this$_createCompanyC, 2),
          oLabelCompanyCode = _this$_createCompanyC2[0],
          oSelectCompanyCode = _this$_createCompanyC2[1];

      var _this$_createCustomer = this._createCustomerIdControls(),
          _this$_createCustomer2 = _slicedToArray(_this$_createCustomer, 2),
          oLabelCustomerId = _this$_createCustomer2[0],
          oInputCustomerId = _this$_createCustomer2[1];

      var _this$_createRequestT = this._createRequestTypeControls(),
          _this$_createRequestT2 = _slicedToArray(_this$_createRequestT, 2),
          oLabelRequestType = _this$_createRequestT2[0],
          oRadioRequestType = _this$_createRequestT2[1];

      var _this$_createCustomer3 = this._createCustomerTypeControls(),
          _this$_createCustomer4 = _slicedToArray(_this$_createCustomer3, 2),
          oLabelCustomerType = _this$_createCustomer4[0],
          oRadioCustomerType = _this$_createCustomer4[1];

      var oForm = new sap.ui.layout.form.SimpleForm({
        editable: true,
        content: [oLabelRole, oSelectRole, oLabelRequestType, oRadioRequestType, oLabelCustomerType, oRadioCustomerType, oLabelRequestId, oInputRequestId, oLabelCompanyCode, oSelectCompanyCode, oLabelCustomerId, oInputCustomerId]
      });
      var oClientPanel = new sap.m.Panel({
        headerText: "Consumer/client app example",
        expanded: true,
        expandable: true,
        content: [oForm, this.oToolbar]
      });
      var oComponentPanel = new sap.m.Panel({
        headerText: "Reuse component",
        expanded: true,
        expandable: false,
        content: oComponentContainer
      });
      var oComponentBox = new sap.m.VBox({
        visible: "{client>/ready}",
        items: [oComponentPanel]
      });
      return [oClientPanel, oComponentBox];
    },
    _createComponent: function _createComponent() {
      var oComponentContainer = new ComponentContainer({
        id: "calcComponentBound"
      });
      var oComponent = sap.ui.getCore().createComponent({
        name: "factsheet.req.customer.codan",
        settings: {
          messagesButton: this.oButtons.messages,
          ready: this.onRequestReady.bind(this),
          saved: this.onRequestSaved.bind(this),
          submitted: this.onRequestSubmitted.bind(this),
          approved: this.onRequestApproved.bind(this),
          rejected: this.onRequestRejected.bind(this),
          messages: this.onMessages.bind(this)
        }
      });
      this.attachButtonEventHandlers(oComponent);
      oComponentContainer.setComponent(oComponent);
      return oComponentContainer;
    },
    _createRoleControls: function _createRoleControls() {
      var _this2 = this;

      var oLabelRole = new sap.m.Label({
        text: "Role"
      });
      var oSelectRole = new Select({
        selectedKey: "{client>/role}",
        items: [new sap.ui.core.Item({
          key: "R",
          text: "Requestor ('R')"
        }), new sap.ui.core.Item({
          key: "A",
          text: "Approver ('A')"
        })]
      });
      oSelectRole.attachChange(function () {
        var sNewRole = _this2._oClientModel.getProperty("/role");

        if (sNewRole === constants.ROLE.APPROVER) {
          _this2._selectRequestTypeExisting();
        }

        _this2._resetDefaultValues();

        _this2._onInputChange();
      });
      return [oLabelRole, oSelectRole];
    },
    _cancel: function _cancel() {
      this._oClientModel.setProperty("/role", constants.ROLE.REQUESTOR);

      this._selectRequestTypeExisting();

      this._resetDefaultValues();

      this._onInputChange();
    },
    _resetDefaultValues: function _resetDefaultValues() {
      var requestId = this._oClientModel.getProperty("/requestId");

      if (this._oClientModel.getProperty("/requestType") === TYPE.NEW) {
        this._oClientModel.setProperty("/requestId", undefined);

        this._oClientModel.setProperty("/customerType", TYPE.EXISTING);

        this._oClientModel.setProperty("/companyCode", EXAMPLE.COMPANY_CODE);

        this._oClientModel.setProperty("/customerId", EXAMPLE.CUSTOMER_ID);
      } else if (!requestId) {
        this._oClientModel.setProperty("/requestId", EXAMPLE.REQUEST_ID);

        this._oClientModel.setProperty("/companyCode", undefined);

        this._oClientModel.setProperty("/customerId", undefined);
      }

      this._oClientModel.refresh();
    },
    _createRequestIdControls: function _createRequestIdControls() {
      var oLabelRequestId = new sap.m.Label({
        text: "Request Id",
        visible: "{= ${client>/requestType} !== 'N'}"
      });
      var oInputRequestId = new Input({
        type: "Text",
        value: "{client>/requestId}",
        visible: "{= ${client>/requestType} !== 'N'}",
        liveChange: this._onInputChange.bind(this)
      });
      return [oLabelRequestId, oInputRequestId];
    },
    _onInputChange: function _onInputChange() {
      this._oClientModel.setProperty("/ready", false);

      this._oClientModel.refresh();

      this.updateButtons();
    },
    _createCompanyCodeControls: function _createCompanyCodeControls() {
      var oLabel = new sap.m.Label({
        text: "Company Code",
        visible: "{= ${client>/requestType} === 'N'}"
      });
      var oItem = new Item({
        text: "{odata>companyName}",
        key: "{odata>companyCode}"
      });
      var oSelect = new Select({
        selectedKey: "{client>/companyCode}",
        change: this._onInputChange.bind(this),
        visible: "{= ${client>/requestType} === 'N'}",
        items: {
          path: "odata>/SalesOrgs",
          sorter: {
            path: "companyName"
          },
          template: oItem,
          templateShareable: false
        }
      });
      return [oLabel, oSelect];
    },
    _createCustomerIdControls: function _createCustomerIdControls() {
      var oLabelCustomerId = new sap.m.Label({
        text: "Customer Id",
        visible: {
          parts: ["client>/role", "client>/requestType", "client>/customerType"],
          formatter: this._customerIdIsVisible.bind(this)
        }
      });
      var oInputCustomerId = new Input({
        type: "Text",
        value: "{client>/customerId}",
        visible: {
          parts: ["client>/role", "client>/requestType", "client>/customerType"],
          formatter: this._customerIdIsVisible.bind(this)
        },
        liveChange: this._onInputChange.bind(this)
      });
      return [oLabelCustomerId, oInputCustomerId];
    },
    _customerIdIsVisible: function _customerIdIsVisible(sRole, sRequestType, sCustomerType) {
      var bVisible = sRole === constants.ROLE.REQUESTOR && sRequestType === TYPE.NEW && sCustomerType === TYPE.EXISTING;
      return bVisible;
    },
    _createRequestTypeControls: function _createRequestTypeControls() {
      var _this3 = this;

      var oLabelRequestType = new sap.m.Label({
        text: "Request Type",
        visible: "{= ${client>/role} === 'R'}" // Visible in Requestor role

      });
      var oRadioRequestType = new sap.m.RadioButtonGroup({
        columns: 2,
        visible: "{= ${client>/role} === 'R'}",
        // Visible in Requestor role
        buttons: [new sap.m.RadioButton({
          text: "New",
          selected: "{= ${client>/requestType} === 'N'}",
          select: function select() {
            _this3._selectRequestTypeNew();
          }
        }), new sap.m.RadioButton({
          text: "Existing",
          selected: "{= ${client>/requestType} === 'E'}",
          select: function select() {
            _this3._selectRequestTypeExisting();
          }
        })]
      });
      return [oLabelRequestType, oRadioRequestType];
    },
    _createCustomerTypeControls: function _createCustomerTypeControls() {
      var _this4 = this;

      var oLabelCustomerType = new sap.m.Label({
        text: "Customer Type",
        visible: {
          parts: ["client>/role", "client>/requestType"],
          formatter: this._customerTypeIsVisible.bind(this)
        }
      });
      var oRadioCustomerType = new sap.m.RadioButtonGroup({
        columns: 2,
        visible: {
          parts: ["client>/role", "client>/requestType"],
          formatter: this._customerTypeIsVisible.bind(this)
        },
        buttons: [new sap.m.RadioButton({
          text: "New",
          selected: "{= ${client>/customerType} === 'N'}",
          select: function select() {
            _this4._selectCustomerTypeNew();
          }
        }), new sap.m.RadioButton({
          text: "Existing",
          selected: "{= ${client>/customerType} === 'E'}",
          select: function select() {
            _this4._selectCustomerTypeExisting();
          }
        })]
      });
      return [oLabelCustomerType, oRadioCustomerType];
    },
    _customerTypeIsVisible: function _customerTypeIsVisible(sRole, sRequestType) {
      return sRole === constants.ROLE.REQUESTOR && sRequestType === TYPE.NEW;
    },
    _selectRequestTypeNew: function _selectRequestTypeNew() {
      this._oClientModel.setProperty("/requestType", TYPE.NEW);

      this._resetDefaultValues();

      this._onInputChange();
    },
    _selectRequestTypeExisting: function _selectRequestTypeExisting() {
      this._oClientModel.setProperty("/requestType", TYPE.EXISTING);

      this._resetDefaultValues();

      this._onInputChange();
    },
    _selectCustomerTypeNew: function _selectCustomerTypeNew() {
      this._oClientModel.setProperty("/customerType", TYPE.NEW);

      this._oClientModel.setProperty("/customerId", undefined);

      this._onInputChange();
    },
    _selectCustomerTypeExisting: function _selectCustomerTypeExisting() {
      this._oClientModel.setProperty("/customerType", TYPE.EXISTING);

      this._oClientModel.setProperty("/customerId", EXAMPLE.CUSTOMER_ID);

      this._onInputChange();
    },
    _createToolbar: function _createToolbar() {
      return new sap.m.Toolbar({
        content: [this.oButtons.messages, new sap.m.ToolbarSpacer(), new sap.m.ToolbarSpacer(), this.oButtons.cancel, this.oButtons.reject, this.oButtons.approve, this.oButtons.save, this.oButtons.submit, this.oButtons.ok]
      });
    }
  };
});
