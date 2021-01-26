const Addon_Id = "openinstead";
const item = GetAddonElement(Addon_Id);

Sync.OpenInstead = {
	RealFolders: item.getAttribute("RealFolders"),
	SpecialFolders: item.getAttribute("SpecialFolders"),
	TakeOver: item.getAttribute("TakeOver"),

	Exec: function () {
		try {
			const sw = sha.Windows();
			for (let i = sw.Count; i-- > 0;) {
				const exp = sw.item(i);
				if (exp && exp.Visible && !exp.Busy) {
					const doc = exp.Document;
					if (doc) {
						let path = api.GetDisplayNameOf(doc, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
						let url = doc;
						if (!path && /\\explorer\.exe$/i.test(exp.FullName)) {
							path = api.PathCreateFromUrl(exp.LocationURL);
							url = path;
						}
						if (Sync.OpenInstead.Match(path)) {
							exp.Visible = false;
							const FV = te.Ctrl(CTRL_FV).Navigate(api.ILCreateFromPath(url).ExtendedProperty("linktarget") || url, SBSP_NEWBROWSER);
							if (Sync.OpenInstead.TakeOver) {
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
	},

	Match: function (path) {
		if (path && Sync.OpenInstead[/^.?:\\|^\\\\/.test(path) ? "RealFolders" : "SpecialFolders"]) {
			return !RunEvent3("UseExplorer", path);
		}
	}
};
