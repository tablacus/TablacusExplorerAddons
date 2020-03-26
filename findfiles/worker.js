importScripts("..\\..\\script\\consts.js");

BUF_SIZE = 32768;

if (MainWindow.Exchange) {
	var ex = MainWindow.Exchange[arg[3]];
	if (ex) {
		var ar = ex.Path.split("|");
		var list = [api.ILCreateFromPath(ar.shift())];
		var mask1 = ar.shift();
		var filter1 = ar.join("|").replace(/%2F/g, "/").replace(/%25/g, "%");
		var length1 = filter1.length * 2;
		var Progress = ex.ProgressDialog;
		Progress.StartProgressDialog(ex.hwnd, null, 0x20);
		try {
			Progress.SetAnimation(hShell32, 150);
			SearchFolders(list, ex.FV, ex.SessionId, ex.Locale, mask1, length1, new RegExp(filter1.replace(/([\+\*\.\?\^\$\[\-\]\|\(\)\\])/g, "\\$1"), "i"), Progress);
		} catch (e) { }
		Progress.StopProgressDialog();
		delete MainWindow.Exchange[arg[3]];
		ex.NavigateComplete(ex.FV);
	}
}

function SearchFolders(folderlist, FV, SessionId, loc999, mask1, length1, re1, Progress) {
	var bAdd, FolderItem;
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
				if (length1) {
					bAdd = false;
					var ado = api.CreateObject("ads");
					var charset = "_autodetect_all";
					try {
						ado.CharSet = "iso-8859-1";
						ado.Open();
						ado.LoadFromFile(fn);
						var s = ado.ReadText(999);
						if (/^\xEF\xBB\xBF/.test(s)) {
							charset = 'utf-8';
						} else if (/^\xFF\xFE|^\xFE\xFF/.test(s)) {
							charset = 'unicode';
						} else {
							var res = /<meta[^>]*charset\s*=([\w_\-]+)|\@charset.*?([\w_\-]+)|<\?xml[^>]*encoding\s*=[^\w_\->]*([\w_\-]+)/i.exec(s);
							if (res) {
								charset = res[1] || res[2] || res[3];
							}
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
					} catch (e) { }
					ado.close();
				} else {
					bAdd = true;
				}
				if (bAdd) {
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
