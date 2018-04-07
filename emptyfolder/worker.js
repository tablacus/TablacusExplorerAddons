importScripts("\\script\\consts.js");

if (MainWindow.Exchange) {
	var ex = MainWindow.Exchange[arg[3]];
	if (ex) {
		delete MainWindow.Exchange[arg[3]];
		var Progress = ex.ProgressDialog;
		Progress.StartProgressDialog(ex.hwnd, null, 0x20);
		try {
			SearchFolders(ex.Path.split(/\s*;\s*/), ex.FV, ex.SessionId, ex.Locale, Progress);
		} catch (e) {}
		Progress.StopProgressDialog();
		ex.NavigateComplete(ex.FV);
	}
}

function SearchFolders(folderlist, FV, SessionId, loc999, Progress)
{
	var path, nItems = 0;
	var sItem = [api.LoadString(hShell32, 12708), api.LoadString(hShell32, 38192) || String(api.LoadString(hShell32, 6466)).replace(/%1!ls!/, "%s")].join(" ");
	Progress.SetLine(1, api.LoadString(hShell32, 13585) || api.LoadString(hShell32, 6478), true);
	var wfd = api.Memory("WIN32_FIND_DATA");
	while (path = folderlist.shift()) {
		if (Progress.HasUserCancelled()) {
			return;
		}
		Progress.SetLine(2, path, true);
		var s = ++nItems;
		if (s > loc999) {
			s = s.toLocaleString();
		}
		Progress.SetTitle(api.sprintf(99, sItem, s));
		var bAdd = true;
		var hFind = api.FindFirstFile(fso.BuildPath(path, "*"), wfd);
		for (var bFind = hFind != INVALID_HANDLE_VALUE; bFind && !Progress.HasUserCancelled(); bFind = api.FindNextFile(hFind, wfd)) {
			if (/^\.\.?$/.test(wfd.cFileName)) {
				continue;
			}
			var fn = fso.BuildPath(path, wfd.cFileName);
			if (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
				if (!/^[A-Z]:\\\$Recycle\.Bin$/i.test(fn)) {
					folderlist.push(fn);
				}
			}
			bAdd = false;
		}
		api.FindClose(hFind);
		if (bAdd && FV.AddItem(api.ILCreateFromPath(path), SessionId) == E_ACCESSDENIED) {
			break;
		}
	}
}
