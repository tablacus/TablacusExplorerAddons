importScripts("..\\..\\script\\consts.js");

BUF_SIZE = 32768;

if (MainWindow.Exchange) {
	var ex = MainWindow.Exchange[arg[3]];
	if (ex) {
		var ar = ex.Path.split("|");
		var list = [ar.shift()];
		var mask1 = ar.shift();
		var filter1 = ar.join("|").replace(/%2F/g, "/").replace(/%25/g, "%");
		var length1 = filter1.length * 2;
		var Progress = ex.ProgressDialog;
		Progress.StartProgressDialog(ex.hwnd, null, 0x20);
		try {
			Progress.SetAnimation(hShell32, 150);
			SearchFolders(list, ex.FV, ex.SessionId, ex.Locale, mask1, length1, new RegExp(filter1.replace(/([\+\*\.\?\^\$\[\-\]\|\(\)\\])/g, "\\$1"), "i"), Progress);
		} catch (e) {}
		Progress.StopProgressDialog();
		delete MainWindow.Exchange[arg[3]];
		ex.NavigateComplete(ex.FV);
	}
}

function SearchFolders(folderlist, FV, SessionId, loc999, mask1, length1, re1, Progress)
{
	var bAdd, path;
	var nItems = 0;
	var sItem = String(api.LoadString(hShell32, 38192) || api.LoadString(hShell32, 6466)).replace(/%1!ls!/, "%s");
	var wfd = api.Memory("WIN32_FIND_DATA");
	while (path = folderlist.shift()) {
		if (Progress.HasUserCancelled()) {
			return;
		}
		Progress.SetLine(1, path, true);
		var hFind = api.FindFirstFile(fso.BuildPath(path, "*"), wfd);
		for (var bFind = hFind != INVALID_HANDLE_VALUE; bFind && !Progress.HasUserCancelled(); bFind = api.FindNextFile(hFind, wfd)) {
			if (/^\.\.?$/.test(wfd.cFileName)) {
				continue;
			}
			var s = ++nItems;
			if (s > loc999) {
				s = s.toLocaleString();
			}
			Progress.SetTitle(api.sprintf(999, sItem, s));
			var fn = fso.BuildPath(path, wfd.cFileName);
			Progress.SetLine(2, wfd.cFileName, true);
			if (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
				if (!/^[A-Z]:\\\$Recycle\.Bin$/i.test(fn)) {
					folderlist.push(fn);
				}
			} else if (api.PathMatchSpec(wfd.cFileName, mask1)) {
				if (length1) {
					bAdd = false;
					var ado = te.CreateObject(api.ADBSTRM);
					var charset = "_autodetect_all";
					try {
						ado.CharSet = "iso-8859-1";
						ado.Open();
						ado.LoadFromFile(fn);
						var s = ado.ReadText(3);
						if (/^\xEF\xBB\xBF/.test(s)) {
							charset = 'utf-8';
						} else if (/^\xFF\xFE|^\xFE\xFF/.test(s)) {
							charset = 'unicode';
						}
						ado.Position = 0;
						ado.CharSet = charset;
						var n = -1;
						while (!ado.EOS && n < 0) {
							if (ado.Position > length1) {
								ado.Position = ado.Position - length1;
							}
							var s = ado.readText(BUF_SIZE);
							n = s.indexOf("\0");
							if (n >= 0) {
								s = s.substr(0, n);
							}
							if (re1.test(s)) {
								bAdd = true;
								break;
							}
						}
					} catch (e) {}
					ado.close();
				} else {
					bAdd = true;
				}
				if (bAdd && FV.AddItem(api.ILCreateFromPath(fn), SessionId) == E_ACCESSDENIED) {
					folderlist = [];
					break;
				}
			}
		}
		api.FindClose(hFind);
	}
}
