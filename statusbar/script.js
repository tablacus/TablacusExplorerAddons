var Addon_Id = "statusbar";
var Default = "BottomBar3Left";

if (window.Addon == 1) {
	Addons.StatusBar = {};
	Addons.StatusBar.Set = GetAddonOptionEx(Addon_Id, "Title") ? function (s)
	{
		api.SetWindowText(te.hwnd, s + " - " + TITLE);
	} : function (s)
	{
		document.getElementById("statusbar").innerHTML = "&nbsp;" + EncodeSC(s);
	};
	SetAddon(Addon_Id, Default, '<span id="statusbar">&nbsp;</span>');

	AddEvent("StatusText", function (Ctrl, Text, iPart)
	{
		Addons.StatusBar.tid = setTimeout(function ()
		{
			Addons.StatusBar.Set(Text);
		}, 99);
		if (Ctrl.Type <= CTRL_EB && /^\d/.test(Text)) {
			var Items = Ctrl.SelectedItems();
			if (Items.Count == 1) {
				var v = { Item: Items.Item(0), window: window, StatusBar: Addons.StatusBar }
				api.ExecScript('var s = Item.ExtendedProperty("infotip"); if (s) { window.clearTimeout(StatusBar.tid); StatusBar.Set(s); }', "JScript", v, true);
			}
		}
		return S_OK;
	});
} else {
	SetTabContents(0, "View", '<input type="checkbox" id="Title"><label for="Title">Title bar</label>');
}
