const Addon_Id = "paste";
const Default = "ToolBar2Left";
if (window.Addon == 1) {
	const item = await GetAddonElement(Addon_Id);
	Addons.Paste = {
		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderViewEx(Ctrl, pt);
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
				const cTC = await te.Ctrls(CTRL_TC);
				for (let i = await cTC.Count; i-- > 0;) {
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

	AddEvent("Resize", Addons.Paste.State);

	//Menu
	const strName = item.getAttribute("MenuName") || await api.LoadString(hShell32, 33562);
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("Paste", strName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Paste.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Paste.Exec, "Async");
	}
	const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	const src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,7" : "bitmap:ieframe.dll,214,24,7");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.Paste.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: strName, id: "ImgPaste_$", src: src }, h), '</span>']);
} else {
	EnableInner();
}
