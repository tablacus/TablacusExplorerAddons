const Addon_Id = "filterbutton";
const Default = "ToolBar2Left";

const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.FilterButton = {
		RE: item.getAttribute("RE"),

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderViewEx(Ctrl, pt);
			if (FV) {
				FV.Focus();
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
				s = await InputDialog("Filter", s);
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
					FV.FilterView = s || null;
					FV.Refresh();
				}
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
		Common.FilterButton = await api.CreateObject("Object");
		Common.FilterButton.strMenu = item.getAttribute("Menu");
		Common.FilterButton.strName = item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name;
		Common.FilterButton.nPos = GetNum(item.getAttribute("MenuPos"));
		$.importScript("addons\\" + Addon_Id + "\\sync.js");
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.FilterButton.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.FilterButton.Exec, "Async");
	}
	//Type
	AddTypeEx("Add-ons", "Filter button", Addons.FilterButton.Exec);

	const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	const s = item.getAttribute("Icon") || "bitmap:comctl32.dll,140,13,0";
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.FilterButton.Exec(this)" oncontextmenu="return Addons.FilterButton.Popup(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut();">', await GetImgTag({ title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, src: s }, h), '</span>']);
} else {
	EnableInner();
	SetTabContents(0, "General", '<input type="checkbox" id="RE" name="RE"><label for="RE">Regular expression</label>/<label for="RE">Migemo</label>');
}
