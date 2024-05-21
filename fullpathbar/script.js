const Addon_Id = "fullpathbar";
const Default = "BottomBar3Left";
const item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.FullPathBar = {
		Title: item.getAttribute("Title"),
		Selected: !item.getAttribute("NoSelected"),

		Show: async function (Ctrl) {
			if (Ctrl) {
				let s;
				const nType = await Ctrl.Type;
				if (nType == CTRL_SB || nType == CTRL_EB) {
					s = await api.GetDisplayNameOf((Addons.FullPathBar.Selected && await Ctrl.SelectedItems().Item(0)) || Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
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
	SetTabContents(0, "View", '<label><input type="checkbox" id="Title">Title bar</label><br><label><input type="checkbox" id="!NoSelected">Selected items</label>');
}
