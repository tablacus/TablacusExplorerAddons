
const Addon_Id = "copy";
const Default = "ToolBar2Left";
if (window.Addon == 1) {
	const item = await GetAddonElement(Addon_Id);

	Addons.Copy = {
		sName: item.getAttribute("MenuName") || await api.LoadString(hShell32, 33561),

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
				const Items = await FV.SelectedItems();
				if (await Items.Count) {
					const hMenu = await api.CreatePopupMenu();
					const ContextMenu = await api.ContextMenu(Items, FV);
					if (ContextMenu) {
						await ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_DEFAULTONLY);
						await ContextMenu.InvokeCommand(0, ui_.hwnd, CommandID_COPY - 1, null, null, SW_SHOWNORMAL, 0, 0);
					}
					api.DestroyMenu(hMenu);
				}
			}
		},

		State: async function (Ctrl) {
			if (Ctrl) {
				const nType =await Ctrl.Type;
				if (nType == CTRL_SB || nType == CTRL_EB) {
					let o = document.getElementById("ImgCopy_$");
					if (o) {
						if (await Ctrl.Id == await te.Ctrl(CTRL_FV).Id) {
							DisableImage(o, await Ctrl.ItemCount(SVGIO_SELECTION) == 0);
						}
					} else {
						const cTC = await te.Ctrls(CTRL_TC, false, window.chrome);
						for (let i = cTC.length; i-- > 0;) {
							o = document.getElementById("ImgCopy_" + await cTC[i].Id);
							if (o) {
								DisableImage(o, await cTC[i].Selected.ItemCount(SVGIO_SELECTION) == 0);
							}
						}
					}
				}
			}
		}
	};

	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("Copy", Addons.Copy.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Copy.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Copy.Exec, "Async");
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.Copy.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: Addons.Copy.sName,
			id: "ImgCopy_$",
			src: item.getAttribute("Icon") || "icon:general,6"
		}, GetIconSizeEx(item)), '</span>']);
	});

	AddEvent("SelectionChanged", Addons.Copy.State);
} else {
	EnableInner();
}
