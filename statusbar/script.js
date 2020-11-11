var Addon_Id = "statusbar";
var Default = "BottomBar3Left";

if (window.Addon == 1) {
	Addons.StatusBar = {
		Set: await GetAddonOptionEx(Addon_Id, "Title") ? function (s) {
			document.title = s + " - " + TITLE;
		} : function (s) {
			document.getElementById("statusbar").innerHTML = "&nbsp;" + EncodeSC(s);
		}
	};

	AddEvent("StatusText", async function (Ctrl, Text, iPart) {
		if (await Ctrl.Type <= CTRL_EB && /^\d/.test(Text) && await Ctrl.ItemCount(SVGIO_SELECTION) == 1) {
			var o = await api.CreateObject("Object");
			o.api = api;
			o.Item = await Ctrl.SelectedItems().Item(0);
			o.Set = Addons.StatusBar.Set;
			o.Text = await api.CreateObject("Object");
			o.Text.Text = Text;
			api.ExecScript('api.Invoke(Set, Item.ExtendedProperty("infotip") || Text.Text);', "JScript", o, true);
		} else {
			Addons.StatusBar.Set(Text);
		}
		return S_OK;
	});

	SetAddon(Addon_Id, Default, '<span id="statusbar">&nbsp;</span>');
} else {
	SetTabContents(0, "View", '<label><input type="checkbox" id="Title">Title bar</label>');
}
