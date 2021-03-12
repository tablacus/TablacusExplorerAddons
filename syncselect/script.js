const Addon_Id = "syncselect";
const Default = "ToolBar2Left";
const item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Edit");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	Addons.SyncSelect = {
		Exec: async function (Ctrl, pt) {
			const dlg = Addons.SyncSelect.dlg;
			if (dlg) {
				dlg.Document.parentWindow.CloseWindow();
				delete Addons.SyncSelect.dlg;
				return;
			}
			const opt = await api.CreateObject("Object");
			opt.MainWindow = $;
			opt.width = 640;
			opt.height = 500;
			Addons.SyncSelect.dlg = await ShowDialog("../addons/syncselect/dialog.html", opt);
		},

		Update: async function () {
			delete Addons.SyncSelect.tid;
			try {
				const dlg = Addons.SyncSelect.dlg;
				if (dlg) {
					dlg.Document.parentWindow.InvokeUI("SyncSelectChanged");
					return true;
				}
			} catch (e) {
				delete Addons.SyncSelect.dlg;
			}
		},

		ChangeView: function () {
			if (Addons.SyncSelect.tid) {
				clearTimeout(Addons.SyncSelect.tid);
			}
			Addons.SyncSelect.tid = setTimeout(Addons.SyncSelect.Update, 500);
		},

		Close: function () {
			delete Addons.SyncSelect.dlg;
		}
	}

	AddEvent("ChangeView1", Addons.SyncSelect.ChangeView);

	const strName = item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name;
	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("SyncSelect", strName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.SyncSelect.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.SyncSelect.Exec, "Async");
	}
	AddTypeEx("Add-ons", "Sync select", Addons.SyncSelect.Exec);

	const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	const s = item.getAttribute("Icon") || "icon:shell32.dll,46";
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.SyncSelect.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: strName, src: s }, h), '</span>']);
}
