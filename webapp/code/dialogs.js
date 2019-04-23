sap.ui.define([
], function() {
	"use strict";

	return {
		
		// --------------------------------------------------------------------
	    // Simple message dialog showing a text
		// --------------------------------------------------------------------
		showMessageDialog : function( oController, sMessageType, sMessage ) {
			var sIcon = "sap-icon://message-information";
			var sValueState = "None";
			var sButtonType = "Emphasized";
			switch (sMessageType) {
				case "S": case "SUCCESS": 
					sIcon = "sap-icon://accept"; 
					sValueState = "Success";
					sButtonType = "Accept";
					break;
				case "W": case "WARNING": 
					sIcon = "sap-icon://alert"; 
					sValueState = "Warning";
					sButtonType = "Emphasized";
					break;
				case "E": case "ERROR":   
					sIcon = "sap-icon://error";   
					sValueState = "Error";
					sButtonType = "Reject";
					break;
			}

			var oDialog = new sap.m.Dialog("messageDialog", {
				icon: sIcon,
				state: sValueState,
				content: [
					new sap.m.Text({ text: sMessage.replace(/@@CRLF@@/g,"\r\n") })
				],
				buttons: [
					new sap.m.Button({
						text: "OK",
						type: sButtonType,
						press: [this.onMessageDialogOk, this]
					})
				]
			});

			oDialog.open();
		},

		onMessageDialogOk : function() {
			var oDialog = sap.ui.getCore().byId("messageDialog");
			oDialog.close();
			oDialog.destroy();
		}
	    
	};

});