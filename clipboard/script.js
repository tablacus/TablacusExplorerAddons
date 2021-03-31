const Addon_Id = "clipboard";
const Default = "ToolBar2Left";
if (window.Addon == 1) {
	Addons.Clipboard = {
		Exec: async function (o) {
			const Items = await api.OleGetClipboard();
			const hMenu = await te.MainMenu(FCIDM_MENU_EDIT);
			const FV = await GetFolderView();
			if (FV) {
				const Selected = await FV.SelectedItems();
				for (let i = await api.GetMenuItemCount(hMenu); --i >= 0;) {
					const wID = await api.GetMenuItemID(hMenu, i) & 0xfff;
					if (wID == CommandID_CUT - 1 || wID == CommandID_COPY - 1) {
						if (!Selected || await Selected.Count == 0) {
							api.EnableMenuItem(hMenu, i, MF_BYPOSITION | MF_GRAYED);
						}
					} else if (wID == CommandID_PASTE - 1) {
						if (!Items || await Items.Count == 0) {
							api.EnableMenuItem(hMenu, i, MF_BYPOSITION | MF_GRAYED);
						}
					} else {
						api.DeleteMenu(hMenu, i, MF_BYPOSITION);
					}
				}
			}
			if (Items) {
				const nCount = await Items.Count;
				if (nCount) {
					let s = "";
					const dwEffect = await Items.dwEffect;
					if (dwEffect & DROPEFFECT_COPY) {
						s += await api.LoadString(hShell32, 33561) + " ";
					}
					if (dwEffect & DROPEFFECT_MOVE) {
						s += await api.LoadString(hShell32, 33560) + " ";
					}
					await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
					await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING | MF_DISABLED, 0, s);
					await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
					const mii = await api.Memory("MENUITEMINFO");
					mii.cbSize = await mii.Size;
					mii.fMask = MIIM_ID | MIIM_STRING | MIIM_BITMAP;
					for (let i = 0; i < nCount; ++i) {
						const FolderItem = await Items.Item(i);
						mii.wID = 0;
						mii.dwTypeData = await FolderItem.Path;
						await AddMenuIconFolderItem(mii, FolderItem);
						await api.InsertMenuItem(hMenu, MAXINT, false, mii);
					}
				}
			}
			const pt = GetPos(o, 9);
			const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, ui_.hwnd, null, null);
			api.DestroyMenu(hMenu);
			if (await FV && nVerb) {
				api.SendMessage(await FV.hwndView, WM_COMMAND, nVerb, 0);
			}
		},

		Popup: async function (ev) {
			const Items = await api.OleGetClipboard();
			if (Items && await Items.Count) {
				const hMenu = await api.CreatePopupMenu();
				const ContextMenu = await api.ContextMenu(Items);
				if (ContextMenu) {
					await ContextMenu.QueryContextMenu(hMenu, 0, 0x1001, 0x7FFF, CMF_NORMAL);
				}
				const x = ev.screenX * ui_.Zoom;
				const y = ev.screenY * ui_.Zoom;
				var nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, x, y, ui_.hwnd, null, ContextMenu);
				if (nVerb >= 0x1001) {
					ContextMenu.InvokeCommand(0, ui_.hwnd, nVerb - 0x1001, null, null, SW_SHOWNORMAL, 0, 0);
				}
			}
		},

		Drag: async function () {
			const Items = await api.OleGetClipboard();
			if (Items && await Items.Count) {
				api.SHDoDragDrop(null, Items, te, DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK, await Items.pdwEffect);
			}
			MouseOut();
		},

		SetRect: async function () {
			Common.Clipboard.rc = await GetRect(document.getElementById('Clipboard'));
		}
	};

	AddEvent("Layout", async function () {
		const item = await GetAddonElement(Addon_Id);
		const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
		SetAddon(Addon_Id, Default, ['<span id="Clipboard" class="button" onclick="Addons.Clipboard.Exec(this)" oncontextmenu="Addons.Clipboard.Popup(event); return false;" ondrag="Addons.Clipboard.Drag(); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()" draggable="true">', await GetImgTag({
			title: await GetText("Clipboard"),
			src: item.getAttribute("Icon") || (WINVER >= 0xa00 ? "font:Segoe MDL2 Assets,0xf0e3" : "bitmap:ieframe.dll,697,24,15")
		}, h), '</span>']);
	});

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
}
