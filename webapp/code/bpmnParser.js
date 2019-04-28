sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"../code/dialogs"
], function(JSONModel, Dialogs) {
	"use strict";

	return {
		
		oController: {},
		sNamespace: "",		// xmlns for BPMN nodes
		xmlDOM: null,		// parsed imported BPMN
		tResources: [],		// resources in BMPN
		tDiagrams: [], 		// collaborations in BPMN
		tParticipants: [],	// processes in a diagram in BPMN
		tElements: [],		// elements and flows in BPMN

		// --------------------------------------------------------------------
	    // Interface Functions
		// --------------------------------------------------------------------
		
		importBPMN: function(oController, sBPMN) {
			this.oController = oController;
			// Parse the BPMN content
			if ( window.DOMParser ) {
				var oParser = new DOMParser();
				this.xmlDOM = oParser.parseFromString( sBPMN, "text/xml" );
			} else {
				// IE coding
				this.xmlDOM = new window.ActiveXObject( "Microsoft.XMLDOM" );
				this.xmlDOM.async = false;
				this.xmlDOM.loadXML( sBPMN ); 
			}
			
			if ( this.xmlDOM ) {
				this.parseDOM();
			} else {
				Dialogs.showMessageDialog( oController, "E", oController.getText("messageUnableToParse") );
			}
		},
		
		getDiagrams: function() { 
			return this.tDiagrams; 
		},
		
		getElements: function(sProcessId) {
			this.parseProcess( sProcessId );
			return this.tElements;
		},
		
		getParticipants: function(sDiagramId) { 
			this.parseParticipants( sDiagramId );
			return this.tParticipants; 
		},
		
		getResources: function() { 
			return this.tResources;
		},
		
		// --------------------------------------------------------------------
	    // BPMN Parser
		// --------------------------------------------------------------------
		
		determineNamespace: function() {
			var cBPMNURI = "ht" + "tp://www.omg.org/spec/BPMN/20100524/MODEL";

			var tAttributes = this.xmlDOM.documentElement.attributes;
			for ( var i = 0; i < tAttributes.length; i++ ) {
				if ( tAttributes[i].nodeValue === cBPMNURI ) {
					var tXmlns = tAttributes[i].nodeName.split(":");
					if ( tXmlns.length === 2 ) {
						this.sNamespace = tXmlns[1] + ":";
						return;
					}
				}
			}
			
			this.sNamespace = "";
		},
		
		findNode: function(sNodeName, sNodeId) {
			var tNodes = this.xmlDOM.getElementsByTagName( this.sNamespace + sNodeName );
			for ( var i = 0; i < tNodes.length; i++ ) {
				if ( tNodes[i].nodeType === 1 ) { // Element
					if ( tNodes[i].getAttribute("id") === sNodeId ) {
						return tNodes[i];
					}
				}
			}
			return null;
		},
		
		parseDiagrams: function() {
			var tDOMDiagrams = this.xmlDOM.getElementsByTagName(this.sNamespace + "collaboration");
			for ( var i = 0; i < tDOMDiagrams.length; i++ ) {
				if ( tDOMDiagrams[i].nodeType === 1 ) { // Element
					var oDiagram = {
						index: i,
						id: tDOMDiagrams[i].getAttribute("id"),
						name: tDOMDiagrams[i].getAttribute("name")
					};
					this.tDiagrams.push( oDiagram );
				}
			}
			
			// Cope with missing diagrams at all
			var cDUMMY = "dummy";
			if ( this.tDiagrams.length === 0 ) {
				var oDummy = {
					index: 0,
					id: cDUMMY,
					name: this.oController.getText("missingObject")
				};
				this.tDiagrams.push( oDummy );
			}
		},
		
		parseDOM: function() {
			this.tResources.length = 0;
			this.tDiagrams.length = 0;

			this.determineNamespace();
			// this.parseResources(); -- not really of any interest
			this.parseDiagrams();
		},
		
		parseParticipants: function(sDiagramId) {
			this.tParticipants.length = 0;
			
			// Cope with dummy diagram if missing at all
			var cDUMMY = "dummy";
			if ( sDiagramId === cDUMMY ) {
				var oDummy = {
					diagramId: cDUMMY,
					id: cDUMMY,
					name: this.oController.getText("missingObject"),
					processRef: cDUMMY
				};
				this.tParticipants.push( oDummy );
				return;
			}
			
			var oDiagramNode = this.findNode( "collaboration", sDiagramId );
			if (!oDiagramNode) { return; }
			
			var tDOMParticipants = oDiagramNode.getElementsByTagName(this.sNamespace + "participant");
			for ( var i = 0; i < tDOMParticipants.length; i++ ) {
				if ( tDOMParticipants[i].nodeType === 1 ) { // Element
					if ( tDOMParticipants[i].getAttribute("name") !== "Main Process" ) { // filter 'Main Process'
						var oParticipant = {
							diagramId: sDiagramId,
							id: tDOMParticipants[i].getAttribute("id"),
							name: tDOMParticipants[i].getAttribute("name"),
							processRef: tDOMParticipants[i].getAttribute("processRef")
						};
						this.tParticipants.push( oParticipant );
					}
				}
			}
		},
		
		parseProcess: function(sProcessId) {
			this.tElements.length = 0;
			
			var cDUMMY = "dummy";
			var oProcessNode = null;
			if ( sProcessId === cDUMMY ) {
				oProcessNode = this.xmlDOM.documentElement.getElementsByTagName(this.sNamespace + "process")[0];
			} else {
				oProcessNode = this.findNode( "process", sProcessId );
			}
			if ( !oProcessNode ) { return; }
			
			var bHasStartEvent = false;
			
			for ( var i = 0; i < oProcessNode.childNodes.length; i++ ) {
				if ( oProcessNode.childNodes[i].nodeType === 1 ) { // Element
					var sNodeName = oProcessNode.childNodes[i].nodeName;
					var tXmlns = oProcessNode.childNodes[i].nodeName.split(":");
					if ( tXmlns.length === 2 ) {
						sNodeName = tXmlns[1];
					}
					
					var oElement = {
						id: oProcessNode.childNodes[i].getAttribute("id"),
						type: sNodeName,
						name: oProcessNode.childNodes[i].getAttribute("name"),
						value: "",
						sourceRef: "",
						targetRef: "",
						icon: "sap-icon://question-mark",
						color: "",
						message: ""
					};
					
					switch ( sNodeName ) {
						case "startEvent":
							if ( bHasStartEvent ) {	// More than one start event found -> error
								oElement.icon = "sap-icon://alert";
								oElement.color = "red";
								oElement.message = this.oController.getText("messageMultipleStartEvents");
							} else {
								bHasStartEvent = true;
								oElement.icon = "sap-icon://sys-enter-2";
								oElement.color = "green";
							}
							break;
						case "task":
						case "userTask":
							this.parseUserTask( oProcessNode.childNodes[i], oElement );
							break;
						case "parallelGateway":
						case "exclusiveGateway":
						case "inclusiveGateway":
							oElement.icon = "sap-icon://sys-enter-2";
							oElement.color = "green";
							oElement.value = oProcessNode.childNodes[i].getAttribute("gatewayDirection");
							break;
						case "sequenceFlow":
							this.parseSequenceFlow( oProcessNode.childNodes[i], oElement );
							break;
						case "serviceTask":
						case "receiveTask":
						case "intermediateCatchEvent":
						case "endEvent":
							// valid element
							oElement.icon = "sap-icon://sys-enter-2";
							oElement.color = "green";
							break;
						default:
							// invalid element -> skip
							oElement.icon = "sap-icon://alert";
							oElement.color = "red";
							oElement.message = this.oController.getText("messageInvalidElement");
							continue;
					}
					
					this.tElements.push( oElement );
				}
			}
		},
		
		parseResources: function() {
			var tDOMResources = this.xmlDOM.getElementsByTagName(this.sNamespace + "resource");
			for ( var i = 0; i < tDOMResources.length; i++ ) {
				if ( tDOMResources[i].nodeType === 1 ) { // Element
					var oResource = {
						id: tDOMResources[i].getAttribute("id"),
						name: tDOMResources[i].getAttribute("name"),
						documentation: ( tDOMResources[i].getElementsByTagName("documentation")[0].childNodes.length > 0 ) ?
							tDOMResources[i].getElementsByTagName("documentation")[0].childNodes[0].nodeValue :
							""
					};
					this.tResources.push( oResource );
				}
			}
		},
		
		parseSequenceFlow: function(oFlowNode, oElement) {
			if ( !oFlowNode || !oElement ) { return; }
			
			oElement.sourceRef = oFlowNode.getAttribute("sourceRef");
			oElement.targetRef = oFlowNode.getAttribute("targetRef");
			if ( oElement.sourceRef && oElement.targetRef ) {
				oElement.icon = "sap-icon://sys-enter-2";
				oElement.color = "green";
			}
			
			var tConditionNodes = oFlowNode.getElementsByTagName(this.sNamespace + "conditionExpression");
			if ( tConditionNodes.length > 0 ) {
				for ( var i = 0; i < tConditionNodes.length; i++ ) {
					if ( tConditionNodes[i].nodeType === 1 ) { // Skip whitespace text nodes
						oElement.value += tConditionNodes[i].innerHTML;
					}
				}
			}
		},
		
		parseUserTask: function(oTaskNode, oElement) {
			if ( !oTaskNode || !oElement ) { return; }
			
			var tResourceRoleNodes = oTaskNode.getElementsByTagName(this.sNamespace + "resourceRole");
			if ( tResourceRoleNodes.length > 0 ) {
				if ( tResourceRoleNodes[0].childNodes.length > 0 ) {
					oElement.icon = "sap-icon://sys-enter-2";
					oElement.color = "green";
					for ( var i = 0; i < tResourceRoleNodes[0].childNodes.length; i++ ) {
						if ( tResourceRoleNodes[0].childNodes[i].nodeType === 1 ) { // Skip whitespace text nodes
							oElement.value += tResourceRoleNodes[0].childNodes[i].innerHTML;
						}
					}
				} else {
					oElement.icon = "sap-icon://alert";
					oElement.color = "red";
					oElement.message = this.oController.getText("messageNoActorForUserTask");
				}
			} else {
				oElement.icon = "sap-icon://alert";
				oElement.color = "red";
				oElement.message = this.oController.getText("messageNoActorForUserTask");
			}
		},
		
		// --------------------------------------------------------------------
	    // Utility stuff
		// --------------------------------------------------------------------
		
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