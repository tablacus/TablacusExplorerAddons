const Addon_Id = "tablist";
const Default = "ToolBar2Left";
const item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Context");
	item.setAttribute("MenuPos", 1);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	Addons.TabList = {
		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			FV.Focus();
			const dlg = Addons.TabList.dlg;
			if (dlg) {
				dlg.Document.parentWindow.CloseWindow();
				delete Addons.TabList.dlg;
				return;
			}
			const opt = await api.CreateObject("Object");
			opt.MainWindow = $;
			opt.width = 640;
			opt.height = 480;
			Addons.TabList.dlg = await ShowDialog("../addons/tablist/dialog.html", opt);
		},

		Update: async function () {
			delete Addons.TabList.tid;
			try {
				const dlg = Addons.TabList.dlg;
				if (dlg) {
					dlg.Document.parentWindow.InvokeUI("TabListChanged");
					return true;
				}
			} catch (e) {
				delete Addons.TabList.dlg;
			}
		},

		ChangeView: function () {
			if (Addons.TabList.tid) {
				clearTimeout(Addons.TabList.tid);
			}
			Addons.TabList.tid = setTimeout(Addons.TabList.Update, 500);
		},

		Close: function () {
			delete Addons.TabList.dlg;
		}
	}

	AddEvent("ChangeView1", Addons.TabList.ChangeView);

	const strName = item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name;
	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("TabList", strName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.TabList.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.TabList.Exec, "Async");
	}
	AddTypeEx("Add-ons", "Tab list", Addons.TabList.Exec);

	const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	const s = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,699,16,48" : "bitmap:ieframe.dll,697,24,48");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.TabList.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: strName, src: s }, h), '</span>']);
}
