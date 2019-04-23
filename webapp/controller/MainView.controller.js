sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"../model/models",
	"../code/metaflow"
], function (Controller, JSONModel, Models, Metaflow) {
	"use strict";

	return Controller.extend("MetaflowImporter.MetaflowImporter.controller.MainView", {
		/////////////////////////////////////////////////////////////////////////
		// Event handlers
		/////////////////////////////////////////////////////////////////////////

		onInit: function () {
			var oView = this.getView();

			var oUIControlModel = Models.createUIControlModel();
			oView.setModel( oUIControlModel, "uiControlModel" );
			
			// Get app id from manifest and provider id from i18n
			var sAppName = this.getOwnerComponent().getManifestEntry("/sap.app/tags/keywords")[0];
			oUIControlModel.setProperty( "/appName", sAppName );
			
			var sProviderId = oView.getModel("i18n").getResourceBundle().getText("providerName");
			oUIControlModel.setProperty( "/providerId", sProviderId );

			// Get customer id from tenant or subscription; translate to provider id if equal to app name (= master edit mode)
			var sCustomerId = window.location.host.split("-")[0];
			if ( sCustomerId === sAppName.toLowerCase() ) {	sCustomerId = sProviderId; }
			oUIControlModel.setProperty("/customerId", sCustomerId);
			
			// Set UI texts
			this.setUiTexts();
		},
		
		onImport: function(oEvent) {
			var that = this;
			
			var oReader = new FileReader();
			oReader.addEventListener("load", function() {
				var bpmnContent = oReader.result;
				Metaflow.importBPMN( that, bpmnContent );
			});
			
			var oFile = oEvent.getParameters().files[0];
			if ( oFile ) {
				oReader.readAsText( oFile );
			}
		},

		/////////////////////////////////////////////////////////////////////////
		// Functions
		/////////////////////////////////////////////////////////////////////////
		
		setUiTexts: function() {
			var oView = this.getView();
			var oUIControlModel = oView.getModel( "uiControlModel" );
			
			var sServiceURL = oUIControlModel.getProperty("/textRepositoryURL") + "uiTexts";
			sServiceURL += "?providerId=" + oUIControlModel.getProperty("/providerId");
			sServiceURL += "&customerId=" + oUIControlModel.getProperty("/customerId");
			sServiceURL += "&objectId=" + oUIControlModel.getProperty("/appName");
			sServiceURL += "&language=" + oUIControlModel.getProperty("/locale");
			
			var oTextModel = oView.getModel("textModel");
			if ( !oTextModel ) {
				oTextModel = Models.createTextModel();
				oView.setModel( oTextModel, "textModel" );
			}
			
			var oTextRepoModel = new JSONModel( sServiceURL );
			oTextRepoModel.attachRequestCompleted(function(oResponse) {
				var oRepoTexts = this.getData();
				oTextModel.setData( oRepoTexts, true );
			});
		}

	});
});