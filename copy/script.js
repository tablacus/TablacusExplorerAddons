var Addon_Id = "copy";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	Addons.Copy =
	{
		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
				var Items = FV.SelectedItems();
				if (Items.Count) {
					var hMenu = api.CreatePopupMenu();
					var ContextMenu = api.ContextMenu(Items, FV);
					if (ContextMenu) {
						ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_DEFAULTONLY);
						ContextMenu.InvokeCommand(0, te.hwnd, CommandID_COPY - 1, null, null, SW_SHOWNORMAL, 0, 0);
					}
					api.DestroyMenu(hMenu);
				}
			}
			return S_OK;
		},

		State: function (Ctrl)
		{
			if (!Ctrl) {
				Ctrl = te.Ctrl(CTRL_FV);
			}
			if (Ctrl && Ctrl.Type <= CTRL_EB) {
				var o = document.getElementById("ImgCopy_$");
				if (o) {
					if (Ctrl.Id == te.Ctrl(CTRL_FV).Id) {
						DisableImage(o, Ctrl.ItemCount(SVGIO_SELECTION) == 0);
					}
				} else {
					var cTC = te.Ctrls(CTRL_TC);
					for (var i in cTC) {
						o = document.getElementById("ImgCopy_" + cTC[i].Id);
						if (o) {
							DisableImage(o, cTC[i].Selected.ItemCount(SVGIO_SELECTION) == 0);
						}
					}
				}
			}
		}
	};

	AddEvent("SelectionChanged", Addons.Copy.State);
	AddEvent("Resize", Addons.Copy.State);

	var item = GetAddonElement(Addon_Id);
	Addons.Copy.strName = item.getAttribute("MenuName") || api.LoadString(hShell32, 33561);
	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.Copy.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.Copy.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.Copy.strName));
			ExtraMenuCommand[nPos] = Addons.Copy.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Copy.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Copy.Exec, "Func");
	}
	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,6" : "bitmap:ieframe.dll,214,24,6");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.Copy.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.Copy.strName, id: "ImgCopy_$", src: src }, h), '</span>']);
} else {
	EnableInner();
}
