importScripts("..\\..\\script\\consts.js");

BUF_SIZE = 32768;

if (MainWindow.Exchange) {
	var ex = MainWindow.Exchange[arg[3]];
	if (ex) {
		var ar = ex.Path.split("|");
		var list = [api.ILCreateFromPath(ar.shift())];
		var mask1 = ar.shift();
		var info1 = ar.shift();
		var filter1 = ar.join("|").replace(/%2F/g, "/").replace(/%25/g, "%");
		var ar2 = filter1.split(/;/);
		for (var i in ar2) {
			var res = /^([^\*\?]+)$/.exec(ar2[i]);
			if (res) {
				ar2[i] = "*" + res[1] + "*";
			}
		}
		filter1 = ar2.join(";");
		var Progress = ex.ProgressDialog;
		Progress.StartProgressDialog(ex.hwnd, null, 0x20);
		try {
			Progress.SetAnimation(hShell32, 150);
			SearchFolders(list, ex.FV, ex.SessionId, ex.Locale, mask1, info1, filter1, Progress);
		} catch (e) { }
		Progress.StopProgressDialog();
		delete MainWindow.Exchange[arg[3]];
	}
}

function SearchFolders(folderlist, FV, SessionId, loc999, mask1, info1, filter1, Progress) {
	var FolderItem;
	var nItems = 0;
	var sItem = String(api.LoadString(hShell32, 38192) || api.LoadString(hShell32, 6466)).replace(/%1!ls!/, "%s");
	var wfd = api.Memory("WIN32_FIND_DATA");
	var nFound = FV.ItemCount(SVGIO_ALLVIEW);
	while (FolderItem = folderlist.shift()) {
		if (Progress.HasUserCancelled()) {
			return;
		}
		var Folder = FolderItem.GetFolder;
		if (!Folder) {
			continue;
		}
		Progress.SetLine(1, FolderItem.Path, true);
		for (var Items = Folder.Items(), i = 0; i < Items.Count && !Progress.HasUserCancelled(); i++) {
			var Item = Items.Item(i);
			api.SHGetDataFromIDList(Item, SHGDFIL_FINDDATA, wfd, wfd.Size);
			var s = ++nItems;
			if (s > loc999) {
				s = s.toLocaleString();
			}
			Progress.SetTitle(api.sprintf(999, sItem, s) + ' (' + nFound + ')');
			var fn = api.GetDisplayNameOf(Item, SHGDN_FORPARSING | SHGDN_ORIGINAL);
			Progress.SetLine(2, wfd.cFileName, true);
			if (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
				if (!/^[A-Z]:\\\$Recycle\.Bin$/i.test(fn)) {
					folderlist.push(Item);
				}
			} else if (api.PathMatchSpec(wfd.cFileName, mask1)) {
				if (api.PathMatchSpec(Item.ExtendedProperty(info1), filter1)) {
					if (FV.AddItem(Item, SessionId) == E_ACCESSDENIED) {
						folderlist = [];
						break;
					}
					nFound = FV.ItemCount(SVGIO_ALLVIEW);
				}
			}
		}
	}
}
