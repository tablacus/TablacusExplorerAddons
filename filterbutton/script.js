const Addon_Id = "filterbutton";
const Default = "ToolBar2Left";
const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.FilterButton = {
		RE: item.getAttribute("RE"),
		sName: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
				if (await IsSearchPath(FV)) {
					Exec(FV, "Search", "Tools", 0, pt);
					return;
				}
				let s = await FV.FilterView
				if (Addons.FilterButton.RE) {
					const res = /^\/(.*)\/i/.exec(s);
					if (res) {
						s = res[1];
					}
				} else if (s && !/^\//.test(s)) {
					const ar = s.split(/;/);
					for (let i in ar) {
						const res = /^\*([^/?/*]+)\*$/.exec(ar[i]);
						if (res) {
							ar[i] = res[1];
						}
					}
					s = ar.join(";");
				}
				InputDialog("Filter", s, function (s) {
					if ("string" === typeof s) {
						if (Addons.FilterButton.RE && !/^\*|\//.test(s)) {
							s = "/" + s + "/i";
						} else if (!/^\//.test(s)) {
							const ar = s.split(/;/);
							for (let i in ar) {
								const res = /^([^\*\?]+)$/.exec(ar[i]);
								if (res) {
									ar[i] = "*" + res[1] + "*";
								}
							}
							s = ar.join(";");
						}
						SetFilterView(FV, s);
					}
				});
			}
		},

		Popup: function (o) {
			if (Addons.FilterList) {
				Addons.FilterList.Exec(o);
			}
			return false;
		}

	};

	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("FilterButton", Addons.FilterButton.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.FilterButton.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.FilterButton.Exec, "Async");
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.FilterButton.Exec(this)" oncontextmenu="return Addons.FilterButton.Popup(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut();">', await GetImgTag({
			title: Addons.FilterButton.sName,
			src: item.getAttribute("Icon") || (WINVER >= 0xa00 ? "font:Segoe MDL2 Assets,0xe71c" : "bitmap:comctl32.dll,140,13,0")
		}, GetIconSizeEx(item)), '</span>']);
	});

	AddTypeEx("Add-ons", "Filter button", Addons.FilterButton.Exec);
} else {
	EnableInner();
	SetTabContents(0, "General", '<input type="checkbox" id="RE" name="RE"><label for="RE">Regular expression</label>/<label for="RE">Migemo</label>');
}
