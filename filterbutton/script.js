var Addon_Id = "filterbutton";
var Default = "ToolBar2Left";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.FilterButton =
	{
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),
		RE: item.getAttribute("RE"),

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
				var s = FV.FilterView
				if (Addons.FilterButton.RE) {
					var res = /^\/(.*)\/i/.exec(s);
					if (res) {
						s = res[1];
					}
				} else if (s && !/^\//.test(s)) {
					var ar = s.split(/;/);
					for (var i in ar) {
						var res = /^\*([^/?/*]+)\*$/.exec(ar[i]);
						if (res) {
							ar[i] = res[1];
						}
					}
					s = ar.join(";");
				}
				s = InputDialog("Filter", s);
				if (typeof(s) == "string") {
					if (Addons.FilterButton.RE && !/^\*|\//.test(s)) {
						s = "/" + s + "/i";
					} else if (!/^\//.test(s)) {
						var ar = s.split(/;/);
						for (var i in ar) {
							var res = /^([^\*\?]+)$/.exec(ar[i]); 
							if (res) {
								ar[i] = "*" + res[1] + "*";
							}
						}
						s = ar.join(";");
					}
					FV.FilterView = s || null;
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

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var s = item.getAttribute("Icon") || "../addons/filterbutton/filter.png";

	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.FilterButton.Exec(this)" oncontextmenu="return Addons.FilterButton.Popup(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut();">', GetImgTag({ title: Addons.FilterButton.strName, src:s }, h), '</span>']);
} else {
	EnableInner();
	SetTabContents(0, "General", '<input type="checkbox" id="RE" name="RE" /><label for="RE">Regular Expression</label>/<label for="RE">Migemo</label>');
}
