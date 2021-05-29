const Addon_Id = "paste";
const Default = "ToolBar2Left";
if (window.Addon == 1) {
	let item = await GetAddonElement(Addon_Id);
	Addons.Paste = {
		sName: item.getAttribute("MenuName") || await api.LoadString(hShell32, 33562),

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
				const Items = await FV.FolderItem;
				const ContextMenu = await api.ContextMenu(Items, FV);
				if (ContextMenu) {
					const hMenu = await api.CreatePopupMenu();
					await ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_DEFAULTONLY);
					await ContextMenu.InvokeCommand(0, ui_.hwnd, CommandID_PASTE - 1, null, null, SW_SHOWNORMAL, 0, 0);
					api.DestroyMenu(hMenu);
				}
			}
			return S_OK;
		},

		State: async function () {
			const Items = await api.OleGetClipboard();
			const b = !(Items && await Items.Count);
			let o = document.getElementById("ImgPaste_$");
			if (o) {
				DisableImage(o, b);
			} else {
				const cTC = await te.Ctrls(CTRL_TC, false, window.chrome);
				for (let i = cTC.length; i-- > 0;) {
					o = document.getElementById("ImgPaste_" + await cTC[i].Id);
					if (o) {
						DisableImage(o, b);
					}
				}
			}
		}
	};

	AddEvent("SystemMessage", function (Ctrl, hwnd, msg, wParam, lParam) {
		if (msg == WM_CLIPBOARDUPDATE) {
			Addons.Paste.State();
		}
	});

	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("Paste", Addons.Paste.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Paste.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Paste.Exec, "Async");
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, [await GetImgTag({
			title: Addons.Paste.sName,
			id: "ImgPaste_$",
			src: item.getAttribute("Icon") || "icon:general,7",
			onclick: "Addons.Paste.Exec(this)",
			"class": "button"
		}, GetIconSizeEx(item))]);
	});

	AddEvent("Resize", Addons.Paste.State);
} else {
	EnableInner();
}
