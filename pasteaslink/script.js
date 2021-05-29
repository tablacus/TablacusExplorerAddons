const Addon_Id = "pasteaslink";
const Default = "ToolBar2Left";
if (window.Addon == 1) {
	let item = await GetAddonElement(Addon_Id);
	Addons.PasteAsLink = {
		sName: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			if (FV && await Addons.PasteAsLink.IsNTFS(FV)) {
				FV.Focus();
				const Items = await api.OleGetClipboard();
				if (Items && await Items.Count && await IsFolderEx(await Items.Item(0))) {
					const target = await Items.Item(0).Path;
					const link = BuildPath(await FV.FolderItem.Path, GetFileName(target));
					const db = {
						"1": "Symbolic link, absolute path",
						"2": "Symbolic link, absolute path without drive",
						"3": "Symbolic link, relative path",
						"4": "Junction"
					};
					if (!await api.PathIsSameRoot(target, link)) {
						delete db["2"];
						delete db["3"];
					}
					const hMenu = await api.CreatePopupMenu();
					for (let i in db) {
						await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, i, await GetText(db[i]));
					}
					if (!pt) {
						pt = GetPos(Ctrl, 9)
					}
					const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, await pt.x, await pt.y, ui_.hwnd, null, null);
					api.DestroyMenu(hMenu);
					let cmd;
					switch (nVerb) {
						case 1:
							cmd = ["mklink", "/d", PathQuoteSpaces(link), PathQuoteSpaces(target)];
							break;
						case 2:
							const drv = await fso.GetDriveName(link);
							cmd = ["mklink", "/d", PathQuoteSpaces(link), PathQuoteSpaces(target.substr(drv.length))];
							break;
						case 3:
							const arLink = link.split("\\");
							const arTarget = target.split("\\");
							for (let i = arLink.length; --i >= 0;) {
								if (arLink[0] === arTarget[0]) {
									arLink.shift();
									arTarget.shift();
								} else {
									break;
								}
							}
							if (arLink.length) {
								for (let i = arLink.length; --i > 0;) {
									arTarget.unshift("..");
								}
								cmd = ["mklink", "/d", PathQuoteSpaces(link), PathQuoteSpaces(arTarget.join("\\"))];
							}
							break;
						case 4:
							cmd = ["mklink", "/j", PathQuoteSpaces(link), PathQuoteSpaces(target)];
							break;
					}
					if (cmd && cmd.length) {
						ShellExecute("%ComSpec% /c" + cmd.join(" "), WINVER >= 0x600 ? "RunAs" : null, SW_HIDE);
					}
				}
			}
			return S_OK;
		},

		IsNTFS: async function (FV) {
			let d = {};
			const drv = await fso.GetDriveName(await FV.FolderItem.Path);
			if (drv) {
				try {
					d = await fso.GetDrive(drv);
				} catch (e) { }
			}
			return /NTFS/i.test(await d.FileSystem) && await IsFolderEx(await FV.FolderItem);
		},

		State: async function () {
			const Items = await api.OleGetClipboard();
			const b = !(Items && await Items.Count && await IsFolderEx(await Items.Item(0)));
			let o = document.getElementById("ImgPasteAsLink_$");
			if (o) {
				DisableImage(o, b || !await Addons.PasteAsLink.IsNTFS(await GetFolderView()));
			} else {
				const cTC = await te.Ctrls(CTRL_TC, false, window.chrome);
				for (let i = cTC.length; i-- > 0;) {
					o = document.getElementById("ImgPasteAsLink_" + await cTC[i].Id);
					if (o) {
						DisableImage(o, b || !await Addons.PasteAsLink.IsNTFS(await cTC[i].Selected));
					}
				}
			}
		}
	};

	AddEvent("SystemMessage", function (Ctrl, hwnd, msg, wParam, lParam) {
		if (msg == WM_CLIPBOARDUPDATE) {
			Addons.PasteAsLink.State();
		}
	});

	AddEvent("ChangeView2", Addons.PasteAsLink.State);

	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("Paste", Addons.PasteAsLink.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.PasteAsLink.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.PasteAsLink.Exec, "Async");
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, [await GetImgTag({
			title: Addons.PasteAsLink.sName,
			id: "ImgPasteAsLink_$",
			src: item.getAttribute("Icon") || "icon:general,7",
			onclick: "Addons.PasteAsLink.Exec(this)",
			"class": "button"
		}, GetIconSizeEx(item))]);
	});

	AddEvent("Resize", Addons.PasteAsLink.State);
} else {
	EnableInner();
}
