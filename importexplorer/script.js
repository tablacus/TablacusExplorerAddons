Addon_Id = "importexplorer";
Default = "ToolBar2Left";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
	if (!item.getAttribute("Set")) {
		item.setAttribute("RealFolders", 1);
		item.setAttribute("SpecialFolders", 1);
		item.setAttribute("TakeOver", 1);
	}
}
if (window.Addon == 1) {
	Addons.ImportExplorer =
	{
		nPos: 0,
		strName: "",

		Exec: function ()
		{
			try {
				var sw = sha.Windows();
				for (var i = sw.Count; i-- > 0;) {
					var exp = sw.item(i);
					if (exp && exp.Visible && !exp.Busy) {
						var doc = exp.Document;
						if (doc) {
							if (Addons.ImportExplorer.Match(api.GetDisplayNameOf(doc, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING)) == S_OK) {
								exp.Visible = false;
								var FV = te.Ctrl(CTRL_FV);
								FV = FV.Navigate(doc, SBSP_NEWBROWSER);
								if (Addons.ImportExplorer.TakeOver) {
									FV.CurrentViewMode = doc.CurrentViewMode;
									if (doc.IconSize) {
										FV.IconSize = doc.IconSize;
									}
									if (doc.SortColumns) {
										FV.SortColumns = doc.SortColumns;
									}
								}
								exp.Quit();
								RestoreFromTray();
								api.SetForegroundWindow(te.hwnd);
							}
						}
					}
				}
			}
			catch (e) {
			}
			return S_OK;
		},

		Match: function (path)
		{
			if (path && Addons.ImportExplorer[/^.?:\\|^\\\\/.test(path) ? "RealFolders" : "SpecialFolders"]) {
				return RunEvent2("Addons.OpenInstead", path);
			}
			return S_FALSE;
		}
	};

	if (item) {
		Addons.ImportExplorer.RealFolders = item.getAttribute("RealFolders");
		Addons.ImportExplorer.SpecialFolders = item.getAttribute("SpecialFolders");
		Addons.ImportExplorer.TakeOver = item.getAttribute("TakeOver");
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.ImportExplorer.nPos = api.LowPart(item.getAttribute("MenuPos"));
			var s = item.getAttribute("MenuName");
			if (s && s != "") {
				Addons.ImportExplorer.strName = s;
			}
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.ImportExplorer.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.ImportExplorer.strName));
				ExtraMenuCommand[nPos] = Addons.ImportExplorer.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.ImportExplorer.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.ImportExplorer.Exec, "Func");
		}
		//Type
		AddTypeEx("Add-ons", "Import Explorer", Addons.ImportExplorer.Exec);
	}

	if (Addons.ImportExplorer.strName == "") {
		var info = GetAddonInfo(Addon_Id);
		Addons.ImportExplorer.strName = GetText(info.Name);
	}
	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var src = ExtractMacro(te, GetAddonOption(Addon_Id, "Icon") || "%windir%\\explorer.exe");
	var s = ['<span class="button" onclick="return Addons.ImportExplorer.Exec(this, 0);" oncontextmenu="return Addons.ImportExplorer.Exec(this, 1);" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="', Addons.ImportExplorer.strName.replace(/"/g, ""), '" src="', src.replace(/"/g, ""), '" width="', h, 'px" height="' + h, 'px"></span>'];
	SetAddon(Addon_Id, Default, s);
}
else {
	var s = ['<input type="checkbox" id="RealFolders" /><label for="RealFolders">Real Folders</label><br />'];
	s.push('<input type="checkbox" id="SpecialFolders" /><label for="SpecialFolders">Special Folders</label><br />');
	s.push('<input type="checkbox" id="TakeOver" /><label for="TakeOver">Take over the Explorer view</label>');
	document.getElementById("tab0").value = GetText("General");
	document.getElementById("panel0").innerHTML = s.join("");
}
