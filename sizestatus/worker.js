importScripts("..\\..\\script\\consts.js");

if (MainWindow.Exchange) {
	var ex = MainWindow.Exchange[arg[3]];
	if (ex) {
		try {
			var SizeStatus = ex.SizeStatus;
			var SessionId = ex.SessionId;
			var nSize = ex.nSize;
			var path;
			var folderlist = ex.list.split("\0");
			var wfd = api.Memory("WIN32_FIND_DATA");
			while (path = folderlist.shift()) {
				if (SizeStatus.SessionId != SessionId) {
					return;
				}
				var fn = fso.GetFileName(path);
				var nTFS = ex.FV.TotalFileSize[fn];
				if (!api.UQuadCmp(nTFS, 0)) {
					nTFS = CalcSize([path], wfd, SizeStatus, SessionId);
					if (nTFS) {
						SizeStatus.Set(ex.FV, fn, SessionId, nTFS);
					}
				}				
				nSize = api.UQuadAdd(nSize, nTFS);
			}
			SizeStatus.Show(nSize, SessionId);
		} catch (e) {}
		delete MainWindow.Exchange[arg[3]];
	}
}

function CalcSize(folderlist, wfd, SizeStatus, SessionId)
{
	var nSize = 0;
	while (path = folderlist.shift()) {
		if (SizeStatus.SessionId != SessionId) {
			return 0;
		}
		var hFind = api.FindFirstFile(fso.BuildPath(path, "*"), wfd);
		for (var bFind = hFind != INVALID_HANDLE_VALUE; bFind; bFind = api.FindNextFile(hFind, wfd)) {
			if (/^\.\.?$/.test(wfd.cFileName)) {
				continue;
			}
			if (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
				folderlist.push(fso.BuildPath(path, wfd.cFileName));
				continue;
			}
			nSize = api.UQuadAdd(nSize, api.UQuadPart(wfd.nFileSizeLow, wfd.nFileSizeHigh));
		}
		api.FindClose(hFind);
	}
	return nSize;
}