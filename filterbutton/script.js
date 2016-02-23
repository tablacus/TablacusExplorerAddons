var Addon_Id = "filterbutton";
var Default = "ToolBar2Left";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
var item = items.length ? items[0] : null;

if (window.Addon == 1) {
	Addons.FilterButton =
	{
		strName: "",

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				var s = InputDialog("Filter", FV.FilterView);
				if (typeof(s) == "string") {
					FV.FilterView = s;
					FV.Refresh();
				}
			}
			return S_OK;
		},

		Popup: function (o)
		{
			if (Addons.FilterList) {
				Addons.FilterList.Exec(o);
			}
			return false;
		}

	};

	if (item) {
		Addons.FilterButton.strName = item.getAttribute("MenuName") || GetText(GetAddonInfo(Addon_Id).Name);
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.FilterButton.nPos = api.LowPart(item.getAttribute("MenuPos"));
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.FilterButton.nPos, MF_BYPOSITION | MF_STRING | Addons.FilterButton.Enabled ? MF_CHECKED : 0, ++nPos, GetText(Addons.FilterButton.strName));
				ExtraMenuCommand[nPos] = Addons.FilterButton.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.FilterButton.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.FilterButton.Exec, "Func");
		}
		//Type
		AddTypeEx("Add-ons", "Filter button", Addons.FilterButton.Exec);
	}

	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 16;
	var s = GetAddonOption(Addon_Id, "Icon") || "../addons/filterbutton/filter.png";

	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.FilterButton.Exec(this);" oncontextmenu="return Addons.FilterButton.Popup(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut();"><img id="FolderButton" title="', Addons.FilterButton.strName.replace(/"/g, ""), '" src="', s.replace(/"/g, ""), '" width="', h, 'px" height="', h, 'px" />', '</span>']);
} else {
	EnableInner();
}
