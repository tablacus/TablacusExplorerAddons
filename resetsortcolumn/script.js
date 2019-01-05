var Addon_Id = "resetsortcolumn";
var Default = "None";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "File");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.ResetSortColumn =
	{
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			FV.SortColumn = "System.Null";
			return S_OK;
		}
	};
	//Menu
	if (item.getAttribute("MenuExec")) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.ResetSortColumn.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.ResetSortColumn.strName));
			ExtraMenuCommand[nPos] = Addons.ResetSortColumn.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.ResetSortColumn.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.ResetSortColumn.Exec, "Func");
	}
	AddTypeEx("Add-ons", "Reset sort columns", Addons.ResetSortColumn.Exec);

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var s = item.getAttribute("Icon");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.ResetSortColumn.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.ResetSortColumn.strName, src: s }, h), '</span>']);
} else {
	EnableInner();
}
