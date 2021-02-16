const Addon_Id = "tabgroupsbutton";
const Default = "ToolBar2Left";

if (window.Addon == 1) {
	let item = await GetAddonElement(Addon_Id);

	Addons.TabgroupsButton = {
		Down: function (ev, el) {
			Addons.TabgroupsButton.buttons = ev.buttons != null ? ev.buttons : ev.button;
			setTimeout(async function () {
				MouseOver(el);
				Addons.TabgroupsButton.Exec(await GetFolderViewEx(el), await GetPosEx(el, 9));
			}, 99);
			return true;
		},

		Exec: async function (Ctrl, pt) {
			if (!Addons.Tabgroups) {
				return;
			}
			let hMenu = await api.CreatePopupMenu();
			let mii = api.Memory("MENUITEMINFO");
			mii.cbSize = await mii.Size;
			mii.fMask = MIIM_ID | MIIM_STRING | MIIM_STATE | MIIM_CHECKMARKS;
			const nLen = await GetLength(await te.Data.Tabgroups.Data);
			const nIndex = await te.Data.Tabgroups.Index - 1;
			let image;
			for (let i = 0; i < nLen; ++i) {
				mii.wId = i + 1;
				const data = await te.Data.Tabgroups.Data[i];
				mii.dwTypeData = await data.Name;
				let fState = i == nIndex ? MFS_DEFAULT : 0;
				if (await data.Lock) {
					fState |= MFS_CHECKED;
					if (!image) {
						image = await MakeImgData("bitmap:ieframe.dll,545,13,2", 0, false, 13);
						mii.hbmpChecked = await image.GetHBITMAP(WINVER >= 0x600 ? -2 : await GetSysColor(COLOR_MENU));
					}
				}
				mii.fState = fState;
				await api.InsertMenuItem(hMenu, MAXINT, false, mii);
			}
			const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, await pt.x, await pt.y, ui_.hwnd, null, null);
			if (image) {
				api.DeleteObject(await mii.hbmpItem);
			}
			if (nVerb) {
				if (Addons.TabgroupsButton.buttons == 2 || await MainWindow.g_menu_button == 2) {
					delete Addons.TabgroupsButton.buttons;
					const ev = { screenX: await pt.x / ui_.Zoom, screenY: await pt.y / ui_.Zoom }
					const o = document.getElementById("tabgroups" + nVerb);
					Addons.Tabgroups.Popup(ev, o);
				} else {
					Addons.Tabgroups.Change(nVerb);
				}
			}
			api.DestroyMenu(hMenu);
		}
	};

	//Menu
	const strName = item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name;
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("TabgroupsButton", strName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.TabgroupsButton.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.TabgroupsButton.Exec, "Async");
	}

	AddTypeEx("Add-ons", "Tab groups button", Addons.TabgroupsButton.Exec);

	let h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	let src = item.getAttribute("Icon") || "icon:shell32.dll,54";
	SetAddon(Addon_Id, Default, ['<span class="button" onmousedown="return Addons.TabgroupsButton.Down(event, this)" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: strName, src: src }, h), '</span>']);
} else {
	EnableInner();
}
