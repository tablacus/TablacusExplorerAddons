var Addon_Id = "touch";

var item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Context");
	item.setAttribute("MenuPos", 1);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("MouseOn", "List");
}
if (window.Addon == 1) {
	Addons.Touch = {
		Exec: async function (Ctrl, pt) {
			var Selected = await (await GetSelectedArray(Ctrl, pt, true)).shift();
			var nSelected = await Selected.Count;
			if (Selected && nSelected) {
				try {
					var Item = await Selected.Item(0);
					var ModifyDate = await FormatDateTime(await api.ObjGetI(Item, "ModifyDate"));
					var s = await InputDialog((await te.OnReplacePath(await Item.Path) || await Item.Path) + (nSelected > 1 ? " : " + nSelected : "") + "\n" + ModifyDate, ModifyDate);
					if (s) {
						for (var i = nSelected; i-- > 0;) {
							if (!await SetFileTime(await Selected.Item(i).Path, null, null, s)) {
								Selected.Item(i).ModifyDate = s;
							}
						}
					}
				} catch (e) {
					wsh.Popup(e.description + "\n" + s, 0, TITLE, MB_ICONSTOP);
				}
			}
		}
	};
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Touch.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Touch.Exec, "Async");
	}

	AddTypeEx("Add-ons", "Change the Date modified...", Addons.Touch.Exec);

	if (item.getAttribute("MenuExec")) {
		importJScript("addons\\" + Addon_Id + "\\sync.js");
	}
}
