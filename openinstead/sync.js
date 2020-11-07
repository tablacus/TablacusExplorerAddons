var Addon_Id = "openinsted";
var item = GetAddonElement("openinstead");

Sync.OpenInstead =
{
	RealFolders: item.getAttribute("RealFolders"),
	SpecialFolders: item.getAttribute("SpecialFolders"),
	TakeOver: item.getAttribute("TakeOver"),

	Exec: function () {
		try {
			var sw = sha.Windows();
			for (var i = sw.Count; i-- > 0;) {
				var exp = sw.item(i);
				if (exp && exp.Visible && !exp.Busy) {
					var doc = exp.Document;
					if (doc) {
						var path = api.GetDisplayNameOf(doc, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
						var url = doc;
						if (!path && /\\explorer\.exe$/i.test(exp.FullName)) {
							path = api.PathCreateFromUrl(exp.LocationURL);
							url = path;
						}
						if (Sync.OpenInstead.Match(path)) {
							exp.Visible = false;
							var FV = te.Ctrl(CTRL_FV);
							FV = FV.Navigate(api.ILCreateFromPath(url).ExtendedProperty("linktarget") || url, SBSP_NEWBROWSER);
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
