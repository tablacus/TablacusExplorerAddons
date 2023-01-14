const Addon_Id = "innersyncselect";
const item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Edit");
	item.setAttribute("MenuPos", -1);
	item.setAttribute("Position", "0");
	item.setAttribute("KeyOn", "List");
	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	Common.InnerSyncSelect = await api.CreateObject("Object");
	Common.InnerSyncSelect.MainWindow = $;

	Addons.InnerSyncSelect = {
		Align: GetNum(item.getAttribute("Align")) ? "Right" : "Left",
		Exec: async function (Ctrl, pt) {
			const dlg = Addons.InnerSyncSelect.dlg;
			if (dlg) {
				dlg.Document.parentWindow.CloseWindow();
				delete Addons.InnerSyncSelect.dlg;
				return;
			}
			Addons.InnerSyncSelect.dlg = await ShowDialog("../addons/innersyncselect/dialog.html", await Common.InnerSyncSelect);
		},

		Update: async function () {
			delete Addons.InnerSyncSelect.tid;
			try {
				const dlg = Addons.InnerSyncSelect.dlg;
				if (dlg) {
					dlg.Document.parentWindow.InvokeUI("Addons.InnerSyncSelect.Changed");
					return true;
				}
			} catch (e) {
				delete Addons.InnerSyncSelect.dlg;
			}
		},

		ChangeView: function () {
			if (Addons.InnerSyncSelect.tid) {
				clearTimeout(Addons.InnerSyncSelect.tid);
			}
			Addons.InnerSyncSelect.tid = setTimeout(Addons.InnerSyncSelect.Update, 500);
		},

		Close: function () {
			delete Addons.InnerSyncSelect.dlg;
		}
	}

	AddEvent("ChangeView1", Addons.InnerSyncSelect.ChangeView);

	const strName = item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name;
	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("InnerSyncSelect", strName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.InnerSyncSelect.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.InnerSyncSelect.Exec, "Async");
	}

	AddEvent("Layout", async function () {
//		Addons.InnerSyncSelect.src = ['<span class="button" onclick="return Addons.InnerSyncSelect.Click($)" oncontextmenu="Addons.InnerSyncSelect.Popup(this, $); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
//			id: "ImgInnerSyncSelect_$",
//			title: strName,
//			src: item.getAttribute("Icon") || GetWinIcon(0xa00, "font:Segoe MDL2 Assets,0xe7fd", 0, "icon:general,24")
//		}, GetIconSize(item.getAttribute("IconSize"), ui_.InnerIconSize || 16)), '</span>'].join("");

		Addons.InnerSyncSelect.src = await GetImgTag({
			title: strName,
			src: item.getAttribute("Icon") || GetWinIcon(0xa00, "font:Segoe MDL2 Assets,0xe7fd", 0, "icon:general,24")
		}, GetIconSize(item.getAttribute("IconSize"), ui_.InnerIconSize || 16));
		Addons.InnerSyncSelect.Position = (item.getAttribute("Position")=="Right") ? "Inner1Right_" : "Inner1Left_";
	});


//	AddEvent("PanelCreated", function (Ctrl, Id) {
//		SetAddon(null, "Inner1Left_" + Id, Addons.InnerSyncSelect.src.replace(/\$/g, Id));
//	});

	AddEvent("PanelCreated", function (Ctrl, Id) {
		SetAddon(null, Addons.InnerSyncSelect.Position + Id, ['<span class="button" onclick="return Addons.InnerSyncSelect.Exec(this)" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', Addons.InnerSyncSelect.src, '</span>']);
	});

	AddTypeEx("Add-ons", "Inner sync select", Addons.InnerSyncSelect.Exec);

	const db = JSON.parse(await ReadTextFile(BuildPath(ui_.DataFolder, "config\\innersyncselect.json")) || "{}");
	Common.InnerSyncSelect.width = db.width || 640;
	Common.InnerSyncSelect.height = db.height || 500;
	Common.InnerSyncSelect.left = db.left;
	Common.InnerSyncSelect.top = db.top;
	Common.InnerSyncSelect.NoExt = db.NoExt;

	delete item;
} else {
	SetTabContents(0, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}