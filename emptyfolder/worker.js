importScripts("..\\..\\script\\consts.js");

if (MainWindow.Exchange) {
	var ex = MainWindow.Exchange[arg[3]];
	if (ex) {
		var ar = ex.Path.split(/\s*;\s*/);
		for (var i in ar) {
			SearchEmptyFolder(ex, ar[i]);
		}
		delete MainWindow.Exchange[arg[3]];
	}
}

function SearchEmptyFolder(ex, path)
{
	if (/^[A-Z]:\\\$Recycle\.Bin$/i.test(path)) {
		return;
	}
	var bAdd = true;
	var wfd = api.Memory("WIN32_FIND_DATA");
	var hFind = api.FindFirstFile(fso.BuildPath(path, "*"), wfd);
	var bFind = hFind != INVALID_HANDLE_VALUE;
	while (bFind && ex.Do) {
		if (!/^\.\.?$/.test(wfd.cFileName)) {
			bAdd = false;
			if (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
				SearchEmptyFolder(ex, fso.BuildPath(path, wfd.cFileName));
			}
		}
		bFind = api.FindNextFile(hFind, wfd);
	}
	api.FindClose(hFind);
	if (bAdd) {
		var pidl = api.ILCreateFromPath(path);
		if (ex.Do) {
			try {
				ex.FV.AddItem(pidl, ex.SessionId);
			} catch (e) {
				return;
			}
		}
	}
}
