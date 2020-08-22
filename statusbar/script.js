var Addon_Id = "statusbar";
var Default = "BottomBar3Left";

if (window.Addon == 1) {
	Addons.StatusBar = {
		Set: GetAddonOptionEx(Addon_Id, "Title") ? function (s) {
			api.SetWindowText(te.hwnd, s + " - " + TITLE);
		} : function (s) {
			document.getElementById("statusbar").innerHTML = "&nbsp;" + EncodeSC(s);
		}
	};

	AddEvent("StatusText", function (Ctrl, Text, iPart) {
		if (Ctrl.Type <= CTRL_EB && /^\d/.test(Text) && Ctrl.ItemCount(SVGIO_SELECTION) == 1) {
			api.ExecScript('Set(Item.ExtendedProperty("infotip") || Text);', "JScript", {
				Item: Ctrl.SelectedItems().Item(0),
				Set: Addons.StatusBar.Set,
				Text: Text
			}, true);
		} else {
			Addons.StatusBar.Set(Text);
		}
		return S_OK;
	});

	SetAddon(Addon_Id, Default, '<span id="statusbar">&nbsp;</span>');
} else {
	SetTabContents(0, "View", '<label><input type="checkbox" id="Title">Title bar</label>');
}
