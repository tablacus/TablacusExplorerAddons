var Addon_Id = "paste";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	Addons.Paste =
	{
		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
				var Items = FV.FolderItem;
				var ContextMenu = api.ContextMenu(Items, FV);
				if (ContextMenu) {
					var hMenu = api.CreatePopupMenu();
					ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_DEFAULTONLY);
					ContextMenu.InvokeCommand(0, te.hwnd, CommandID_PASTE - 1, null, null, SW_SHOWNORMAL, 0, 0);
					api.DestroyMenu(hMenu);
				}
			}
			return S_OK;
		},

		State: function ()
		{
			var Items = api.OleGetClipboard();
			var b = !(Items && Items.Count);
			var o = document.getElementById("ImgPaste_$");
			if (o) {
				DisableImage(o, b);
			} else {
				var cTC = te.Ctrls(CTRL_TC);
				for (var i in cTC) {
					o = document.getElementById("ImgPaste_" + cTC[i].Id);
					if (o) {
						DisableImage(o, b);
					}
				}
			}
		}
	};

	AddEvent("SystemMessage", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		if (msg == WM_CLIPBOARDUPDATE) {
			Addons.Paste.State();
		}
	});

	AddEvent("Resize", Addons.Paste.State);

	var item = GetAddonElement(Addon_Id);
	Addons.Paste.strName = item.getAttribute("MenuName") || api.LoadString(hShell32, 33562);
	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.Paste.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.Paste.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.Paste.strName));
			ExtraMenuCommand[nPos] = Addons.Paste.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Paste.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Paste.Exec, "Func");
	}
	var h = item.getAttribute("IconSize") || window.IconSize || (item.getAttribute("Location") == "Inner" ? 16 : 24);
	var src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,7" : "bitmap:ieframe.dll,214,24,7");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.Paste.Exec(this);" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="', Addons.Paste.strName.replace(/"/g, "") ,'" id="ImgPaste_$" src="', src, '" width="', h, 'px" height="', h, 'px"></span>']);
} else {
	EnableInner();
}
