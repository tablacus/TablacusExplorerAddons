var Addon_Id = "fullpathbar";
var Default = "BottomBar3Left";

if (window.Addon == 1) {
	Addons.FullPathBar =
	{
		Title: GetAddonOption(Addon_Id, "Title")
	}
	SetAddon(Addon_Id, Default, '<span id="fullpathbar">&nbsp;</span>');

	AddEvent("StatusText", function (Ctrl, Text, iPart)
	{
		if (Ctrl.Type <= CTRL_EB) {
			var Items = Ctrl.SelectedItems();
			if (Items.Count > 0) {
				try {
					var s = Items.Item(0).Path;
					document.getElementById("fullpathbar").innerHTML = "&nbsp;" + s;
					if (Addons.FullPathBar.Title) {
						api.SetWindowText(te.hwnd, s + " - " + TITLE);
					}
				} catch (e) {}
			}
		}
	});
}
else {
	document.getElementById("tab0").value = GetText("View");
	document.getElementById("panel0").innerHTML = '<input type="checkbox" id="Title" /><label for="Title">Title Bar</label>';
}
