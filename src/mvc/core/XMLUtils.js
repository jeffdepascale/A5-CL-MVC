a5.Package('a5.cl.mvc.core')
	.Static('XMLUtils', function(XMLUtils){
		
		XMLUtils.parseXML = function(xmlString){
			var xml;
			if (window.DOMParser) { // Standards method
				xml = (new DOMParser()).parseFromString(xmlString, "text/xml");
				//check for a parser error
				if (xml.documentElement.nodeName === "parsererror"){
					throw xml.documentElement.childNodes[0].nodeValue;
					return;
				}
			} else { // Internet Explorer method
				xml = new ActiveXObject("Msxml2.DOMDocument.3.0");
				xml.async = "false";
				xml.loadXML(xmlString);
				//check for a parser error
				if (xml.parseError.errorCode != 0){
				    throw ("Error parsing XML. Line " + xml.parseError.line +
					    " position " + xml.parseError.linePos +
					    "\nError Code: " + xml.parseError.errorCode +
		    			"\nError Reason: " + xml.parseError.reason +
					    "Error Line: " + xml.parseError.srcText);
					return;
				}
			}
			//check for a webkit parser error
			if(xml.documentElement.textContent && xml.documentElement.textContent.indexOf('This page contains the following errors:') === 0){
				var msg = xml.documentElement.textContent.replace('This page contains the following errors:', 'Error parsing XML: ');
				throw msg;
			}
			return xml;
		}
		
		XMLUtils.getElementsByTagNameNS = function(xmlElement, tagName, namespaceURI, prefix){
			if(typeof xmlElement.getElementsByTagNameNS === 'function')
				return xmlElement.getElementsByTagNameNS(namespaceURI, tagName);
			else
				return xmlElement.getElementsByTagName(prefix + ':' + tagName);
		}
		
		XMLUtils.getNamedItemNS = function(attributes, attrName, namespaceURI, prefix){
			if(typeof attributes.getNamedItemNS === 'function')
				return attributes.getNamedItemNS(namespaceURI, attrName);
			else
				return attributes.getNamedItem(prefix + ':' + attrName);
		}
		
		XMLUtils.localName = function(xml){
			if(typeof xml.localName === 'string')
				return xml.localName;
			else
				return (xml.tagName ? xml.tagName : xml.name).replace(/.+?:/, '');
		}
		
		XMLUtils.children = function(xmlNode){
			if(xmlNode.children){
				return xmlNode.children;
			} else {
				var children = [],
					x, y, thisNode;
				for(x = 0, y = xmlNode.childNodes.length; x < y; x++){
					thisNode = xmlNode.childNodes[x];
					if(thisNode.nodeType === 1)
						children.push(thisNode);
				}
				return children;
			}
		}
		
		XMLUtils.getPrefix = function(xml){
			if(typeof xml.prefix !== 'undefined'){
				return xml.prefix;
			} else {
				var splitName = xml.tagName ? xml.tagName.split(':') : xml.name.split(':');
				return (splitName.length > 1 ? splitName[0] : null);
			}
		}
	});
