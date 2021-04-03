const Addon_Id = "delete";
const Default = "ToolBar2Left";
let item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Delete = {
		sName: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
				const Items = await FV.SelectedItems();
				if (Items.Count) {
					const hMenu = await api.CreatePopupMenu();
					const ContextMenu = await api.ContextMenu(Items, FV);
					if (ContextMenu) {
						await ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_DEFAULTONLY);
						await ContextMenu.InvokeCommand(0, ui_.hwnd, CommandID_DELETE - 1, null, null, SW_SHOWNORMAL, 0, 0);
					}
					api.DestroyMenu(hMenu);
				}
			}
			return S_OK;
		},

		State: async function (Ctrl) {
			let o = document.getElementById("ImgDelete_$");
			if (o) {
				const FV = await GetFolderView(Ctrl);
				if (FV) {
					if (await FV.Id == await te.Ctrl(CTRL_FV).Id) {
						DisableImage(o, await FV.ItemCount(SVGIO_SELECTION) == 0);
					}
				}
			} else {
				const cTC = await te.Ctrls(CTRL_TC, false, window.chrome);
				for (let i = cTC.length; --i >= 0;) {
					o = document.getElementById("ImgDelete_" + await cTC[i].Id);
					if (o) {
						DisableImage(o, await cTC[i].Selected.ItemCount(SVGIO_SELECTION) == 0);
					}
				}
			}
		}
	};

	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("Delete", Addons.Delete.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Delete.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Delete.Exec, "Func");
	}

	if (item.getAttribute("Location") != "None") {
		AddEvent("Layout", async function () {
			await SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.Delete.Exec(this);" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
				title: Addons.Delete.sName,
				id: "ImgDelete_$",
				src: item.getAttribute("Icon") || "icon:general,10"
			}, GetIconSizeEx(item)), '</span>']);
			delete item;
		});

		AddEvent("SelectionChanged", Addons.Delete.State);

		AddEvent("StatusText", Addons.Delete.State);

		AddEvent("Resize", Addons.Delete.State);

		AddEvent("ChangeNotify", async function (Ctrl, pidls) {
			if (await pidls.lEvent & (SHCNE_DELETE | SHCNE_RMDIR | SHCNE_UPDATEDIR)) {
				setTimeout(Addons.Delete.State, 99);
			}
		});
	}
} else {
	EnableInner();
}
