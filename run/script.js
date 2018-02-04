var Addon_Id = "run";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	Addons.Run =
	{
		nPos: 0,
		strName: "Run",

		Exec: function (Ctrl, pt)
		{
			var path = "";
			var FV = GetFolderView(Ctrl, pt);
			if (FV && FV.FolderItem) {
				path = api.GetDisplayNameOf(FV.FolderItem, SHGDN_FORPARSING);
			}
			api.ShRunDialog(te.hwnd, 0, path, null, null, 0);
			wsh.CurrentDirectory = "C:\\";
			return S_OK;
		}
	}

	var item = GetAddonElement(Addon_Id);
	if (!item.getAttribute("Set")) {
		item.setAttribute("Menu", "Tool");
		item.setAttribute("MenuPos", -1);
		item.setAttribute("MenuName", Addons.Run.strName);

		item.setAttribute("KeyOn", "List");
		item.setAttribute("Key", "F10");

		item.setAttribute("MouseOn", "List");
		item.setAttribute("Mouse", "");
	}
	//Menu
	if (api.LowPart(item.getAttribute("MenuExec"))) {
		Addons.Run.nPos = api.LowPart(item.getAttribute("MenuPos"));
		var s = item.getAttribute("MenuName");
		if (s && s != "") {
			Addons.Run.strName = s;
		}
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.Run.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.Run.strName));
			ExtraMenuCommand[nPos] = Addons.Run.Exec;
			return nPos;
		});
	}
	//Key
	if (api.LowPart(item.getAttribute("KeyExec"))) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Run.Exec, "Func");
	}
	//Mouse
	if (api.LowPart(item.getAttribute("MouseExec"))) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Run.Exec, "Func");
	}
	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize;
	var src = GetAddonOption(Addon_Id, "Icon") || "icon:shell32.dll,24";
	var s = ['<span class="button" id="Run" onclick="Addons.Run.Exec(this);" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="', GetTextR("@shell32.dll,-12710"),'" src="', src.replace(/"/g, ""), '" width="', h, 'px" height="' + h, 'px"></span>'];
	SetAddon(Addon_Id, Default, s);
} else {
	EnableInner();
}
