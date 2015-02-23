var Addon_Id = "countbar";
var Default = "BottomBar3Left";

if (window.Addon == 1) {
	Addons.CountBar =
	{
		Title: GetAddonOption(Addon_Id, "Title")
	}
	SetAddon(Addon_Id, Default, '<span id="countbar">&nbsp;</span>');

	AddEvent("StatusText", function (Ctrl, Text, iPart)
	{
		if (Ctrl.Type <= CTRL_EB) {
			var s = [];
			var nCount = Ctrl.ItemCount(SVGIO_SELECTION);
			if (nCount) {
				var s1 = nCount > 1 ? Addons.CountBar.Item[2] : Addons.CountBar.Item[3];
				if (nCount > 999 && document.documentMode > 8) {
					nCount = nCount.toLocaleString();
				}
				s.push(api.sprintf(s1.length + 9, s1, nCount));
			}
			var nCount = Ctrl.ItemCount();
			var s1 = nCount > 1 ? Addons.CountBar.Item[0] : Addons.CountBar.Item[1];
			if (nCount > 999 && document.documentMode > 8) {
				nCount = nCount.toLocaleString();
			}
			s.push(api.sprintf(s1.length + 9, s1, nCount));
			s = s.join(" / ") + " ";
			document.getElementById("countbar").innerHTML = "&nbsp;" + s;
			if (Addons.CountBar.Title) {
				api.SetWindowText(te.hwnd, s + " - " + TITLE);
			}
		}
	});
	
	var hModule = api.GetModuleHandle(fso.BuildPath(system32, "shell32.dll"))
	Addons.CountBar.Item = [api.LoadString(hModule, 38192) || api.LoadString(hModule, 6466), api.LoadString(hModule, 38193) || api.LoadString(hModule, 6466), api.LoadString(hModule, 38194) || api.LoadString(hModule, 6477), api.LoadString(hModule, 38195) || api.LoadString(hModule, 6477)];
	var ar = ["%s items selected", "%s item selected", "%s items", "%s item"];
	for (var i in Addons.CountBar.Item) {
		var s = Addons.CountBar.Item[i];
		if (!/%s/.test(s)) {
			Addons.CountBar.Item[i] = /%1[^ ]*/.test(s) ? s.replace(/%1[^ ]*/, "%s") : ar[i];
		}
	}
}
else {
	document.getElementById("tab0").value = GetText("View");
	document.getElementById("panel0").innerHTML = '<input type="checkbox" id="Title" /><label for="Title">Title Bar</label>';
}
