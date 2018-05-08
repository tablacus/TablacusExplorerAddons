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
			if (Addons.PreviewWindow.dlg) {
				Addons.PreviewWindow.dlg.Window.close();
				delete Addons.PreviewWindow.dlg;
			} else {
				Addons.PreviewWindow.dlg = ShowDialog("../addons/previewwindow/preview.html", {MainWindow: window, width: Addons.PreviewWindow.Width || 800, height: Addons.PreviewWindow.Height || 600 });
			}
		},

		Arrange: function (Ctrl)
		{
			if (!Ctrl) {
				Ctrl = te.Ctrl(CTRL_FV);
			}
			if (this.dlg) {
				delete this.Item;
				delete this.File;
				if (Ctrl.ItemCount(SVGIO_SELECTION) == 1) {
					this.Item = Ctrl.SelectedItems().Item(0);
					this.File = api.GetDisplayNameOf(this.Item, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
				}
				this.dlg.Window.Addons.PreviewWindow.Change(te.hwnd);
				if (this.Focus) {
					delete this.Focus;
					this.dlg.focus();
				}
			}
		}
	};

	AddEvent("StatusText", function (Ctrl, Text, iPart)
	{
		if (Ctrl.Type <= CTRL_EB && Text) {
			Addons.PreviewWindow.Arrange(Ctrl);
		}
	});

	AddEvent("Finalize", function ()
	{
		if (Addons.PreviewWindow.dlg) {
			Addons.PreviewWindow.dlg.Window.close();
		}
	});

	AddEvent("LoadWindow", function (xml)
	{
		var items = xml ? xml.getElementsByTagName("PreviewWindow") : {};
		if (items.length) {
			Addons.PreviewWindow.Width = items[0].getAttribute("Width");
			Addons.PreviewWindow.Height = items[0].getAttribute("Height");
		}
	});

	AddEvent("SaveWindow", function (xml, all)
	{
		if (Addons.PreviewWindow.Width && Addons.PreviewWindow.Height) {
			var item = xml.createElement("PreviewWindow");
			item.setAttribute("Width", Addons.PreviewWindow.Width);
			item.setAttribute("Height", Addons.PreviewWindow.Height);
			xml.documentElement.appendChild(item);
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