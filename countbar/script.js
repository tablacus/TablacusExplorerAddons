var Addon_Id = "countbar";
var Default = "BottomBar3Left";

if (window.Addon == 1) {
	Addons.CountBar =
	{
		Title: GetAddonOption(Addon_Id, "Title"),

		Exec: function (Ctrl, Text, iPart) {
			var FV = GetFolderView(Ctrl);
			if (FV) {
				var s;
				if (Text || !Ctrl) {
					s = [];
					var nCount = FV.ItemCount(SVGIO_SELECTION);
					if (nCount) {
						var s1 = nCount > 1 ? Addons.CountBar.Item[2] : Addons.CountBar.Item[3];
						if (nCount > 999 && g_.IEVer > 8) {
							nCount = nCount.toLocaleString();
						}
						s.push(api.sprintf(s1.length + 9, s1, nCount));
					}
					var nCount = FV.ItemCount();
					if (!nCount && !/^0/.test(Text)) {
						return;
					}
					var s1 = nCount > 1 ? Addons.CountBar.Item[0] : Addons.CountBar.Item[1];
					if (nCount > 999 && g_.IEVer > 8) {
						nCount = nCount.toLocaleString();
					}
					s.push(api.sprintf(s1.length + 9, s1, nCount));
					s = s.join(" / ") + " ";
					document.getElementById("countbar").innerHTML = "&nbsp;" + s;
					if (Addons.CountBar.Title) {
						api.SetWindowText(te.hwnd, s + " - " + TITLE);
					}
				}
			}
		}
	}
	SetAddon(Addon_Id, Default, '<span id="countbar">&nbsp;</span>');

	AddEvent("StatusText", Addons.CountBar.Exec);
	AddEvent("Load", Addons.CountBar.Exec);

	Addons.CountBar.Item = [api.LoadString(hShell32, 38192) || api.LoadString(hShell32, 6466), api.LoadString(hShell32, 38193) || api.LoadString(hShell32, 6466), api.LoadString(hShell32, 38194) || api.LoadString(hShell32, 6477), api.LoadString(hShell32, 38195) || api.LoadString(hShell32, 6477)];
	var ar = ["%s items selected", "%s item selected", "%s items", "%s item"];
	for (var i in Addons.CountBar.Item) {
		var s = Addons.CountBar.Item[i];
		if (!/%s/.test(s)) {
			Addons.CountBar.Item[i] = /%1[^ ]*/.test(s) ? s.replace(/%1[^ ]*/, "%s") : ar[i];
		}
	}
} else {
	SetTabContents(0, "View", '<label><input type="checkbox" id="Title">Title bar</label>');
}
