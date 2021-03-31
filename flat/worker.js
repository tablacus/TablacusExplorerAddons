const sitems = (api.LoadString(hShell32, 38192) || api.LoadString(hShell32, 6466) || "%s items").replace(/%1[^ ]*/, "%s");

GetList = function (Item) {
	let Items;
	if (Item.IsFolder) {
		const link = Item.ExtendedProperty("linktarget");
		if (link && api.ILIsParent(link, Item, false)) {
			return;
		}
		Items = Item.GetFolder.Items();
	} else if (Item.Enum) {
		Items = GetEnum(Item, Conf_MenuHidden);
	}
	if (Items) {
		for (let i = 0; i < Items.Count; i++) {
			if (Progress.HasUserCancelled()) {
				return 1;
			}
			Item = Items.Item(i);
			ex.List.AddItem(Item);
			Progress.SetTitle(sitems.replace("%s", ex.List.Count));
			if (GetList(Item)) {
				return 1;
			}
		}
	}
}

const cPath = ex.Path.split(/\s*;\s*/);
Progress = api.CreateObject("ProgressDialog");
Progress.StartProgressDialog(ex.hwnd, null, 0x20);
Progress.SetLine(1, api.LoadString(ex.hShell32, 13585) || api.LoadString(ex.hShell32, 6478), true);
try {
	for (let i in cPath) {
		if (Item = ILCreateFromPath(cPath[i])) {
			GetList(Item);
		}
	}
} catch (e) { }
Progress.StopProgressDialog();
if (ex.List.Count && !Progress.HasUserCancelled()) {
	ex.fncb(ex.FV, ex.List);
}
