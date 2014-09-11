if (window.Addon == 1) {
	Addons.OpenInstead =
	{
		Exec: function ()
		{
			var items = te.Data.Addons.getElementsByTagName("openinstead");
			if (items.length) {
				var item = items[0];
				var sw = sha.Windows();
				for (var i = sw.Count; i-- > 0;) {
					var exp = sw.item(i);
					if (exp && exp.Visible && !exp.Busy) {
						var doc = exp.Document;
						if (doc) {
							var path = api.GetDisplayNameOf(doc, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
							if (path) {
								if (item.getAttribute(path.match(/^.?:\\|^\\\\/) ? "RealFolders" : "SpecialFolders")) {
									exp.Visible = false;
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
									RestoreFromTray();
									api.SetForegroundWindow(te.hwnd);
								}
							}
						}
					}
				}
			}
		}
	};

	AddEvent("WindowRegistered", function (Ctrl)
	{
		Addons.OpenInstead.Exec();
		setTimeout(Addons.OpenInstead.Exec, 500);
	});
}
