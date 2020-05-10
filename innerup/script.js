if (window.Addon == 1) {
	Addons.InnerUp =
	{
		Exec: function (Id) {
			var FV = GetInnerFV(Id);
			if (FV) {
				FV.Focus();
				Exec(FV, "Up", "Tabs");
			}
			return false;
		},

		Popup: function (o, id) {
			var FV = GetInnerFV(id);
			if (FV) {
				FV.Focus();
				FolderMenu.Clear();
				var hMenu = api.CreatePopupMenu();
				var FolderItem = FV.FolderItem;
				while (!api.ILIsEmpty(FolderItem)) {
					FolderItem = api.ILRemoveLastID(FolderItem);
					FolderMenu.AddMenuItem(hMenu, FolderItem);
				}
				var pt = api.Memory("POINT");
				api.GetCursorPos(pt);
				window.g_menu_click = true;
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, external.hwnd, null, null);
				api.DestroyMenu(hMenu);
				if (nVerb) {
					FolderMenu.Invoke(FolderMenu.Items[nVerb - 1]);
				}
				FolderMenu.Clear();
			}
		}
	};

	AddEvent("PanelCreated", function (Ctrl) {
		var h = GetIconSize(GetAddonOption("innerup", "IconSize"), 16);
		var s = GetAddonOption("innerup", "Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,28" : "bitmap:ieframe.dll,214,24,28");
		s = ['<span class="button" onclick="return Addons.InnerUp.Exec($)" oncontextmenu="Addons.InnerUp.Popup(this, $); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: "Up", src: s }, h), '</span>'];
		SetAddon(null, "Inner1Left_" + Ctrl.Id, s.join("").replace(/\$/g, Ctrl.Id));
	});
}
