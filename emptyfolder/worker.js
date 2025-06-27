importScripts("\\script\\consts.js");

if (MainWindow.Exchange) {
	const ex = MainWindow.Exchange[arg[3]];
	if (ex) {
		delete MainWindow.Exchange[arg[3]];
		const Progress = ex.ProgressDialog;
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
	let path, nItems = 0;
	const sItem = [api.LoadString(hShell32, 12708), api.LoadString(hShell32, 38192) || String(api.LoadString(hShell32, 6466)).replace(/%1!ls!/, "%s")].join(" ");
	Progress.SetLine(1, api.LoadString(hShell32, 13585) || api.LoadString(hShell32, 6478), true);
	const wfd = api.Memory("WIN32_FIND_DATA");
	while (path = folderlist.shift()) {
		if (Progress.HasUserCancelled()) {
			return;
		}
		Progress.SetLine(2, path, true);
		let s = ++nItems;
		if (s > loc999) {
			s = s.toLocaleString();
		}
		Progress.SetTitle(api.sprintf(99, sItem, s));
		let bAdd = true;
		const hFind = api.FindFirstFile(BuildPath(path, "*"), wfd);
		for (let bFind = hFind != INVALID_HANDLE_VALUE; bFind && !Progress.HasUserCancelled(); bFind = api.FindNextFile(hFind, wfd)) {
			if (/^\.\.?$/.test(wfd.cFileName)) {
				continue;
			}
			const fn = BuildPath(path, wfd.cFileName);
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
