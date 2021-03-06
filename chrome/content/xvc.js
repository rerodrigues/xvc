
var xvc = {
  
	init: function () {
		xvc.stringBundle = document.getElementById('xvc_stringbundle');
		xvc.outputFormats = xvc.stringBundle.getString('xvc.outputFormats').split(',');
		xvc.checkEncoder(xvc.outputFormats);
		xvc.initRemix();
        
		/*if (document.getElementById('appcontent')) {
			document.getElementById('appcontent').addEventListener('DOMContentLoaded', xvc.run, true);
		}*/
	},
	/*
	run: function(event) {
		
		xvc.document = event.originalTarget;
		
		if (xvc.isMediaPage() && xvc.isMediaVideo()) {
			
			xvc.mediaId = xvc.document.getElementById('postMediaId').value;
			xvc.mediaStorage = xvc.document.getElementById('postMediaFileStorage').value;
			xvc.mediaHashId = xvc.document.getElementById('postMediaHashId').value;
			xvc.mediaExtension = xvc.stringBundle.getString('xvc.media.fileExtension');
			xvc.mediaFlv = xvc.mediaStorage + '/' + xvc.mediaId + xvc.mediaExtension;
			
			var newA = xvc.document.createElement('a');
			var newLi = xvc.document.createElement('li');
			var mediaActions = xvc.document.getElementById('mediaActions');
			
			newA.id = 'downloadVideo';
			newA.href = xvc.mediaFlv;
			newA.textContent = xvc.stringBundle.getString('xvc.downloadLink.caption');
			newLi.style.background = 'transparent url(http://mais.i.uol.com.br/images/action-downloadvideo.gif) no-repeat scroll 0 0';
			newLi.appendChild(newA);
			mediaActions.appendChild(newLi);
			
			newA.addEventListener('click', xvc.downloadMedia, false);
			
		}
		
	},
	
	isMediaPage: function() {
		return (xvc.document.location.href.toString().match(xvc.stringBundle.getString('xvc.urlPattern')));
	},
	
	isMediaVideo: function() {
		return (xvc.document.getElementById('postMediaType') && xvc.document.getElementById('postMediaType').value == 'V');
	},
	
	downloadMedia: function(e) {
		e.stopPropagation();
		e.preventDefault();
		
		if(xvc.showFileSave() && xvc.saveFileToDisk()) {
			xvc.executeConverterLaunch(xvc.outputFormats);
		}
	},
	
	showFileSave: function() {
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var filePicker = Components.classes['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
		
		filePicker.init(window, xvc.stringBundle.getString('xvc.fileSave.title'), nsIFilePicker.modeSave);
		filePicker.appendFilter(xvc.stringBundle.getString('xvc.fileSave.filter'), '*' + xvc.mediaExtension);
		filePicker.appendFilters(nsIFilePicker.filterAll);
		filePicker.defaultString = xvc.mediaHashId.replace(/(.*)-[^-]*$/,"$1") + xvc.mediaExtension;
		
		var result = filePicker.show();
		if (result == nsIFilePicker.returnOK || result == nsIFilePicker.returnReplace) {
			xvc.filePointer = filePicker.file;
			xvc.inputFiles = new Array(filePicker.file.path.toString());
			return true;
		} else {
			return false;
		}
	},
	
	saveFileToDisk: function (){
		var ioService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
		var webBrowserPersist = Components.classes['@mozilla.org/embedding/browser/nsWebBrowserPersist;1'].createInstance(Components.interfaces.nsIWebBrowserPersist);
		
		try {
			webBrowserPersist.saveURI(ioService.newURI(xvc.mediaFlv, null, null), null, null, null, '', xvc.filePointer);		
			return true;
		} catch(e) {
			alert(e);
			return false;
		}
	},*/
	
	// Ugly, but the only way to launch external command line programs with parameters :-(
	executeConverterLaunch: function (outputFormats) {
        var directory, localFile, fileOutputStream, fileContent,
            i, j, encoderPath, encoderArgs;
        
		directory = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("TmpD", Components.interfaces.nsIFile);
		localFile = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
		fileOutputStream = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);

		fileContent = "chcp 1252\n" + xvc.stringBundle.getFormattedString('xvc.homeCommand', [directory.path]) + "\n";
		
        for (i in xvc.inputFiles) {
			for (j in outputFormats) {
				encoderPath = xvc.stringBundle.getString('xvc.encoder.path.' + outputFormats[j]);
				encoderArgs = xvc.stringBundle.getFormattedString(('xvc.encoder.args.' + outputFormats[j]), [ xvc.inputFiles[i], (xvc.inputFiles[i].replace(/\.[^.]*$/, '') + '_' + outputFormats[j]), (xvc.inputFiles[i].replace(/\.[^.]*$/, ''))]);
				
				fileContent += '"' + encoderPath + '" ' + encoderArgs + "\n";
			}
		}
		fileContent += xvc.stringBundle.getFormattedString('xvc.revealCommand', [xvc.inputFiles[0]]);
		
		try {
			localFile.initWithPath(xvc.stringBundle.getFormattedString('xvc.batchFile', [directory.path]));
			fileOutputStream.init(localFile, 0x02 | 0x08 | 0x20, 00666, 0);
			fileOutputStream.write(fileContent, fileContent.length);
			fileOutputStream.close();
			localFile.launch();
		} catch (e) {
			alert(e);
		}
	},
	
	// Sadly the following function doesn't work with command line programs (like mencoder) :-(
	executeConverterProcess: function (outputFormats) {
        var localFile, process,
            i, j, encoderPath, strEncoderArgs, encoderArgs = null;
		
        localFile = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
		process = Components.classes['@mozilla.org/process/util;1'].createInstance(Components.interfaces.nsIProcess);
		
		for (i in xvc.inputFiles) {
			for (j in outputFormats) {
				encoderPath = xvc.stringBundle.getString('xvc.encoder.path.' + outputFormats[j]);
				strEncoderArgs = xvc.stringBundle.getFormattedString(('xvc.encoder.args.' + outputFormats[j]), [xvc.inputFiles[i].replace(/\.[^.]*$/, '')]);
				encoderArgs = strEncoderArgs.match(/-[^-]*/g);
				if (encoderArgs === null) {
                    encoderArgs = [];
                };
				encoderArgs.unshift(xvc.inputFiles[i]);
				//prompt('',encoderArgs.join(' '));
				
				try {
					localFile.initWithPath(encoderPath);
					process.init(localFile);
					process.run(false, encoderArgs, encoderArgs.length);
				} catch(e) {
					alert(e);
				};
			}
		}
	},
	
	checkEncoder: function (formats) {
		var localFile, i, encoderPath;
		
        localFile = Components.classes['@mozilla.org/file/local;1'].getService(Components.interfaces.nsILocalFile);
		
		for (i in formats) {
			encoderPath = xvc.stringBundle.getString('xvc.encoder.path.' + formats[i]);
			
			try {
				localFile.initWithPath(encoderPath);
				if (!localFile.exists()){
					alert(xvc.stringBundle.getFormattedString('xvc.alert.encoderNotFound', [formats[i], encoderPath]) )
					xvc.installEncoder(encoderPath);
				};
			} catch(e) {
				alert(e);
			}
		}
		return true;
	},
	
	installEncoder: function (encoderPath){
        var process, localFile, extensionPath, installerPath;
        
		process = Components.classes["@mozilla.org/process/util;1"].getService(Components.interfaces.nsIProcess);
		localFile  = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
		extensionPath = Components.classes['@mozilla.org/extensions/manager;1'].getService(Components.interfaces.nsIExtensionManager).getInstallLocation('xvc@renatorodrigues.com').getItemLocation('xvc@renatorodrigues.com');
		installerPath = extensionPath.path + '\\' + encoderPath.toString().match(/([^\\]*)\.[^.]*$/)[1] + '_installer.exe';
		
		try {
			localFile.initWithPath(installerPath);
			if (localFile.exists()){
				process.init(localFile);
				process.run(true, [], 0);
			} else {
				alert( xvc.stringBundle.getFormattedString('xvc.alert.installerNotFound', [installerPath]) );
			}
		} catch(e) {
			alert(e);
		}
	},
	
	initRemix: function() {
        var appInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
        var versionChecker = Components.classes["@mozilla.org/xpcom/version-comparator;1"].getService(Components.interfaces.nsIVersionComparator);
        
        xvc.availableFormats = Application.prefs.getValue("extensions.xvc.availableFormats",0).split(',');
		xvc.checkEncoder(xvc.availableFormats);
        
        var label = xvc.stringBundle.getString('xvc.convertLocalFile');
        
        // item no menu ferramentas
        var newMenu = document.createElement('menu');
        var popup = newMenu.appendChild(document.createElement('menupopup'));
        newMenu.setAttribute('label', label);
        newMenu.setAttribute('id', 'xvc-toolsmenu');
        
        xvc.createItemMenu(xvc.availableFormats, popup);
        document.getElementById('menu_ToolsPopup').insertBefore(newMenu, document.getElementById('sanitizeSeparator'));
            
        // caso seja uma versão maior que a 4.0, em novos locais
        
        var opt = Application.prefs.getValue("extensions.xvc.options",0);
        if ((versionChecker.compare(appInfo.version, "4.0") >= 0) && (opt >= 1)) {
        
            // item no menu firefox (appmenu) [firefox4]
            if (opt === 1 || opt === 3) {
                var newAppMenu = document.createElement('splitmenu');
                var appPopup = newAppMenu.appendChild(document.createElement('menupopup'));
                newAppMenu.setAttribute('label', label);
                newAppMenu.setAttribute('id', 'xvc-appmenu');
                
                xvc.createItemMenu(xvc.availableFormats, appPopup);
                document.getElementById('appmenuSecondaryPane').insertBefore(newAppMenu, document.getElementById('appmenu_help'));
            }
            
            // item no status bar [firefox4]
            if (opt === 2 || opt === 3) {
                var newStatusBarIcon = document.createElement('toolbarbutton');
                var statusBarPopup = newStatusBarIcon.appendChild(document.createElement('menupopup'));
                newStatusBarIcon.setAttribute('label', label);
                newStatusBarIcon.setAttribute('id','xvc-appbar');
                newStatusBarIcon.setAttribute('removable','true');
                newStatusBarIcon.setAttribute('type','menu');
                
                
                xvc.createItemMenu(xvc.availableFormats, statusBarPopup);
                document.getElementById('addon-bar').insertBefore(newStatusBarIcon, document.getElementById('status-bar'));
            }
        }
	},
    
    // params: formatos, o elemento, o filho dele, onde vai, do lado de quem
    createItemMenu: function (formats, elem) {
		for (var i in formats) {
			elem.appendChild(xvc.addFormatMenu(formats[i], xvc.stringBundle.getFormattedString('xvc.convertToFormat', [ xvc.stringBundle.getString('xvc.encoder.name.' + formats[i]) ])));
		}
        elem.appendChild(xvc.addFormatMenu(xvc.availableFormats.join(','), xvc.stringBundle.getString('xvc.convertToAllFormats')));
    },
	
	addFormatMenu: function (format, label) {
		var newMenuItem = document.createElement('menuitem');
		newMenuItem.setAttribute('format' , format);
		newMenuItem.setAttribute('label' , label);
		//newMenuItem.setAttribute('command', xvc.convertMedia);
		newMenuItem.addEventListener('command', xvc.convertMedia, false);
		return newMenuItem;
	},
	
	convertMedia: function(event) {
		if(xvc.showFileOpen()){
			xvc.executeConverterLaunch(event.target.getAttribute('format').toString().split(','));
		}
	},
	
	showFileOpen: function() {
        var nsIFilePicker, filePicker,
            result, files;
        
		nsIFilePicker = Components.interfaces.nsIFilePicker;
		filePicker = Components.classes['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
		
		filePicker.init(window, xvc.stringBundle.getString('xvc.fileOpen.title'), nsIFilePicker.modeOpenMultiple);
		filePicker.appendFilters(nsIFilePicker.filterAll);
		
		result = filePicker.show();
		if (result == nsIFilePicker.returnOK) {
			xvc.inputFiles = new Array();
			files = filePicker.files;
			while (files.hasMoreElements()) {
				xvc.inputFiles.push(files.getNext().QueryInterface(Components.interfaces.nsILocalFile).path.toString());
			}
			return true;
		} else {
			return false;
		}
	}
}

window.addEventListener('load', xvc.init, false);