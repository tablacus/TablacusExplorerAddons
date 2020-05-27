var Addon_Id = "bgpreview";
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
	Addons.BGPreview =
	{
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),
		Extract: api.LowPart(item.getAttribute("IsExtract")) ? item.getAttribute("Extract") || "*" : "-",
		Size: api.LowPart(item.getAttribute("Size")) || 256,
		Visible: !api.LowPart(item.getAttribute("Hidden")),
		Items: {},

		Exec: function (Ctrl, pt) {
			Addons.BGPreview.Visible = !Addons.BGPreview.Visible;
			if (Addons.BGPreview.Visible) {
				Addons.BGPreview.Arrange();
			} else {
				Addons.BGPreview.Clear();
			}
		},

		Arrange: function (FV, Item) {
			if (!FV) {
				FV = te.Ctrl(CTRL_FV);
			}
			if (!Item && FV.ItemCount(SVGIO_SELECTION) == 1) {
				Item = FV.SelectedItems().Item(0);
			}
			var hwnd = FV.hwndList;
			if (Addons.BGPreview.Visible && hwnd) {
				if (!api.ILIsEqual(Item, Addons.BGPreview.Items[hwnd])) {
					var bClear = Addons.BGPreview.Items[hwnd] === null;
					Addons.BGPreview.Items[hwnd] = Item;
					Threads.GetImage({
						FV: FV,
						hwnd: hwnd,
						path: Item,
						cx: Addons.BGPreview.Size,
						f: true,
						Extract: Addons.BGPreview.Extract,
						bClear: bClear,

						onload: function (o) {
							if (o.path === Addons.BGPreview.Items[o.hwnd]) {
								Addons.BGPreview.Items[o.hwnd] = null;
								var lvbk = api.Memory("LVBKIMAGE");
								lvbk.hbm = o.out.GetHBITMAP(-2);
								lvbk.ulFlags = LVBKIF_TYPE_WATERMARK | LVBKIF_FLAG_ALPHABLEND;
								if (!api.SendMessage(o.hwnd, LVM_SETBKIMAGE, 0, lvbk)) {
									api.DeleteObject(lvbk.hbm);
								}
							}
						},
						onerror: function (o) {
							if (Addons.BGPreview.Items[o.hwnd]) {
								if (o.bClear) {
									var lvbk = api.Memory("LVBKIMAGE");
									lvbk.ulFlags = LVBKIF_TYPE_WATERMARK;
									api.SendMessage(o.hwnd, LVM_SETBKIMAGE, 0, lvbk);
								}
								if (!IsFolderEx(o.path) && api.PathMatchSpec(o.path.Path, o.Extract)) {
									var Items = api.CreateObject("FolderItems");
									Items.AddItem(o.path);
									te.OnBeforeGetData(o.FV, Items, 11);
									if (IsExists(o.path.Path)) {
										o.onerror = null;
										MainWindow.Threads.GetImage(o);
									}
								}
							}
						}
					});
				}
			}
		},

		Clear: function () {
			var lvbk = api.Memory("LVBKIMAGE");
			lvbk.ulFlags = LVBKIF_TYPE_WATERMARK;
			for (var hwnd in Addons.BGPreview.Items) {
				if (Addons.BGPreview.Items[hwnd] === null) {
					api.SendMessage(hwnd, LVM_SETBKIMAGE, 0, lvbk);
				}
				delete Addons.BGPreview.Items[hwnd];
			}
		}
	};

	AddEvent("StatusText", function (Ctrl, Text, iPart) {
		if (Ctrl.Path) {
			Addons.BGPreview.Arrange(null, Ctrl);
		} else if (Ctrl.Type <= CTRL_EB && Text) {
			if (Ctrl.ItemCount(SVGIO_SELECTION) == 1) {
				Addons.BGPreview.Arrange(Ctrl);
			}
		}
	});

	AddEventId("AddonDisabledEx", "bgpreview", Addons.BGPreview.Clear);

	AddEvent("Finalize", Addons.BGPreview.Clear);

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var s = item.getAttribute("Icon") || (h > 16 ? "bitmap:ieframe.dll,214,24,14" : "bitmap:ieframe.dll,216,16,14");
	s = ['<span class="button" id="BGPreviewButton" onclick="Addons.BGPreview.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.BGPreview.strName, src: s }, h), '</span>'];
	SetAddon(Addon_Id, Default, s);

	//Menu
	if (item.getAttribute("MenuExec")) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
			api.InsertMenu(hMenu, Addons.BGPreview.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.BGPreview.strName);
			ExtraMenuCommand[nPos] = Addons.BGPreview.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.BGPreview.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.BGPreview.Exec, "Func");
	}

	AddTypeEx("Add-ons", "Preview in background", Addons.BGPreview.Exec);
} else {
	EnableInner();
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "General", ado.ReadText(adReadAll));
		ado.Close();
	}
}
