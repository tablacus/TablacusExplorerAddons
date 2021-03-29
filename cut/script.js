const Addon_Id = "cut";
const Default = "ToolBar2Left";
if (window.Addon == 1) {
	let item = await GetAddonElement(Addon_Id);
	Addons.Cut = {
		sName: item.getAttribute("MenuName") || await api.LoadString(hShell32, 33560),

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
						await ContextMenu.InvokeCommand(0, ui_.hwnd, CommandID_CUT - 1, null, null, SW_SHOWNORMAL, 0, 0);
					}
					api.DestroyMenu(hMenu);
				}
			}
		},

		State: async function (Ctrl) {
			if (Ctrl && await Ctrl.Type <= CTRL_EB) {
				let o = document.getElementById("ImgCut_$");
				if (o) {
					if (await Ctrl.Id == await te.Ctrl(CTRL_FV).Id) {
						DisableImage(o, await Ctrl.ItemCount(SVGIO_SELECTION) == 0);
					}
				} else {
					const cTC = await te.Ctrls(CTRL_TC);
					for (let i = await cTC.Count; i-- > 0;) {
						o = document.getElementById("ImgCut_" + await cTC[i].Id);
						if (o) {
							DisableImage(o, await cTC[i].Selected.ItemCount(SVGIO_SELECTION) == 0);
						}
					}
				}
			}
		}
	};

	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("Cut", Addons.Cut.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Cut.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Cut.Exec, "Func");
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.Cut.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: Addons.Cut.sName,
			id: "ImgCut_$",
			src: item.getAttribute("Icon") || "icon:general,5"
		}, GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16)), '</span>']);
		delete item;
	});

	AddEvent("SelectionChanged", Addons.Cut.State);
} else {
	EnableInner();
}
