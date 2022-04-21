const Addon_Id = "openinstead";
const item = GetAddonElement(Addon_Id);

Sync.OpenInstead = {
	RealFolders: item.getAttribute("RealFolders"),
	SpecialFolders: item.getAttribute("SpecialFolders"),
	TakeOver: item.getAttribute("TakeOver"),

	Exec: function () {
		const o = api.CreateObject("Object");
		o.Data = api.CreateObject("Object");
		o.Data.Sync = Sync;
		o.Data.hwnd = te.hwnd;
		o.Data.MainWindow = window;
		o.Data.uFlags = SHGDN_FORADDRESSBAR | SHGDN_FORPARSING;
		o.Data.wFlags = SBSP_NEWBROWSER;
		o.Data.dwFlags = SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_DESELECTOTHERS | SVSI_SELECTIONMARK | SVSI_SELECT;
		api.ExecScript(FixScript(Sync.OpenInstead.Worker.toString().replace(/^[^{]+{|}$/g, "")), "JScript", o, true);
		return S_OK;
	},

	Worker: function () {
		const sha = api.CreateObject("sha");
		const sw = sha.Windows();
		for (let i = sw.Count; i-- > 0;) {
			let exp = sw.item(i);
			if (exp && exp.Visible && !exp.Busy) {
				let doc = exp.Document;
				if (doc) {
					try {
						let path = api.GetDisplayNameOf(doc, uFlags);
						let url = doc;
						if (!path && /\\explorer\.exe$/i.test(exp.FullName)) {
							path = api.PathCreateFromUrl(exp.LocationURL);
							url = path;
						}
						if (Sync.OpenInstead.Match(path)) {
							exp.Visible = false;
							let FV = MainWindow.GetFolderView().Navigate(api.ILCreateFromPath(url).ExtendedProperty("linktarget") || url, wFlags);
							if (Sync.OpenInstead.TakeOver) {
								FV.CurrentViewMode = doc.CurrentViewMode;
								if (doc.IconSize) {
									FV.IconSize = doc.IconSize;
								}
								if (doc.SortColumns) {
									FV.SortColumns = doc.SortColumns;
								}
								if (doc.GroupBy) {
									FV.GroupBy = doc.GroupBy;
								}
							}
							FV.SelectItem(doc.FocusedItem, dwFlags);
							exp.Quit();
							MainWindow.RestoreFromTray();
							api.SetForegroundWindow(hwnd);
						}
					} catch (e) { }
				}
			}
		}
	},

	Match: function (path) {
		if (path && Sync.OpenInstead[/^.?:\\|^\\\\/.test(path) ? "RealFolders" : "SpecialFolders"]) {
			return !RunEvent3("UseExplorer", path);
		}
	}
};
