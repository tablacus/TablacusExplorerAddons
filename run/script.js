var Addon_Id = "run";
var Default = "ToolBar2Left";

if (window.Addon == 1) { (function () {
	Addons.Run =
	{
		nPos: 0,
		strName: "Run",

		Exec: function ()
		{
			var path = "";
			var FV = external.Ctrl(CTRL_FV);
			if (FV && FV.FolderItem) {
				path = api.GetDisplayNameOf(FV.FolderItem, SHGDN_FORPARSING);
			}
			api.ShRunDialog(external.hwnd, 0, path, null, null, 0);
			wsh.CurrentDirectory = "C:\\";
			return false;
		}
	}

	var items = te.Data.Addons.getElementsByTagName(Addon_Id);
	if (items.length) {
		var item = items[0];
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
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), "Addons.Run.Exec();", "JScript");
		}
		//Mouse
		if (api.LowPart(item.getAttribute("MouseExec"))) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), "Addons.Run.Exec();", "JScript");
		}
	}
	var s = (window.IconSize == 16) ? 'src="../image/toolbar/s_3_76.png" icon="shell32.dll,24,16"' : 'src="../image/toolbar/l_3_76.png" icon="shell32.dll,24,32"';
	if (window.IconSize != 16 || window.IconSize < 32) {
		s += ' style="width:24px; height:24px"';
	}
	s = '<span class="button" id="Run" onclick="Addons.Run.Exec();"  onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img alt="Run" ' + s + '></span><span style="width: 1px"> </span>';
	SetAddon(Addon_Id, Default, s);

})();}
