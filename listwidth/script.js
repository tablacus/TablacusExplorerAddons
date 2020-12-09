const Addon_Id = "listwidth";

if (window.Addon == 1) {
	Addons.ListWidth = {
		Width: await GetAddonOptionEx("listwidth", "Width"),

		Exec: async function (Ctrl) {
			if (Addons.ListWidth.Width > 29 || Addons.ListWidth.Width < 0) {
				const hList = await Ctrl.hwndList;
				if (hList && await api.SendMessage(hList, LVM_GETVIEW, 0, 0) == 3) {
					api.SendMessage(hList, LVM_SETCOLUMNWIDTH, 0, Addons.ListWidth.Width);
				}
			}
		},

		Set: async function (Ctrl, n) {
			Addons.ListWidth.Width = n;
			Addons.ListWidth.Exec(await GetFolderView(Ctrl));
		}
	}

	AddEvent("ListViewCreated", Addons.ListWidth.Exec);
	AddEvent("NavigateComplete", Addons.ListWidth.Exec);
	AddEvent("ViewModeChanged", Addons.ListWidth.Exec);

	let cFV = await te.Ctrls(CTRL_FV);
	if (window.chrome) {
		cFV = await api.CreateObject("SafeArray", cFV);
	}
	for (let i = cFV.length; --i >= 0;) {
		Addons.ListWidth.Exec(cFV[i]);
	}
} else {
	SetTabContents(0, "", '<label>Width</label><br><input type="text" id="Width" style="width: 100%">');
}
