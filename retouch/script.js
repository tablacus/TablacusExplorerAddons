var Addon_Id = "retouch";
var Default = "ToolBar2Left";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Edit");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyOn", "List");

	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	Addons.Retouch =
	{
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				var Selected = FV.SelectedItems();
				if (Selected.Count) {
					FV.Focus();
					ShowDialog("../addons/retouch/preview.html", { MainWindow: window, width: 800, height: 600 });
				}
			}
		}
	};
	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var s = item.getAttribute("Icon") || (h <= 16 ? "icon:shell32.dll,141,16" : "icon:shell32.dll,141,32");
	s = ['<span class="button" id="RetouchButton" onclick="Addons.Retouch.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.Retouch.strName, src: s }, h), '</span>'];
	SetAddon(Addon_Id, Default, s);

	//Menu
	if (item.getAttribute("MenuExec")) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.Retouch.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.Retouch.strName);
			ExtraMenuCommand[nPos] = Addons.Retouch.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Retouch.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Retouch.Exec, "Func");
	}

	AddTypeEx("Add-ons", "Retouch", Addons.Retouch.Exec);
} else if (window.Addon == 2) {
	importScript("addons\\retouch\\preview.js");
} else {
	EnableInner();
}
