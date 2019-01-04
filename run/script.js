var Addon_Id = "run";
var Default = "ToolBar2Left";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("Menu", "Tool");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("Key", "F10");

	item.setAttribute("MouseOn", "List");
	item.setAttribute("Mouse", "");
}
if (window.Addon == 1) {
	Addons.Run =
	{
		strName: item.getAttribute("MenuName") || api.LoadString(hShell32, 12710),
		nPos: api.LowPart(item.getAttribute("MenuPos")),

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

	//Menu
	if (api.LowPart(item.getAttribute("MenuExec"))) {
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
	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = item.getAttribute("Icon") || "icon:shell32.dll,24";
	SetAddon(Addon_Id, Default, ['<span class="button" id="Run" onclick="Addons.Run.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.Run.strName, src: src }, h), '</span>']);
} else {
	EnableInner();
}
