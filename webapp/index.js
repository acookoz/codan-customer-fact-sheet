"use strict";

/**
 * Set up demo/unit test page for running embedded component
 */
sap.ui.getCore().attachInit(function () {
  sap.ui.require(["factsheet/req/customer/codan/LocalTestClient"], function (oClient) {
    oClient.init();
  });
});
