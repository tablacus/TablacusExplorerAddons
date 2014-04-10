var Addon_Id = "statusbar";
var Default = "BottomBar3Left";

if (window.Addon == 1) {
	SetAddon(Addon_Id, Default, '<span id="statusbar">&nbsp;</span>');

	AddEvent("StatusText", function (Ctrl, Text, iPart)
	{
		var s = String(Text);
		if (Ctrl.Type <= CTRL_EB && s.match(/^\d/)) {
			var Items = Ctrl.SelectedItems();
			if (Items.Count == 1) {
				try {
					s = Ctrl.Folder.GetDetailsOf(Items.Item(0), -1);
				} catch (e) {}
			}
		}
		document.getElementById("statusbar").innerHTML = "&nbsp;" + s;
		return S_OK;
	});
}
