var Addon_Id = "previewwindow";
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
	Addons.PreviewWindow =
	{
		nPos: 0,
		strName: "",

		Exec: function (Ctrl, pt)
		{
			if (this.dlg) {
				this.Arrange(GetFolderView(Ctrl, pt));
			} else {
				this.dlg = ShowDialog("../addons/previewwindow/preview.html", {MainWindow: window, width: 800, height: 600});
			}
		},

		Arrange: function (Ctrl)
		{
			if (!Ctrl) {
				Ctrl = te.Ctrl(CTRL_FV);
			}
			if (this.dlg) {
				if (Ctrl.ItemCount(SVGIO_SELECTION) == 1) {
					Addons.PreviewWindow.Item = Ctrl.SelectedItems().Item(0);
					Addons.PreviewWindow.File = api.GetDisplayNameOf(Addons.PreviewWindow.Item, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
				}
				this.dlg.Window.Addons.PreviewWindow.Change(te.hwnd);
			}
		}
	};

	AddEvent("StatusText", function (Ctrl, Text, iPart)
	{
		if (Ctrl.Type <= CTRL_EB && Text) {
			if (Ctrl.ItemCount(SVGIO_SELECTION) == 1) {
				Addons.PreviewWindow.Arrange(Ctrl);
			}
		}
	});

	Addons.PreviewWindow.strName = item.getAttribute("MenuName") || "Preview window...";
	var h = item.getAttribute("IconSize") || window.IconSize || 24;
	var s = item.getAttribute("Icon") || MakeImgSrc("*.jpg", 0);
	s = ['<span class="button" id="WindowPreviewButton" onclick="Addons.PreviewWindow.Exec()" onmouseover="MouseOver(this)" onmouseout="MouseOut()" oncontextmenu="return false;"><img title="', EncodeSC(Addons.PreviewWindow.strName), '" src="', EncodeSC(s), '" style="width:', h, 'px; height:', h, 'px"' ,'></span>'];
	SetAddon(Addon_Id, Default, s);

	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.PreviewWindow.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.PreviewWindow.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.PreviewWindow.strName);
			ExtraMenuCommand[nPos] = Addons.PreviewWindow.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.PreviewWindow.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.PreviewWindow.Exec, "Func");
	}

	AddTypeEx("Add-ons", "Preview window", Addons.PreviewWindow.Exec);
}