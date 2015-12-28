Addon_Id = "fullpathbar";
Default = "BottomBar3Left";

if (window.Addon == 1) {
	Addons.FullPathBar =
	{
		Title: GetAddonOption(Addon_Id, "Title"),

		Show: function (Ctrl)
		{
			if (Ctrl && Ctrl.Type <= CTRL_EB) {
				var Items = Ctrl.SelectedItems();
				var s = Items.Count > 0 ? Items.Item(0).Path : Ctrl.FolderItem.Path;
				try {
					document.getElementById("fullpathbar").innerHTML = "&nbsp;" + s;
					if (Addons.FullPathBar.Title) {
						api.SetWindowText(te.hwnd, s + " - " + TITLE);
					}
				} catch (e) {}
			}
		}
	}
	SetAddon(Addon_Id, Default, '<span id="fullpathbar">&nbsp;</span>');

	AddEvent("StatusText", Addons.FullPathBar.Show);
	AddEvent("Load", function ()
	{
		Addons.FullPathBar.Show(te.Ctrl(CTRL_FV));
	});
} else {
	document.getElementById("tab0").value = GetText("View");
	document.getElementById("panel0").innerHTML = '<input type="checkbox" id="Title" /><label for="Title">Title Bar</label>';
}
