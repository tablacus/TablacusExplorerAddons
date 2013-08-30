if (window.Addon == 1) {
	g_openinstead_OnWindowRegistered = te.OnWindowRegistered;

	te.OnWindowRegistered = function (Ctrl)
	{
		if (g_openinstead_OnWindowRegistered) {
			g_openinstead_OnWindowRegistered(Ctrl);
		}

		var items = te.Data.Addons.getElementsByTagName("openinstead");
		if (items.length) {
			var item = items[0];
			var ws = sha.Windows();
			for (var i = ws.Count - 1; i >= 0; i--) {
				var exp = ws.item(i);
				if (exp && exp.Visible) {
					var doc = exp.Document;
					if (doc) {
						var path = api.GetDisplayNameOf(doc, SHGDN_FORPARSING);
						if (path) {
							if (item.getAttribute(path.match(/^.?:\\|^\\\\/) ? "RealFolders" : "SpecialFolders")) {
								var FV = te.Ctrl(CTRL_FV);
								FV = FV.Navigate(doc, SBSP_NEWBROWSER);
								if (item.getAttribute("TakeOver")) {
									FV.CurrentViewMode = doc.CurrentViewMode;
									if (doc.IconSize) {
										FV.IconSize = doc.IconSize;
									}
									if (doc.SortColumns) {
										FV.SortColumns = doc.SortColumns;
									}
								}
								exp.Quit();
								api.SetForegroundWindow(te.hwnd);
							}
						}
					}
				}
			}
		}
	}
}
