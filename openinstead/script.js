if (window.Addon == 1) {
	Addons.OpenInstead =
	{
		Exec: function ()
		{
			var sw = sha.Windows();
			for (var i = sw.Count; i-- > 0;) {
				var exp = sw.item(i);
				if (exp && exp.Visible && !exp.Busy) {
					var doc = exp.Document;
					if (doc) {
						if (Addons.OpenInstead.Match(api.GetDisplayNameOf(doc, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING)) == S_OK) {
							exp.Visible = false;
							var FV = te.Ctrl(CTRL_FV);
							FV = FV.Navigate(doc, SBSP_NEWBROWSER);
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
		},

		Match: function (path)
		{
			if (path && Addons.OpenInstead[/^.?:\\|^\\\\/.test(path) ? "RealFolders" : "SpecialFolders"]) {
				return RunEvent2("Addons.OpenInstead", path);
			}
			return S_FALSE;
		}
	};

	AddEvent("WindowRegistered", function (Ctrl)
	{
		Addons.OpenInstead.Exec();
		setTimeout(Addons.OpenInstead.Exec, 500);
	});

	var items = te.Data.Addons.getElementsByTagName("openinstead");
	if (items.length) {
		var item = items[0];
		Addons.OpenInstead.RealFolders = item.getAttribute("RealFolders");
		Addons.OpenInstead.SpecialFolders = item.getAttribute("SpecialFolders");
		Addons.OpenInstead.TakeOver = item.getAttribute("TakeOver");
	}
}
