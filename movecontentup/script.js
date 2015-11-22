Addon_Id = "movecontentup";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
	if (!item.getAttribute("Set")) {
		item.setAttribute("MenuExec", 1);
		item.setAttribute("Menu", "Context");
		item.setAttribute("MenuPos", 1);

		item.setAttribute("KeyOn", "List");
		item.setAttribute("MouseOn", "List");
	}
}
if (window.Addon == 1) {
	Addons.MoveContentUp =
	{
		Exec: function (Ctrl, pt)
		{
			var wfd = api.Memory("WIN32_FIND_DATA");
			try {
				var arg = GetSelectedArray(Ctrl, pt, true);
				var Selected = arg[0];
				if (!Selected || !Selected.Count || !confirmOk("Are you sure?")) {
					return;
				}
				var fFlags = api.GetKeyState(VK_SHIFT) < 0 ? 0 : FOF_ALLOWUNDO;
				var ar = [];
				var arItems = [];
				for (var i = Selected.Count; i-- > 0;) {
					var Item = Selected.Item(i);
					if (Item.IsFolder) {
						api.SHGetDataFromIDList(Item, SHGDFIL_FINDDATA, wfd, wfd.Size);
						if  (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
							var Items1 = Item.GetFolder.Items();
							for (var j = Items1.Count; j-- > 0;) {
								arItems.unshift(Items1.Item(j).Path);
							}
							ar.push(Item);
						}
					}
				}
				if (arItems.length) {
					api.SHFileOperation(FO_MOVE, arItems.join("\0"), arg[2].FolderItem.Path, fFlags, false);
					arItems = [];
					for (var i = ar.length; i--;) {
						if (ar[i].GetFolder.Items().Count == 0) {
							arItems.unshift(ar[i].Path);
						}
					}
					if (arItems.length) {
						api.SHFileOperation(FO_DELETE, arItems.join("\0"), null, fFlags | FOF_NOCONFIRMATION, true);
					}
				}
			} catch (e) {
				MessageBox([(e.description || e.toString()), s].join("\n"), TITLE, MB_OK);
			}
			return S_OK;
		}
	}

	if (items.length) {
		var s = item.getAttribute("MenuName");
		if (!s || s == "") {
			var info = GetAddonInfo(Addon_Id);
			s = info.Name;
		}
		Addons.MoveContentUp.strName = GetText(s);
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.MoveContentUp.nPos = api.LowPart(item.getAttribute("MenuPos"));
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item)
			{
				if (item && item.IsFileSystem && item.IsFolder) {
					var wfd = api.Memory("WIN32_FIND_DATA");
					api.SHGetDataFromIDList(item, SHGDFIL_FINDDATA, wfd, wfd.Size);
					if  (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
						api.InsertMenu(hMenu, Addons.MoveContentUp.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.MoveContentUp.strName);
						ExtraMenuCommand[nPos] = Addons.MoveContentUp.Exec;
					}
				}
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.MoveContentUp.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.MoveContentUp.Exec, "Func");
		}

		AddTypeEx("Add-ons", "Move content up", Addons.MoveContentUp.Exec);
	}
}
