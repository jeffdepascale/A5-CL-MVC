
a5.Package('a5.cl.plugins.hashManager')
	
	.Import('a5.cl.CLEvent')
	.Extends('a5.cl.CLPlugin')
	.Class('HashManager', 'singleton final', function(cls, im, HashManager){

		var lastHash,
		trackHash,
		iframe,
		forceOnNext,
		hashDelimiter;
		
		cls.HashManager = function(){
			cls.superclass(this);
			iframe = null;
			lastHash = null;
			forceOnNext = false;
			cls.configDefaults({
				delimiter:'#!'
			});
		}	
		
		cls.Override.initializePlugin = function(){
			browserSupportCheck();
			hashDelimiter = cls.pluginConfig().delimiter;
			if(getHash(true) == "") setLocHash(hashDelimiter);
		}
		
		cls.initialize = function(){
			cls.cl().addEventListener(im.CLEvent.APPLICATION_LAUNCHED, eAppLaunchedHandler);
		}
		
		cls.getHash = function(asString){
			if (asString === true) {
				return lastHash;
			} else {
				var spl = lastHash.split('/');
				spl.shift();
				return spl;
			}
		}
		
		cls.setHash = function(hash, skipUpdate, forceRedirect) {
			var concatHash = '';
			if(hash instanceof Array) hash = hash.join('/');
			if(hash == null || hash == '/') hash = "";
			if (forceRedirect === true || (hash !== lastHash && hash !== getHash())) {
				cls.dispatchEvent(im.CLHashEvent.HASH_WILL_CHANGE, {hashArray:hash});
				if (hash == "") {
					if (skipUpdate === true) lastHash = hashDelimiter;
					setLocHash(hashDelimiter);
				} else {
					if (typeof hash == 'object') {
						for (var i = 0, l=hash.length; i < l; i++) {
							if (hash[i] == undefined && hash[i] == null) {
								hash.splice(i, 1);
								l=hash.length;
								i--;
							}
						}
						for (i = 0, l=hash.length; i < l; i++) 
							concatHash += (hash[i] + (i < hash.length - 1 ? '/' : ''));
					}
					else {
						concatHash = hash;
					}
					if (concatHash.substr(0, 1) == '/') concatHash = concatHash.substr(1);
					if (concatHash.substr(0, hashDelimiter.length) != hashDelimiter) concatHash = hashDelimiter + '/' + concatHash;
					if (skipUpdate === true) lastHash = concatHash;
					setLocHash(concatHash);
				}
				if (forceRedirect) {
					forceOnNext = true;
					update();
				}
			}
		}
		
		var processHash = function(hash){
			hash = hash.substring(hashDelimiter.length);
			hash = ((hash.indexOf('?') !== -1) ? hash.substr(0, hash.indexOf('?')) : hash);
			var parsedLinks = hash.split('/');
			if(parsedLinks[0] === "")
				parsedLinks.shift();
			return parsedLinks;
		},
		
		eAppLaunchedHandler = function(){
			update();
			var oldIE = cls.DOM().clientPlatform() === 'IE' && cls.DOM().browserVersion() < 9;
			if ('onhashchange' in window && !oldIE) {
				window.onhashchange = update;
			} else cls.cl().addEventListener(im.CLEvent.GLOBAL_UPDATE_TIMER_TICK, update);
		},
		
		update = function(){
			var hash = getHash();
			if(hash != lastHash || forceOnNext) {
				forceOnNext = false;
				lastHash = hash;
				if(iframe && lastHash != null) setLocHash(lastHash);
				var parsedLinks = processHash(lastHash);
				cls.dispatchEvent(im.CLHashEvent.HASH_CHANGE, {hashArray:parsedLinks});
			}
		},
		
		getHash = function($ignoreDelimiter){
			var val;
			if (iframe) {
				try {
					if (lastHash != location.hash) val = location.hash;
					else val = getIframeDoc().body.innerText;
				} catch (e) {
					val = lastHash || "";
				}
			} else {
				val = location.hash;
			}
			return val;
		},
		
		
		browserSupportCheck = function(){
	        if (cls.DOM().clientPlatform() == 'IE'&& cls.DOM().browserVersion() < 8) createIframe();
			else if (history.navigationMode) history.navigationMode = 'compatible';
		},	
		
		setLocHash = function (newHash, $forceIframe) {
			var forceIframe = $forceIframe || false;
			if (!forceIframe) location.hash = newHash;
			if (iframe) {
				var doc = getIframeDoc();
				doc.open();
				doc.write('<html><body>' + newHash + '</body></html>');
				doc.close();
			}
		},
	
		createIframe = function () {
			iframe = document.createElement('iframe');
			iframe.style.display = 'none';
			document.getElementsByTagName("head")[0].appendChild(iframe);
		},
		
		getIframeDoc = function(){
			return (iframe.contentDocument) ? iframe.contentDocument:iframe.Document;
		}
		
		
});

a5.Package('a5.cl.plugins.hashManager')

	.Extends('a5.cl.CLEvent')
	.Prototype('CLHashEvent', function(cls, im, CLHashEvent){
		
		CLHashEvent.HASH_CHANGE = 'clHashChangeEvent';
		CLHashEvent.HASH_WILL_CHANGE = 'clHashWillChangeEvent';
		
		cls.CLHashEvent = function(){
			cls.superclass(this);
		}		
});
