var Addon_Id = "touch";

(function () {
	var items = te.Data.Addons.getElementsByTagName(Addon_Id);
	if (items.length) {
		var item = items[0];
		if (!item.getAttribute("Set")) {
			item.setAttribute("MenuExec", 1);
			item.setAttribute("Menu", "Context");
			item.setAttribute("MenuPos", 0);
			item.setAttribute("MenuName", "Change the Date modified...");

			item.setAttribute("KeyOn", "List");
			item.setAttribute("MouseOn", "List");
		}
	}
	if (window.Addon == 1) {
		Addons.Touch =
		{
			Exec: function (Ctrl, pt)
			{
				var FV = GetFolderView(Ctrl, pt);
				if (FV) {
					try {
						var ModifyDate;
						var Selected = FV.SelectedItems();
						if (!Selected.Count && FV.FocusedItem) {
							Selected = te.FolderItems();
							Selected.AddItem(FV.FocusedItem);
						}
						if (Selected.Count) {
							var item = Selected.Item(0);
							try {
								Addons.Touch.s = item.ModifyDate;
								execScript("Addons.Touch.s = FormatDateTime(Addons.Touch.s)", "VBScript");
								ModifyDate = Addons.Touch.s;
							}
							catch (e) {
								ModifyDate = new Date(item.ModifyDate).toLocaleString();
							}
							var s = InputDialog(item.Path + (Selected.Count > 1 ? " : " + Selected.Count : "") + "\n" + ModifyDate, ModifyDate);
							if (s) {
								ModifyDate = isNaN(new Date(s)) ? s : new Date(s).getVarDate();
								for (var i = Selected.Count - 1; i >= 0; i--) {
									Selected.Item(i).ModifyDate = ModifyDate;
								}
							}
						}
					}
					catch (e) {
						wsh.Popup(e.description + "\n" + s, 0, TITLE, MB_ICONEXCLAMATION);
					}
				}
			}
		}

		if (items.length) {
			var s = item.getAttribute("MenuName");
			if (s && s != "") {
				Addons.Touch.strName = GetText(s);
			}
			//Menu
			if (item.getAttribute("MenuExec")) {
				Addons.Touch.nPos = api.LowPart(item.getAttribute("MenuPos"));
				AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
				{
					var Selected = Ctrl.SelectedItems();
					if (Selected && Selected.Count) {
						var item = Selected.Item(0);
						if (item.IsFileSystem) {
							api.InsertMenu(hMenu, Addons.Touch.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.Touch.strName);
							ExtraMenuCommand[nPos] = Addons.Touch.Exec;
						}
					}
					return nPos;
				});
			}
			//Key
			if (item.getAttribute("KeyExec")) {
				SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), "Addons.Touch.Exec();", "JScript");
			}
			//Mouse
			if (item.getAttribute("MouseExec")) {
				SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), "Addons.Touch.Exec();", "JScript");
			}

			AddTypeEx("Add-ons", "Change the Date modified...", Addons.Touch.Exec);
		}
	}
})();
