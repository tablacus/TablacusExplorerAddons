const Addon_Id = "recentlyusedtabs";

if (window.Addon == 1) {
	const item = await GetAddonElement(Addon_Id);

	Addons.RecentlyUsedTabs = {
		Exec: function (Ctrl, pt) {
			setTimeout(async function () {
				const hMenu = await api.CreatePopupMenu();
				const ar = [];
				const TC = await te.Ctrl(CTRL_TC);
				const nCount = await TC.Count;
				for (let i = nCount; i--;) {
					ar.push({ FV: TC[i], nRecent: await TC[i].Data.nRecent });
				}
				ar.sort(function (a, b) {
					return b.nRecent - a.nRecent;
				});
				for (let i = ar.length - 1; i--;) {
					const FV = ar[i].FV;
					const mii = await api.Memory("MENUITEMINFO");
					mii.cbSize = await mii.Size;
					mii.fMask = MIIM_ID | MIIM_STRING | MIIM_BITMAP | MIIM_FTYPE;
					mii.wId = i + 1;
					mii.dwTypeData = await FV.FolderItem.Path;
					AddMenuIconFolderItem(mii, await FV.FolderItem);
					await api.InsertMenuItem(hMenu, MAXINT, false, mii);
				}
				const FV = await GetFolderView(Ctrl, pt);
				const o = document.getElementById("Panel_" + await FV.Parent.Id);
				pt = o ? GetPos(o, true) : { x: await pt.x, y: await pt.y };
				AddEvent("EnterMenuLoop", await CreateJScript('wsh.SendKeys("{DOWN}");'));
				const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, ui_.hwnd,
					null, null);
				if (nVerb) {
					TC.SelectedIndex = await ar[nVerb - 1].FV.Index;
				}
			}, 99);
			return S_OK;
		}

	};

	AddEvent("SelectionChanged", async function (Ctrl, uChange) {
		if (await Ctrl.Type == CTRL_TC) {
			let FV;
			for (let i = await Ctrl.Count; i-- > 0;) {
				FV = await Ctrl[i];
				if (FV && await FV.Data) {
					FV.Data.nRecent = (await FV.Data.nRecent || 0) + 1;
				}
			}
			FV = await Ctrl.Selected;
			if (FV && await FV.Data) {
				FV.Data.nRecent = 0;
			}
		}
	});

	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.RecentlyUsedTabs.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.RecentlyUsedTabs.Exec, "Async");
	}
	//Type
	AddTypeEx("Add-ons", "Recently used tabs", Addons.RecentlyUsedTabs.Exec);
}
