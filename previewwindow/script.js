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
	if (!te.Data.AddonsData.PreviewWindow) {
		te.Data.AddonsData.PreviewWindow = api.CreateObject("Object");
		te.Data.AddonsData.PreviewWindow.r = 1;
	}
	Addons.PreviewWindow =
	{
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		Exec: function (Ctrl, pt)
		{
			GetFolderView(Ctrl, pt).Focus();
			if (Addons.PreviewWindow.dlg) {
				Addons.PreviewWindow.dlg.Window.close();
				delete Addons.PreviewWindow.dlg;
			} else {
				Addons.PreviewWindow.dlg = ShowDialog("../addons/previewwindow/preview.html", te.Data.AddonsData.PreviewWindow );
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

	AddEvent("LoadWindow", function (xml)
	{
		var items = xml ? xml.getElementsByTagName("PreviewWindow") : {};
		if (items.length) {
			te.Data.AddonsData.PreviewWindow.width = items[0].getAttribute("Width");
			te.Data.AddonsData.PreviewWindow.height = items[0].getAttribute("Height");
			te.Data.AddonsData.PreviewWindow.left = items[0].getAttribute("Left");
			te.Data.AddonsData.PreviewWindow.top = items[0].getAttribute("Top");
		}
	});

	AddEvent("SaveWindow", function (xml, all)
	{
		if (te.Data.AddonsData.PreviewWindow.width && te.Data.AddonsData.PreviewWindow.height) {
			var item = xml.createElement("PreviewWindow");
			item.setAttribute("Width", te.Data.AddonsData.PreviewWindow.width);
			item.setAttribute("Height", te.Data.AddonsData.PreviewWindow.height);
			item.setAttribute("Left", te.Data.AddonsData.PreviewWindow.left);
			item.setAttribute("Top", te.Data.AddonsData.PreviewWindow.top);
			xml.documentElement.appendChild(item);
		}
	});

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var s = item.getAttribute("Icon") || (h > 16 ? "bitmap:ieframe.dll,214,24,14" : "bitmap:ieframe.dll,216,16,14");
	s = ['<span class="button" id="WindowPreviewButton" onclick="Addons.PreviewWindow.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.PreviewWindow.strName, src:s }, h) ,'</span>'];
	SetAddon(Addon_Id, Default, s);

	//Menu
	if (item.getAttribute("MenuExec")) {
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
} else {
	EnableInner();
}