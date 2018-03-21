var GetList = function(Item)
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
			ex.List.AddItem(Item);
			if (GetList(Item)) {
				return 1;
			}
		}
	}
}

var cPath = ex.Path.split(/\s*;\s*/);
Progress = api.CreateObject("ProgressDialog");
Progress.StartProgressDialog(ex.hwnd, null, 0x20);
Progress.SetLine(1, api.LoadString(ex.hShell32, 13585) || api.LoadString(ex.hShell32, 6478), true);
try {
	for (var i in cPath) {
		if (Item = api.ILCreateFromPath(cPath[i])) {
			GetList(Item);
		}
	}
} catch (e) {}
Progress.StopProgressDialog();
if (List.length && !Progress.HasUserCancelled()) {
	ex.FV.AddItems(ex.List, true);
}