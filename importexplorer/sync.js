const Addon_Id = "importexplorer";
const item = GetAddonElement(Addon_Id);

Sync.ImportExplorer = {
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),
	RealFolders: item.getAttribute("RealFolders"),
	SpecialFolders: item.getAttribute("SpecialFolders"),
	TakeOver: item.getAttribute("TakeOver"),

	Exec: function (Ctrl, pt) {
		try {
			let FV = GetFolderView(Ctrl, pt);
			FV.Focus();
			const sw = sha.Windows();
			for (let i = sw.Count; i-- > 0;) {
				let exp = sw.item(i);
				if (exp && exp.Visible && !exp.Busy) {
					let doc = exp.Document;
					if (doc) {
						if (Sync.ImportExplorer.Match(api.GetDisplayNameOf(doc, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL))) {
							exp.Visible = false;
							FV = FV.Navigate(doc, SBSP_NEWBROWSER);
							if (Sync.ImportExplorer.TakeOver) {
								FV.CurrentViewMode = doc.CurrentViewMode;
								if (doc.IconSize) {
									FV.IconSize = doc.IconSize;
								}
								if (doc.SortColumns) {
									FV.SortColumns = doc.SortColumns;
								}
							}
							exp.Quit();
							RestoreFromTray();
							api.SetForegroundWindow(te.hwnd);
						}
					}
				}
			}
		} catch (e) { }
		return S_OK;
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
