sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"../model/models",
	"../code/bpmnParser"
], function (Controller, JSONModel, Models, Parser) {
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
		
		onChangeDiagram: function() {
			var oView = this.getView();
			var oSelectDiagram = oView.byId("selectDiagram");
			var nDiagramIndex = oSelectDiagram.getSelectedKey();
			
			this.showPart2(nDiagramIndex);
		},
		
		onChangeProcess: function() {
			var oView = this.getView();
			var oSelectProcess = oView.byId("selectProcess");
			var sProcessId = oSelectProcess.getSelectedKey();
			
			this.showPart3(sProcessId);
		},

		onImport: function(oEvent) {
			var that = this;
			
			var oReader = new FileReader();
			oReader.addEventListener("load", function() {
				var bpmnContent = oReader.result;
				Parser.importBPMN( that, bpmnContent );
				
				if ( Parser.getDiagrams() ) {
					that.showPart2(0);
				}
			});
			
			var oFile = oEvent.getParameters().files[0];
			if ( oFile ) {
				oReader.readAsText( oFile );
			}
		},

		/////////////////////////////////////////////////////////////////////////
		// Functions
		/////////////////////////////////////////////////////////////////////////
		
		getText: function(sTextName) {
			return this.getView().getModel("textModel").getProperty("/" + sTextName);
		},
		
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
		},
		
		showPart2: function(nDiagramIndex) {
			// Get parser data
			var tDiagrams = Parser.getDiagrams();
			
			var tParticipants = [];
			if ( tDiagrams.length > nDiagramIndex ) {
				tParticipants = Parser.getParticipants( tDiagrams[nDiagramIndex].id );
			}
			
			// Create models and bind to view
			var oView = this.getView();
			
			var oDiagramModel = new JSONModel( tDiagrams );
			oView.setModel( oDiagramModel, "diagramModel" );

			var oParticipantsModel = new JSONModel( tParticipants );
			oView.setModel( oParticipantsModel, "processModel" );
			
			// Show part 2
			var oSelectPanel = oView.byId("selectPanel");
			oSelectPanel.setVisible(true);
			
			// Show part 3 if possible
			if ( tParticipants.length > 0 ) {
				this.showPart3( tParticipants[0].processRef );
			}
		},
		
		showPart3: function(sProcessId) {
			// Create model and bind to view
			var oView = this.getView();
			
			var oElementsModel = new JSONModel( Parser.getElements( sProcessId ) );
			oView.setModel( oElementsModel, "elementModel" );
			
			// Show part 3
			var oProcessPanel = oView.byId("processPanel");
			oProcessPanel.setVisible(true);
			
			var oSaveButton = oView.byId("saveButton");
			oSaveButton.setVisible(true);
		}

	});
});