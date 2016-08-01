var Addon_Id = "statusbar";
var Default = "BottomBar3Left";

if (window.Addon == 1) {
	Addons.StatusBar =
	{
		Title: GetAddonOption(Addon_Id, "Title")
	}
	SetAddon(Addon_Id, Default, '<span id="statusbar">&nbsp;</span>');

	AddEvent("StatusText", function (Ctrl, Text, iPart)
	{
		if (Ctrl.Type <= CTRL_EB && /^\d/.test(Text)) {
			var Items = Ctrl.SelectedItems();
			if (Items.Count == 1) {
				try {
					Text = Ctrl.Folder.GetDetailsOf(Items.Item(0), -1);
				} catch (e) {}
			}
		}
		document.getElementById("statusbar").innerHTML = "&nbsp;" + Text;
		if (Addons.StatusBar.Title) {
			api.SetWindowText(te.hwnd, Text + " - " + TITLE);
		}
		return S_OK;
	});
} else {
	SetTabContents(0, "View", '<input type="checkbox" id="Title" /><label for="Title">Title Bar</label>');
}
