var Addon_Id = "properties";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	var item = GetAddonElement(Addon_Id);

	Addons.Properties =
	{
		strName: item.getAttribute("MenuName") || api.LoadString(hShell32, 33555),
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
				var Items = FV.SelectedItems();
				if (Items.Count == 0) {
					Items = FV.FolderItem;
				}
				var hMenu = api.CreatePopupMenu();
				var ContextMenu = api.ContextMenu(Items, FV);
				if (ContextMenu) {
					ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_DEFAULTONLY);
					ContextMenu.InvokeCommand(0, te.hwnd, CommandID_PROPERTIES - 1, null, null, SW_SHOWNORMAL, 0, 0);
				}
				api.DestroyMenu(hMenu);
			}
			return S_OK;
		}

	};
	//Menu
	if (item.getAttribute("MenuExec")) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.Properties.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.Properties.strName));
			ExtraMenuCommand[nPos] = Addons.Properties.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Properties.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Properties.Exec, "Func");
	}
	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,15" : "bitmap:ieframe.dll,214,24,15");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.Properties.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.Properties.strName, src: src }, h), '</span>']);
} else {
	EnableInner();
}
