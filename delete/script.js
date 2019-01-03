var Addon_Id = "delete";
var Default = "ToolBar2Left";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Delete =
	{
		strName: item.getAttribute("MenuName") || GetText("Delete"),

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
						ContextMenu.InvokeCommand(0, te.hwnd, CommandID_DELETE - 1, null, null, SW_SHOWNORMAL, 0, 0);
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
				var o = document.getElementById("ImgDelete_$");
				if (o) {
					if (Ctrl.Id == te.Ctrl(CTRL_FV).Id) {
						DisableImage(o, Ctrl.ItemCount(SVGIO_SELECTION) == 0);
					}
				} else {
					var cTC = te.Ctrls(CTRL_TC);
					for (var i in cTC) {
						o = document.getElementById("ImgDelete_" + cTC[i].Id);
						if (o) {
							DisableImage(o, cTC[i].Selected.ItemCount(SVGIO_SELECTION) == 0);
						}
					}
				}
			}
		}
	};

	AddEvent("SelectionChanged", Addons.Delete.State);
	AddEvent("Resize", Addons.Delete.State);
	AddEvent("ChangeNotify", function (Ctrl, pidls)
	{
		if (pidls.lEvent & (SHCNE_DELETE | SHCNE_RMDIR | SHCNE_UPDATEDIR)) {
			setTimeout(Addons.Delete.State, 99);
		}
	});

	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.Delete.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.Delete.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.Delete.strName));
			ExtraMenuCommand[nPos] = Addons.Delete.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Delete.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Delete.Exec, "Func");
	}
	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,10" : "bitmap:ieframe.dll,214,24,10");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.Delete.Exec(this);" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.Delete.strName, id: "ImgDelete_$", src: src }, h), '</span>']);
} else {
	EnableInner();
}
