importScripts("..\\..\\script\\consts.js");

if (MainWindow.Exchange) {
	g_ex = MainWindow.Exchange[arg[3]];
	if (g_ex) {
		g_FV = g_ex.FV;
		g_List = [];
		g_Total = 0;
		g_sessionId = g_ex.SessionId;
		var cPath = g_ex.Path.split(/\s*;\s*/);
		Progress = te.ProgressDialog;
		Progress.StartProgressDialog(g_ex.hwnd, null, 2);
		Progress.SetLine(1, api.LoadString(hShell32, 13585) || api.LoadString(hShell32, 6478), true);
		try {
			for (var i in cPath) {
				if (Item = api.ILCreateFromPath(cPath[i])) {
					GetList(Item);
				}
			}
			SetList();
		} catch (e) {}
		Progress.StopProgressDialog();
		delete MainWindow.Exchange[arg[3]];
	}
}

function GetList(Item)
{
	if (Item.IsFolder) {
		var link = Item.ExtendedProperty("linktarget");
		if (link && api.ILIsParent(link, Item, false)) {
			return;
		}
		var Items = Item.GetFolder.Items();
		for (var i = 0; i < Items.Count; i++) {
			if (Progress.HasUserCancelled()) {
				return 1;
			}
			Item = Items.Item(i);
			g_List.push(Item);
			g_Total++;
			if (GetList(Item)) {
				return 1;
			}
		}
	}
}

function SetList()
{
	var Item;
	Progress.Timer(1);
	while (Item = g_List.shift()) {
		if (Progress.HasUserCancelled()) {
			break;
		}
		var i = Math.floor((g_Total - g_List.length) * 100 / g_Total);
		Progress.SetProgress(i, 100);
		Progress.SetTitle(i + "%");
		Progress.SetLine(2, Item.Name, true);
		if (g_FV.AddItem(Item, g_sessionId) == E_ACCESSDENIED) {
			break;
		}
	}
}
