const Addon_Id = "statusbar";
const Default = "BottomBar3Left";
if (window.Addon == 1) {
	Addons.StatusBar = {
		arg: await api.CreateObject("Object"),

		Set: await GetAddonOptionEx(Addon_Id, "Title") ? async function (s) {
			document.title = s + " - " + TITLE;
		} : async function (s) {
			const Id = await Addons.StatusBar.arg.FV.Parent.Id;
			(document.getElementById("statusbar_" + Id) || document.getElementById("statusbar_$") || {}).innerHTML = "&nbsp;" + EncodeSC(s);
		}
	};
	Addons.StatusBar.arg.api = api;
	Addons.StatusBar.arg.Set = Addons.StatusBar.Set;

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, '<span id="statusbar_$">&nbsp;</span>');
	});

	AddEvent("StatusText", async function (Ctrl, Text, iPart) {
		if (/^1 /.test(Text)) {
			if (await Ctrl.Type <= CTRL_EB) {
				if (await Ctrl.ItemCount(SVGIO_SELECTION) == 1) {
					Addons.StatusBar.arg.FV = Ctrl;
					api.ExecScript('var Selected = FV.SelectedItems(); api.Invoke(Set, Selected && Selected.Count == 1 && Selected.Item(0).ExtendedProperty("infotip") || "' + Text.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '");', "JScript", Addons.StatusBar.arg, true);
					return;
				}
			}
		}
		Addons.StatusBar.arg.FV = await GetFolderView(Ctrl)
		Addons.StatusBar.Set(Text);
	});
} else {
	EnableInner();
	SetTabContents(0, "View", '<label><input type="checkbox" id="Title">Title bar</label>');
}
