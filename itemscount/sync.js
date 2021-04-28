const Addon_Id = "itemscount";
const item = GetAddonElement(Addon_Id);

Sync.ItemsCount = {
	Items: [await api.LoadString(hShell32, 38192) || (await api.LoadString(hShell32, 6466) || "%s items").replace(/%1!ls!/, "%s"), api.LoadString(hShell32, 38193) || (await api.LoadString(hShell32, 6466) || "%s item").replace(/%1!ls!/, "%s")],

	ReplaceColumns: function (FV, pid, s) {
		let n;
		try {
			if (s || !pid) {
				return;
			}
			const path = pid.Path;
			if (!/^[A-Z]:\\|^\\\\\w/i.test(path)) {
				return;
			}
			let db = FV.Data.ItemsCount;
			if (!db) {
				FV.Data.ItemsCount = db = api.CreateObject("Object");
			}
			n = db[path];
			if (n || api.PathMatchSpec(path, BuildPath(GetTempPath(1), "*")) || !IsFolderEx(pid)) {
				return n;
			}
			const Items = pid.GetFolder.Items();
			try {
				Items.Filter(SHCONTF_FOLDERS | SHCONTF_NONFOLDERS | (Ctrl.ViewFlags & 1 ? SHCONTF_INCLUDEHIDDEN : 0), "*");
			} catch (e) { }
			n = Items.Count;
			db[path] = n = Sync.ItemsCount.Items[n > 1 ? 0 : 1].replace("%s", n > 999 && g_.IEVer > 8 ? n.toLocaleString() : n);
		} catch (e) {
			db[pid.Path] = n = "!";
		}
		return n;
	}
}

AddEvent("ContentsChanged", function (Ctrl) {
	Ctrl.Data.ItemsCount = api.CreateObject("Object");
});

ColumnsReplace(te, "Size", HDF_RIGHT, Sync.ItemsCount.ReplaceColumns);
