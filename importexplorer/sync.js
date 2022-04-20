const Addon_Id = "importexplorer";
const item = GetAddonElement(Addon_Id);

Sync.ImportExplorer = {
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),
	RealFolders: item.getAttribute("RealFolders"),
	SpecialFolders: item.getAttribute("SpecialFolders"),
	TakeOver: item.getAttribute("TakeOver"),

	Exec: function (Ctrl, pt) {
		let FV = GetFolderView(Ctrl, pt);
		FV.Focus();
		const o = api.CreateObject("Object");
		o.Data = api.CreateObject("Object");
		o.Data.FV0 = FV;
		o.Data.Sync = Sync;
		o.Data.hwnd = te.hwnd;
		o.Data.MainWindow = window;
		o.Data.uFlags = SHGDN_FORADDRESSBAR | SHGDN_FORPARSING;
		o.Data.wFlags = SBSP_NEWBROWSER;
		o.Data.dwFlags = SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_DESELECTOTHERS | SVSI_SELECTIONMARK | SVSI_SELECT;
		api.ExecScript(FixScript(Sync.ImportExplorer.Worker.toString().replace(/^[^{]+{|}$/g, "")), "JScript", o, true);
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
						if (Sync.ImportExplorer.Match(path)) {
							exp.Visible = false;
							let FV = FV0.Navigate(api.ILCreateFromPath(url).ExtendedProperty("linktarget") || url, wFlags);
							if (Sync.ImportExplorer.TakeOver) {
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
		if (path && Sync.ImportExplorer[/^.?:\\|^\\\\/.test(path) ? "RealFolders" : "SpecialFolders"]) {
			return !RunEvent3("UseExplorer", path);
		}
	}
};

//Menu
if (item.getAttribute("MenuExec")) {
	let s = item.getAttribute("MenuName");
	if (s && s != "") {
		Sync.ImportExplorer.strName = s;
	}
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.ImportExplorer.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Sync.ImportExplorer.strName));
		ExtraMenuCommand[nPos] = Sync.ImportExplorer.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.ImportExplorer.Exec, "Async");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.ImportExplorer.Exec, "Async");
}
//Type
AddTypeEx("Add-ons", "Import Explorer", Sync.ImportExplorer.Exec);
