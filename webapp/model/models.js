sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {

		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createUIControlModel: function() {
			var oUIControlModel = new JSONModel({
				userServiceURL: "/services/userapi/",					// URL to user service endpoint
				textRepositoryURL: "/destinations/TextRepository/",		// URL to text repository servlet
				metaflowURL: "/destinations/MetaFlow/",					// URL to MetaFlow engine
				appName: "",											// Application name on SAP Cloud Platform
				providerId: "",											// Provider ID from I18N resource bundle
				customerId: "",											// Customer-ID of current user (subscription or tenant id)
				locale: sap.ui.getCore().getConfiguration().getLanguage().substr(0,2), // cope for longer locales
				uploadFilename: ""
			});
			oUIControlModel.setDefaultBindingMode("TwoWay");
			return oUIControlModel;
		},
		
		createTextModel: function() {
			// These default texts will be used if no backend text repository can be found
			var oTextModel = new JSONModel({
				pageTitle: "Metaflow Importer",
				resizeButton: "Toggle full screen",
				importPanelTitle: "Step 1: Import a BPMN file",
				importUploader: "Import BPMN file",
				cancel: "Cancel"
			});
			oTextModel.setDefaultBindingMode("OneWay");
			return oTextModel;
		}

	};
});