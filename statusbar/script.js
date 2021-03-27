const Addon_Id = "statusbar";
const Default = "BottomBar3Left";
if (window.Addon == 1) {
	Addons.StatusBar = {
		arg: await api.CreateObject("Object"),

		Set: await GetAddonOptionEx(Addon_Id, "Title") ? function (s) {
			document.title = s + " - " + TITLE;
		} : function (s) {
			document.getElementById("statusbar").innerHTML = "&nbsp;" + EncodeSC(s);
		}
	};
	Addons.StatusBar.arg.api = api;
	Addons.StatusBar.arg.Set = Addons.StatusBar.Set;

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, '<span id="statusbar">&nbsp;</span>');
	});

	AddEvent("StatusText", async function (Ctrl, Text, iPart) {
		if (/^1 /.test(Text)) {
			const nType = await Ctrl.Type;
			if (nType == CTRL_SB || nType == CTRL_EB) {
				if (await Ctrl.ItemCount(SVGIO_SELECTION) == 1) {
					Addons.StatusBar.arg.FV = Ctrl;
					api.ExecScript('var Selected = FV.SelectedItems(); api.Invoke(Set, Selected && Selected.Count == 1 && Selected.Item(0).ExtendedProperty("infotip") || "' + Text.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '");', "JScript", Addons.StatusBar.arg, true);
					return;
				}
			}
		}
		Addons.StatusBar.Set(Text);
	});
} else {
	SetTabContents(0, "View", '<label><input type="checkbox" id="Title">Title bar</label>');
}
