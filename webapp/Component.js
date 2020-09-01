"use strict";

/**
 * Reusable Customer Request Fact Sheet UI component.
 *
 * See README for details
 */
jQuery.sap.registerModulePath("codan.z_ie11_polyfill", "/sap/bc/ui5_ui5/sap/z_ie11_polyfill");
sap.ui.define(["sap/ui/core/UIComponent", "sap/ui/core/MessageType", "sap/ui/core/message/Message", "sap/m/MessageToast", "sap/m/MessageBox", "sap/m/MessagePopover", "sap/m/MessagePopoverItem", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/ui/core/Item", "factsheet/req/customer/codan/controller/FindEmployeeDialog", "factsheet/req/customer/codan/controller/FindForwardingAgentDialog", "factsheet/req/customer/codan/model/postcodeValidator", "factsheet/req/customer/codan/model/constants", "factsheet/req/customer/codan/model/models", "factsheet/req/customer/codan/model/utils", "factsheet/req/customer/codan/model/formatters", "codan/z_ie11_polyfill/Component" // Load polyfills for IE11
], function (UIComponent, MessageType, Message, MessageToast, MessageBox, MessagePopover, MessagePopoverItem, Filter, FilterOperator, Item, FindEmployeeDialog, FindForwardingAgentDialog, postcodeValidator, constants, models, utils, formatters) {
  "use strict";

  return UIComponent.extend("factsheet.req.customer.codan.Component", {
    metadata: {
      manifest: "json",
      includes: ["css/style.css"],
      properties: {
        role: {
          type: "string"
        },
        request: {
          type: "object"
        },
        messagesButton: {
          type: "sap.ui.core.Element"
        },
        hideCustomerHeader: {
          type: "boolean"
        }
      },
      events: {
        approved: {
          request: "object"
        },
        messages: {
          messages: "object",
          multiple: true
        },
        ready: {
          request: "object"
        },
        rejected: {
          request: "object"
        },
        saved: {
          request: "object"
        },
        submitted: {
          request: "object"
        }
      }
    },
    formatters: formatters,
    _oODataModel: null,
    // Defined in manifest.json, set in init()
    _oViewModel: null,
    // Defined in manifest.json, set in init()
    oMessageManager: {},
    _sObjectPath: "/state/request",
    _oFactSheet: null,
    // set in createContent()
    _oFindEmployeeDialog: null,
    // set in init()
    _oFindForwardingAgentDialog: null,
    // set in init()

    /**
     * Lifecyle method: called on component initialization
     * 
     * Akin to onInit of view controller.
     */
    init: function init() {
      // call the base component's init function
      UIComponent.prototype.init.apply(this, arguments); // set the device model

      this.setModel(models.createDeviceModel(), "device"); // set and initialize view model data`

      this._oViewModel = this.getModel("viewModel");

      this._oViewModel.setData(models.createViewModelData()); // set the oDataModel


      this._oODataModel = this.getModel("oDataModel"); // Initialise the message manager

      this.oMessageManager = sap.ui.getCore().getMessageManager();
      this.setModel(this.oMessageManager.getMessageModel(), "message");
      this.oMessageManager.registerObject(this, true);
      this.getModel("regions").setSizeLimit(9999);
      this.getModel("countries").setSizeLimit(9999);
      this._oFindEmployeeDialog = new FindEmployeeDialog();
      this._oFindForwardingAgentDialog = new FindForwardingAgentDialog();
    },

    /**
     * Lifecyle method: called to produce renderable content
     * 
     * Akin to the renderer of a custom control
     *
     * @returns {sap.ui.xmlfragment} - Fact sheet view fragment for embedding in client page
     */
    createContent: function createContent() {
      if (!this._oFactSheet) {
        this._oFactSheet = sap.ui.xmlfragment("factsheet.req.customer.codan.view.factsheet.FactSheet", this);
      }

      return this._oFactSheet;
    },
    hasPendingChanges: function hasPendingChanges() {
      throw new Error("hasPendingChanges not implemented yet");
    },

    /**
     * Create or update a request's details in the backend
     */
    save: function save() {
      this._save(constants.ACTION.SAVE);
    },

    /**
     * Submit request for approval
     */
    submit: function submit() {
      if (!this._validateRequest()) {
        this.displayMessages();
        return;
      }

      this._save(constants.ACTION.SUBMIT, {
        status: constants.STATUS.NEEDS_APPROVAL
      });
    },

    /**
     * Approve request
     */
    approve: function approve() {
      this._showDecisionDialog(constants.STATUS.APPROVED);
    },

    /**
     * Reject request
     */
    reject: function reject() {
      this._showDecisionDialog(constants.STATUS.REJECTED);
    },
    displayMessages: function displayMessages(oEvent) {
      var oMessagesButton = this.getMessagesButton();

      if (!this._messagePopover) {
        this._messagePopover = new MessagePopover({
          items: {
            path: "message>/",
            template: new MessagePopoverItem({
              description: "{message>description}",
              type: "{message>type}",
              title: "{message>message}",
              subtitle: "{message>subtitle}"
            })
          },
          initiallyExpanded: true
        });

        this._oFactSheet.addDependent(this._messagePopover);
      }

      if (oEvent || !this._messagePopover.isOpen()) {
        this._messagePopover.toggle(oMessagesButton);
      }
    },

    /**
     * Fetch or clear the request details upon the client app setting a new role
     */
    setRole: function setRole(sRole) {
      this.setProperty("role", sRole);
    },
    setHideCustomerHeader: function setHideCustomerHeader(bHide) {
      this.setProperty("hideCustomerHeader", bHide);

      this._oViewModel.setProperty("/state/hideCustomerHeader", bHide);
    },
    findSalesAdministrator: function findSalesAdministrator() {
      this._oFindEmployeeDialog.open(this._oFactSheet, this, "salesAdministrator", "salesAdministratorName", "Find Sales Administrator");
    },
    findSalesEmployee: function findSalesEmployee() {
      this._oFindEmployeeDialog.open(this._oFactSheet, this, "salesEmployee", "salesEmployeeName", "Find Sales Employee");
    },
    findForwardingAgent: function findForwardingAgent() {
      this._oFindForwardingAgentDialog.open(this._oFactSheet, this);
    },

    /**
     * Called when `request` parameter is set by the client.  Refer to README for details of fields.
     *
     */
    setRequest: function setRequest(oRequest) {
      this._setRequest(oRequest);
    },

    /*
     * @param oRequest - Request key (see README) required 
     * @param oAction - Action this call is in response to (internal, optional)
     */
    _setRequest: function _setRequest(oRequest, oAction) {
      if (oRequest.requestId) {
        // Existing request
        this.setProperty("request", oRequest);

        this._resetRequest();

        this._fetchRequest(oRequest.requestId, oAction);
      } else {
        // New request - validate we have all fields required
        this._bindToCompany(oRequest.companyCode);

        this.setProperty("request", oRequest);

        this._resetRequest();

        if (this.getRole() === constants.ROLE.APPROVER) {
          // New request not valid for role approver
          this._generateMessage(MessageType.Error, "Request id is required");
        } else if (oRequest.customerId) {
          // New request defaulting from customer
          this._defaultRequestFromCustomer(oRequest.companyCode, oRequest.customerId);
        } else {
          // New request with no default from customer
          this._setRequestData({
            status: "",
            companyCode: oRequest.companyCode
          });

          this._setReady(oAction);
        }
      }
    },
    onCountryChange: function onCountryChange() {
      this._oViewModel.setProperty("/state/request/transportationZone", "");

      this._oViewModel.setProperty("/state/request/region", "");

      this._oViewModel.setProperty("/state/request/poBoxRegion", "");

      var sCountry = this._oViewModel.getProperty("/state/request/country");

      this._bindToCountry(sCountry);
    },
    onSalesOfficeChange: function onSalesOfficeChange() {
      var sSalesOffice = this._oViewModel.getProperty("/state/request/salesOffice");

      this._oViewModel.setProperty("/state/request/salesGroup", "");

      this._bindToSalesOffice(sSalesOffice);
    },
    _bindToCompany: function _bindToCompany(sCompanyCode) {
      if (!sCompanyCode) {
        throw new Error("Company code is required");
      }

      this._bindSalesDistrictCombo(sCompanyCode);

      this._bindSalesOfficeCombo(sCompanyCode);
    },
    _bindToCountry: function _bindToCountry(sCountry) {
      this._bindTransportationZoneCombo(sCountry);

      this._bindRegionCombo(sCountry);

      this._bindPoBoxRegionSelect(sCountry);
    },
    _bindRegionCombo: function _bindRegionCombo(sCountry) {
      var oCombo = this._byId("region");

      if (!sCountry) {
        oCombo.unbindItems();
      } else {
        var aFilters = [new Filter({
          path: "country",
          operator: FilterOperator.EQ,
          value1: sCountry
        })];
        oCombo.bindItems({
          path: "regions>/",
          filters: aFilters,
          sorter: {
            path: "name"
          },
          template: new Item({
            key: "{regions>key}",
            text: "{regions>name}"
          }),
          templateShareable: false
        });
      }
    },
    _bindPoBoxRegionSelect: function _bindPoBoxRegionSelect(sCountry) {
      var oSelect = this._byId("poBoxRegion");

      if (!sCountry) {
        oSelect.unbindItems();
      } else {
        var aFilters = [new Filter({
          path: "country",
          operator: FilterOperator.EQ,
          value1: sCountry
        })];
        oSelect.bindItems({
          path: "regions>/",
          filters: aFilters,
          sorter: {
            path: "name"
          },
          template: new Item({
            key: "{regions>key}",
            text: "{regions>name}"
          }),
          templateShareable: false
        });
      }
    },
    _bindTransportationZoneCombo: function _bindTransportationZoneCombo(sCountry) {
      var oComboBox = this._byId("transportationZone");

      if (!sCountry) {
        oComboBox.unbindItems();
      } else {
        var aFilters = [new Filter({
          path: "property",
          operator: FilterOperator.EQ,
          value1: "transportationZone"
        }), new Filter({
          path: "filterValue",
          operator: FilterOperator.EQ,
          value1: sCountry
        })];
        oComboBox.bindItems({
          path: "oDataModel>/ValueHelpResults",
          filters: aFilters,
          template: new Item({
            key: "{oDataModel>key}",
            text: "{oDataModel>value}"
          }),
          templateShareable: false
        });
      }
    },
    _bindSalesDistrictCombo: function _bindSalesDistrictCombo(sCompanyCode) {
      // Bind sales district combo to company
      var oComboBox = this._byId("salesDistrict");

      var aFilters = [new Filter({
        path: "property",
        operator: FilterOperator.EQ,
        value1: "salesDistrict"
      }), new Filter({
        path: "filterValue",
        operator: FilterOperator.EQ,
        value1: sCompanyCode
      })];
      oComboBox.bindItems({
        path: "oDataModel>/ValueHelpResults",
        filters: aFilters,
        template: new Item({
          key: "{oDataModel>key}",
          text: "{oDataModel>value}"
        }),
        templateShareable: false
      });
    },
    _bindSalesOfficeCombo: function _bindSalesOfficeCombo(sCompanyCode) {
      var oComboBox = this._byId("salesOffice");

      var aFilters = [new Filter({
        path: "property",
        operator: FilterOperator.EQ,
        value1: "salesOffice"
      }), new Filter({
        path: "filterValue",
        operator: FilterOperator.EQ,
        value1: sCompanyCode
      })];
      oComboBox.bindItems({
        path: "oDataModel>/ValueHelpResults",
        filters: aFilters,
        template: new Item({
          key: "{oDataModel>key}",
          text: "{oDataModel>value}"
        }),
        templateShareable: false
      });
    },

    /**
     * Bind dependent fields to Sales Office selection
     */
    _bindToSalesOffice: function _bindToSalesOffice(sSalesOffice) {
      var oComboBox = this._byId("salesGroup");

      var aFilters = [new Filter({
        path: "property",
        operator: FilterOperator.EQ,
        value1: "salesGroup"
      }), new Filter({
        path: "filterValue",
        operator: FilterOperator.EQ,
        value1: sSalesOffice
      })];
      oComboBox.bindItems({
        path: "oDataModel>/ValueHelpResults",
        filters: aFilters,
        template: new Item({
          key: "{oDataModel>key}",
          text: "{oDataModel>value}"
        }),
        templateShareable: false
      });
    },

    /**
     * Set request ready
     * @param oAction - Action that has just been successfully performed (optional)
     */
    _setReady: function _setReady(oAction) {
      this._updateEditable();

      var eventMethod = oAction && oAction.eventMethod || "fireReady";
      this[eventMethod]({
        request: this._oViewModel.getProperty("/state/request")
      });

      this._generateStatusMessage();

      this._setBusy(false);

      if (oAction) {
        MessageToast.show(oAction.successMessage, {
          closeOnBrowserNavigation: false
        });
      }
    },
    _defaultRequestFromCustomer: function _defaultRequestFromCustomer(sCompanyCode, sCustomerId) {
      var _this = this;

      this._oODataModel.callFunction("/getDefaultValuesForCustomer", {
        "method": "GET",
        urlParameters: {
          companyCode: sCompanyCode,
          customerId: sCustomerId
        },
        success: function success(oData) {
          _this._setRequestData(oData);

          _this._oViewModel.setProperty("/state/request/customerId", sCustomerId);

          _this._bindToCountry(oData.country);

          _this._bindToSalesOffice(oData.salesOffice);

          _this._setReady();
        },
        error: this.handleError.bind(this)
      });
    },

    /**
     * Handle OData model call error
     */
    handleError: function handleError(oError, oResponse) {
      this._setBusy(false);

      var sMessage;

      if (oError) {
        sMessage = utils.parseError(oError);
      } else if (oResponse && oResponse.statusCode) {
        sMessage = "Unexpected HTTP response (code " + oResponse.statusCode + " )";
      } else {
        sMessage = "Unexpected system or program error.";
      }

      MessageBox.error(sMessage);
    },
    _resetRequest: function _resetRequest() {
      // Reset messages and request fields
      this._setRequestData({});

      this._clearMessages();
    },
    _fetchRequest: function _fetchRequest(sRequestId, oAction) {
      var _this2 = this;

      // Fetch request details from back end
      var sPath = this._buildRequestUrl(sRequestId);

      this._setBusy(true);

      this._oODataModel.read(sPath, {
        success: function success(oData) {
          if (oData && oData.id) {
            _this2._setRequestData(oData);

            _this2._bindToCompany(oData.companyCode);

            _this2._bindToCountry(oData.country);

            _this2._bindToSalesOffice(oData.salesOffice);

            _this2._setReady(oAction);
          } else {
            _this2._setBusy(false);

            _this2._generateMessage(MessageType.Error, "Request '" + sRequestId + "' not found");
          }
        },
        error: this.handleError.bind(this)
      });
    },
    _clearMessages: function _clearMessages() {
      if (!this.oMessageManager) {
        return;
      } // Message manager is sometimes buggy, not showin title.  See if only removing messages
      // when necessary fixes it


      if (this.oMessageManager.getMessageModel().getData().length) {
        this.oMessageManager.removeAllMessages();
      }
    },

    /**
     * Generate a single non-field specific message replacing all existing messages
     */
    _generateMessage: function _generateMessage(sMessageType, sMessage) {
      var sDescription = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";

      if (!this.oMessageManager) {
        return;
      }

      this._clearMessages();

      var oMessage = new Message({
        message: sMessage,
        description: sDescription,
        type: sMessageType,
        target: "/Dummy",
        processor: this._oViewModel
      });
      this.oMessageManager.addMessages(oMessage);
      this.fireMessages({
        messages: [oMessage]
      });

      if (sMessageType === MessageType.Error) {
        this.displayMessages();
      }
    },
    _updateEditable: function _updateEditable() {
      var sRole = this.getRole();

      var sStatus = this._oViewModel.getProperty("/state/request/status");

      var sRequestedId = this.getRequest().requestId;
      var sLoadedId = Number(this._oViewModel.getProperty("/state/request/id"));
      var bLoaded;

      if (sRequestedId) {
        bLoaded = Number(sRequestedId) === Number(sLoadedId);
      } else {
        bLoaded = true; // new request
      }

      var bEditable = bLoaded && sRole === constants.ROLE.REQUESTOR && sStatus === "";

      this._oViewModel.setProperty("/state/editable", bEditable);
    },

    /**
     * Create or update a request's details in the backend
     * @private
     * @param {object} oFixedValues - (Optional) override form values with these value/keys
     */
    _save: function _save(oAction) {
      var oFixedValues = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var oRequest = this._oViewModel.getProperty("/state/request");

      var oRequestData = Object.assign(oRequest, oFixedValues);

      if (!oRequestData.id) {
        this._create(oAction, oRequestData);
      } else {
        this._update(oAction, oRequestData);
      }
    },
    _buildRequestUrl: function _buildRequestUrl(sRequestId) {
      return "/Requests(id='" + sRequestId + "')";
    },

    /**
     * Create new request
     */
    _create: function _create(oAction, oRequestData) {
      var _this3 = this;

      this._setBusy(true);

      this._oODataModel.create("/Requests", oRequestData, {
        success: function success(oData, oResponse) {
          if (oData.id) {
            _this3._setRequest({
              requestId: oData.id
            }, oAction);
          } else {
            _this3.handleError("Unexpected system or program error", oResponse);
          }
        },
        error: this.handleError.bind(this)
      });
    },

    /**
     * Update a request
     */
    _update: function _update(oAction, oRequestData) {
      var _this4 = this;

      this._setBusy(true);

      var sPath = this._buildRequestUrl(oRequestData.id);

      this._oODataModel.update(sPath, oRequestData, {
        success: function success(_, oResponse) {
          if (oResponse.statusCode === "204") {
            // Success but .update doesn't return request data - we need to fetch manually
            // in case status or other fields have changed
            var oRequest = _this4.getRequest();

            _this4._setRequest(oRequest, oAction);
          } else {
            _this4.handleError(undefined, oResponse);
          }
        },
        error: this.handleError.bind(this)
      });
    },
    _setRequestData: function _setRequestData(oData) {
      var sPath = "/state/request";

      this._oViewModel.setProperty(sPath, oData);
    },
    _setBusy: function _setBusy(bBusy) {
      this._oViewModel.setProperty("/state/busy", bBusy); // Close messages popover whenever a new action is performed


      var oMessagesButton = this.getMessagesButton();

      if (this._messagePopover && this._messagePopover.isOpen()) {
        this._messagePopover.toggle(oMessagesButton);
      }
    },

    /**
     * Get control by id
     *
     * @param {string} sControlId - id of control as defined in xml fragment
     * @param {string} bComponentPrefix - Prefix control id with component id
     * @param {boolean} bDontThrow - Don't throw exception if control not found
     * @returns {object} - UI5 control
     */
    _byId: function _byId(sControlId) {
      var bComponentPrefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var bDontThrow = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var sFullId = bComponentPrefix ? "".concat(this.getId(), "--").concat(sControlId) : sControlId;
      var oControl = sap.ui.getCore().byId(sFullId);

      if (!oControl && !bDontThrow) {
        throw new Error("Unable to get reference to control ".concat(sFullId));
      }

      return oControl;
    },
    _validateRequest: function _validateRequest() {
      var _this5 = this;

      var messages = [];

      var oRequest = this._oViewModel.getProperty("/state/request");

      var that = this;
      this.oMessageManager.removeAllMessages();
      var mandatoryFields = [{
        name: "name1",
        shortText: "Name",
        description: "Enter the customer's name",
        isRequired: function isRequired() {
          return true;
        }
      }, {
        name: "searchTerm",
        shortText: "Search Term",
        description: "Enter a search term",
        isRequired: function isRequired() {
          return true;
        }
      }, {
        name: "abn",
        shortText: "ABN",
        description: "Enter an ABN",
        isRequired: function isRequired(_ref) {
          var country = _ref.country;
          return country === "AU";
        }
      }, {
        name: "telephone",
        shortText: "Phone",
        description: "Enter a telephone number",
        isRequired: function isRequired() {
          return true;
        }
      }, {
        name: "email",
        shortText: "Email",
        description: "Enter an email address",
        isRequired: function isRequired() {
          return true;
        }
      }, {
        name: "contactName",
        shortText: "Contact Name",
        description: "Enter a contact name",
        isRequired: function isRequired() {
          return true;
        }
      }, {
        name: "contactNameTelephone",
        shortText: "Contact Name Phone",
        description: "Enter a telephone number for the contact name",
        isRequired: function isRequired() {
          return true;
        }
      }, {
        name: "contactNameEmail",
        shortText: "Contact Name Email",
        description: "Enter an email address for the contact name",
        isRequired: function isRequired() {
          return true;
        }
      }, {
        name: "country",
        shortText: "Country",
        description: "Enter a Country",
        isRequired: function isRequired() {
          return true;
        }
      }, {
        name: "street",
        shortText: "Street",
        description: "Enter a Street address",
        isRequired: function isRequired() {
          return true;
        }
      }, {
        name: "city",
        shortText: "City",
        description: "Enter a City",
        isRequired: function isRequired() {
          return true;
        }
      }, {
        name: "region",
        shortText: "Region",
        description: "Enter a Region",
        isRequired: function isRequired() {
          return _this5._byId("regionLabel").getRequired();
        } // Set by formatter

      }, {
        name: "postcode",
        shortText: "Postcode",
        description: "Enter a Postcode",
        isRequired: function isRequired() {
          return true;
        }
      }, {
        name: "salesAdministrator",
        shortText: "Sales Administrator",
        description: "Enter a Sales Administrator",
        isRequired: function isRequired() {
          return true;
        } // Awaiting proper logic

      }, {
        name: "salesEmployee",
        shortText: "Sales Employee",
        description: "Enter a Sales Employee",
        isRequired: function isRequired() {
          return true;
        } // Awaiting proper logic

      }, {
        name: "transportationZone",
        shortText: "Transport Zone",
        description: "Select a Transport Zone",
        isRequired: function isRequired() {
          return true;
        }
      }, {
        name: "priceList",
        shortText: "Price List",
        description: "Enter a Price List",
        isRequired: function isRequired() {
          return true;
        }
      }, {
        name: "currency",
        shortText: "Order Currency",
        description: "Select an Order Currency",
        isRequired: function isRequired() {
          return true;
        }
      }, {
        name: "salesDistrict",
        shortText: "Sales District",
        description: "Select a Sales District",
        isRequired: function isRequired() {
          return true;
        }
      }, {
        name: "salesOffice",
        shortText: "Sales Office",
        description: "Select a Sales Office",
        isRequired: function isRequired() {
          return true;
        }
      }, {
        name: "accountStatementFreq",
        shortText: "Statement Frequency",
        description: "Select a Statement Frequency",
        isRequired: function isRequired() {
          return true;
        }
      }, {
        name: "incoterms",
        shortText: "Incoterms",
        description: "Select Incoterms",
        isRequired: function isRequired() {
          return true;
        }
      }]; // Check all mandatory fields

      mandatoryFields.forEach(function (oField) {
        if (oField.isRequired(oRequest) && !oRequest[oField.name]) {
          messages.push(new Message({
            message: oField.shortText + " is required",
            description: oField.description,
            type: MessageType.Error,
            target: that._sObjectPath + "/" + oField.name,
            processor: _this5._oViewModel
          }));
        }
      }); // Check that the postcode is valid

      if (oRequest.postcode && !postcodeValidator.validatePostcode(this.getModel("countries"), oRequest.country, oRequest.postcode)) {
        messages.push(new Message({
          message: "Postcode is invalid for country " + oRequest.country,
          description: "Enter a valid postcode",
          type: MessageType.Warning,
          target: this._sObjectPath + "/postcode",
          // processor: this.getOwnerComponent().getModel()
          processor: this._oViewModel
        }));
      }

      if (messages.length > 0) {
        this.oMessageManager.addMessages(messages);
        this.fireMessages({
          messages: messages
        });
      }

      return messages.length === 0;
    },

    /**
     * Generate overall status message appropriate to role (requestor/approver) and
     * current request status.
     */
    _generateStatusMessage: function _generateStatusMessage() {
      var sStatus = this._oViewModel.getProperty("/state/request/status");

      if (sStatus === constants.STATUS.APPROVED) {
        this._generateMessage(MessageType.Information, "Request has been approved");
      } else if (sStatus === constants.STATUS.REJECTED) {
        this._generateMessage(MessageType.Information, "Request has been rejected");
      } else {
        var sRole = this.getRole();

        if (sRole === constants.ROLE.REQUESTOR) {
          if (!sStatus) {
            this._generateMessage(MessageType.Information, "Submit the form when complete", "Update the fields that require changing. Once complete");
          } else if (sStatus === constants.STATUS.NEEDS_APPROVAL) {
            this._generateMessage(MessageType.Information, "Request is awaiting approval");
          }
        } else {
          if (sStatus === constants.STATUS.NEEDS_APPROVAL) {
            this._generateMessage(MessageType.Information, "Request is awaiting your approval");
          } else {
            this._generateMessage(MessageType.Information, "Request is not awaiting approval");
          }
        }
      }
    },
    _showDecisionDialog: function _showDecisionDialog(sDecision) {
      this._oViewModel.setProperty("/decisionText", "");

      this._oViewModel.setProperty("/approvalResult", sDecision);

      if (!this._oDecisionDialog) {
        this._oDecisionDialog = sap.ui.xmlfragment("factsheet.req.customer.codan.view.dialog.DecisionTextDialog", this);

        this._oFactSheet.addDependent(this._oDecisionDialog);
      }

      this._oDecisionDialog.open();
    },
    cancelDecisionDialog: function cancelDecisionDialog() {
      if (this._oDecisionDialog) {
        if (this._oDecisionDialog.close) {
          this._oDecisionDialog.close();
        }

        this._oDecisionDialog.destroy();

        delete this._oDecisionDialog;
      }
    },
    okDecisionDialog: function okDecisionDialog() {
      var _this6 = this;

      var sResult = this._oViewModel.getProperty("/approvalResult");

      var sDecisionText = this._oViewModel.getProperty("/decisionText");

      var oAction = sResult === constants.STATUS.APPROVED ? constants.ACTION.APPROVE : constants.ACTION.REJECT;

      if (sResult !== "A" && !sDecisionText) {
        MessageBox.alert("Please enter notes");
        return;
      }

      var oRequest = this.getRequest();

      this._oODataModel.create("/Approvals", {
        id: oRequest.requestId,
        approvalResult: sResult,
        decisionText: sDecisionText
      }, {
        success: function success() {
          // Success
          _this6.cancelDecisionDialog(); //  Reload request to update status and any other fields that might have changed
          // before closing out action


          _this6._setRequest(oRequest, oAction);
        },
        error: this.handleError.bind(this)
      });
    }
  });
});
