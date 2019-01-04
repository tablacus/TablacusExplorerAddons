var Addon_Id = "importexplorer";
var Default = "ToolBar2Left";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("RealFolders", 1);
	item.setAttribute("SpecialFolders", 1);
	item.setAttribute("TakeOver", 1);
}
if (window.Addon == 1) {
	Addons.ImportExplorer =
	{
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		Exec: function ()
		{
			try {
				var sw = sha.Windows();
				for (var i = sw.Count; i-- > 0;) {
					var exp = sw.item(i);
					if (exp && exp.Visible && !exp.Busy) {
						var doc = exp.Document;
						if (doc) {
							if (Addons.ImportExplorer.Match(api.GetDisplayNameOf(doc, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL))) {
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
			} catch (e) {}
			return S_OK;
		},

		Match: function (path)
		{
			if (path && Addons.ImportExplorer[/^.?:\\|^\\\\/.test(path) ? "RealFolders" : "SpecialFolders"]) {
				return !RunEvent3("UseExplorer", path);
			}
		}
	};

	if (item) {
		Addons.ImportExplorer.RealFolders = item.getAttribute("RealFolders");
		Addons.ImportExplorer.SpecialFolders = item.getAttribute("SpecialFolders");
		Addons.ImportExplorer.TakeOver = item.getAttribute("TakeOver");
		//Menu
		if (item.getAttribute("MenuExec")) {
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

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = ExtractMacro(te, item.getAttribute("Icon") || "%windir%\\explorer.exe");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="return Addons.ImportExplorer.Exec(this, 0);" oncontextmenu="return Addons.ImportExplorer.Exec(this, 1);" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.ImportExplorer.strName, src: src }, h), '</span>']);
} else {
	EnableInner();
	var s = ['<input type="checkbox" id="RealFolders" /><label for="RealFolders">Real Folders</label><br />'];
	s.push('<input type="checkbox" id="SpecialFolders" /><label for="SpecialFolders">Special Folders</label><br />');
	s.push('<input type="checkbox" id="TakeOver" /><label for="TakeOver">Take over the Explorer view</label>');
	SetTabContents(0, "General", s.join(""));
}
