if (window.Addon == 1) {
	Addons.OpenInstead =
	{
		Exec: function ()
		{
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
							if (Addons.OpenInstead.Match(path)) {
								exp.Visible = false;
								var FV = te.Ctrl(CTRL_FV);
								FV = FV.Navigate(api.ILCreateFromPath(url).ExtendedProperty("linktarget") || url, SBSP_NEWBROWSER);
								if (Addons.OpenInstead.TakeOver) {
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
			} catch (e) {}
		},

		Match: function (path)
		{
			if (path && Addons.OpenInstead[/^.?:\\|^\\\\/.test(path) ? "RealFolders" : "SpecialFolders"]) {
				return !RunEvent3("UseExplorer", path);
			}
		}
	};

	AddEvent("WindowRegistered", function (Ctrl)
	{
		Addons.OpenInstead.Exec();
		setTimeout(Addons.OpenInstead.Exec, 500);
	});

	var item = GetAddonElement("openinstead");
	Addons.OpenInstead.RealFolders = item.getAttribute("RealFolders");
	Addons.OpenInstead.SpecialFolders = item.getAttribute("SpecialFolders");
	Addons.OpenInstead.TakeOver = item.getAttribute("TakeOver");
}
