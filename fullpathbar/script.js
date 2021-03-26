const Addon_Id = "fullpathbar";
const Default = "BottomBar3Left";
if (window.Addon == 1) {
	Addons.FullPathBar = {
		Title: await GetAddonOptionEx(Addon_Id, "Title"),

		Show: async function (Ctrl) {
			if (Ctrl) {
				let s;
				const nType = await Ctrl.Type;
				if (nType == CTRL_SB || nType == CTRL_EB) {
					s = await api.GetDisplayNameOf(await Ctrl.SelectedItems().Item(0) || Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
				} else {
					s = await Ctrl.Path;
				}
				if (s && "string" === typeof s) {
					try {
						document.getElementById("fullpathbar").innerHTML = "&nbsp;" + s;
						if (Addons.FullPathBar.Title) {
							api.SetWindowText(ui_.hwnd, s + " - " + TITLE);
						}
					} catch (e) { }
				}
			}
		}
	}
	AddEvent("Layout", function () {
		SetAddon(Addon_Id, Default, '<span id="fullpathbar">&nbsp;</span>');
	});

	AddEvent("StatusText", Addons.FullPathBar.Show);

	AddEvent("Load", async function () {
		Addons.FullPathBar.Show(await te.Ctrl(CTRL_FV));
	});
} else {
	SetTabContents(0, "View", '<label><input type="checkbox" id="Title">Title Bar</label>');
}
