var Addon_Id = "folderbutton";
var Default = "ToolBar2Left";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.FolderButton =
	{
		bDrag: false,
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				var s = InputDialog("Path", api.GetDisplayNameOf(FV.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
				if (s) {
					FV.Navigate(s, GetNavigateFlags(FV));
				}
			}
			return S_OK;
		},

		Popup: function (o)
		{
			var FV = te.Ctrl(CTRL_FV);
			if (FV) {
				pt = GetPos(o, true);
				var FolderItem = FolderMenu.Open(FV.FolderItem, pt.x, pt.y + o.offsetHeight * screen.deviceYDPI / screen.logicalYDPI);
				FolderMenu.Invoke(FolderItem);
			}
			return false;
		},

		Button: function (b)
		{
			this.bDrag = b;
		},

		Drag: function (o)
		{
			var FV = GetFolderView(o);
			FV.Focus();
			if (this.bDrag) {
				this.bDrag = false;
				var TC = te.Ctrl(CTRL_TC);
				if (TC && TC.SelectedIndex >= 0) {
					var pdwEffect = [DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK];
					te.Data.DragTab = TC;
					te.Data.DragIndex = TC.SelectedIndex;
					api.SHDoDragDrop(null, TC.Item(TC.SelectedIndex).FolderItem, te, pdwEffect[0], pdwEffect);
					te.Data.DragTab = null;
				}
			}
		}
	};

	//Menu
	if (item.getAttribute("MenuExec")) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.FolderButton.nPos, MF_BYPOSITION | MF_STRING | Addons.FolderButton.Enabled ? MF_CHECKED : 0, ++nPos, GetText(Addons.FolderButton.strName));
			ExtraMenuCommand[nPos] = Addons.FolderButton.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.FolderButton.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.FolderButton.Exec, "Func");
	}
	//Type
	AddTypeEx("Add-ons", "Folder button", Addons.FolderButton.Exec);

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var s = item.getAttribute("Icon");
	if (!s) {
		s = "icon:shell32.dll,4,16";
		AddEvent("ChangeView", function (Ctrl)
		{
			(document.getElementById("FolderButton") || {}).src = GetIconImage(Ctrl, api.GetSysColor(COLOR_BTNFACE));
		});
	}
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.FolderButton.Exec(this)" oncontextmenu="return Addons.FolderButton.Popup(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()" Addons.FolderButton.Drag()" onmousedown="Addons.FolderButton.Button(true)" onmouseup="Addons.FolderButton.Button(false)">', GetImgTag({ id: "FolderButton", title:  Addons.FolderButton.strName, src: s }, h), '</span>']);
} else {
	EnableInner();
}
