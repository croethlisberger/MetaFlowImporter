sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"../code/dialogs"
], function(JSONModel, Dialogs) {
	"use strict";

	return {

		importBPMN: function(oController, sBPMN) {
			var that = this;
			var oView = oController.getView();
			var oUIControlModel = oView.getModel( "uiControlModel" );
			
			//var sServiceURL = oUIControlModel.getProperty("/metaflowURL") + "import?customerId=" + oUIControlModel.getProperty("/customerId");
			var sServiceURL = oUIControlModel.getProperty("/metaflowURL") + "import";

			jQuery.ajax({
				type: "POST",
				url: sServiceURL,
				data: sBPMN,
				contentType: "text/xml",
				dataType: "text",
				success: function(oResponse) {
					var sResponseJSON = JSON.stringify( oResponse );
					if ( that.isJson( sResponseJSON ) ) {
						// ToDo....
					} else {
						Dialogs.showMessageDialog( oController, "E", oResponse.toString() );
					}				
				},
				error: function(xhr) {
					Dialogs.showMessageDialog( oController, "E", xhr.responseText );
				}
			});
		},
		
		isJson: function(str) {
		    try {
		        var oTest = JSON.parse(str);
		        if ( ( oTest instanceof Object ) || ( oTest instanceof Array ) ) {
		        	return true;
		        } else {
		        	return false;
		        }
		    } catch (e) {
		        return false;
		    }
		}
		
	};

});