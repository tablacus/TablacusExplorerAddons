const Addon_Id = "tablist";
const Default = "ToolBar2Left";
let item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "View");
	item.setAttribute("MenuPos", 1);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	Common.TabList = await api.CreateObject("Object");
	const db = JSON.parse(await ReadTextFile(BuildPath(ui_.DataFolder, "config\\tablist.json")) || "{}");
	Common.TabList.MainWindow = $;
	Common.TabList.width = db.width || 640;
	Common.TabList.height = db.height || 500;
	Common.TabList.left = db.left;
	Common.TabList.top = db.top;

	Addons.TabList = {
		sName: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			FV.Focus();
			const dlg = Addons.TabList.dlg;
			if (dlg) {
				dlg.Document.parentWindow.CloseWindow();
				delete Addons.TabList.dlg;
				return;
			}
			Addons.TabList.dlg = await ShowDialog("../addons/tablist/dialog.html", await Common.TabList);
		},

		Update: async function () {
			delete Addons.TabList.tid;
			try {
				const dlg = Addons.TabList.dlg;
				if (dlg) {
					dlg.Document.parentWindow.InvokeUI("Addons.TabList.Changed");
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

	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("TabList", Addons.TabList.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.TabList.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.TabList.Exec, "Async");
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.TabList.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: Addons.TabList.sName,
			src: item.getAttribute("Icon") || "bitmap:ieframe.dll,697,24,48"
		}, GetIconSizeEx(item)), '</span>']);
		delete item;
	});

	AddEvent("ChangeView1", Addons.TabList.ChangeView);

	AddTypeEx("Add-ons", "Tab list", Addons.TabList.Exec);
}
