const Addon_Id = "pasteaslink";
const Default = "ToolBar2Left";
if (window.Addon == 1) {
	let item = await GetAddonElement(Addon_Id);
	Addons.PasteAsLink = {
		sName: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			if (FV) {
				const path = await FV.FolderItem.Path;
				if (await Addons.PasteAsLink.IsNTFS(path)) {
					FV.Focus();
					const Items = await api.OleGetClipboard();
					if (Items) {
						const nCount = await Items.Count;
						if (!nCount) {
							return;
						}
						const wfd = api.Memory("WIN32_FIND_DATA");
						const db = {
							"1": "Symbolic link, absolute path",
							"2": "Symbolic link, absolute path without drive",
							"3": "Symbolic link, relative path",
							"4": "Junction"
						};
						for (let i = 0; i < nCount && (db["2"] || db["4"]); ++i) {
							let target = await Items.Item(i).Path;
							const bFS = await Addons.PasteAsLink.IsFileSystem(target, wfd);
							if (!bFS) {
								return;
							}
							if (db["2"] && !await api.PathIsSameRoot(target, path)) {
								delete db["2"];
								delete db["3"];
							}
							if (db["4"] && (!(await wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) || await api.PathIsNetworkPath(target))) {
								delete db["4"];
							}
						}
						const hMenu = await api.CreatePopupMenu();
						for (let i in db) {
							await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, i, await GetText(db[i]));
						}
						const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, await pt.x, await pt.y, ui_.hwnd, null, null);
						api.DestroyMenu(hMenu);
						for (let i = 0; i < nCount; ++i) {
							let target = await Items.Item(i).Path;
							if (await Addons.PasteAsLink.IsFileSystem(target, wfd)) {
								let dir, link;
								dir = (await wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) ? " /d" : "";
								link = BuildPath(path, GetFileName(target) || target.charAt(0));
								let n = 0, base = link;
								for (;;) {
									if (!await Addons.PasteAsLink.IsFileSystem(link, wfd)) {
										break;
									}
									if (dir) {
										link = base + " (" + (++n) + ")";
									} else {
										let ext = await fso.GetExtensionName(target);
										if (ext) {
											ext = "." + ext;
										}
										link = BuildPath(path, await fso.GetBaseName(target) + " (" + (++n) + ")" + ext);
									}
								}
								let cmd;
								switch (nVerb) {
									case 1:
										cmd = ["mklink" + dir, PathQuoteSpaces(link), PathQuoteSpaces(target)];
										break;
									case 2:
										const drv = await fso.GetDriveName(link);
										cmd = ["mklink" + dir, PathQuoteSpaces(link), PathQuoteSpaces(target.substr(drv.length))];
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
											cmd = ["mklink" + dir, PathQuoteSpaces(link), PathQuoteSpaces(arTarget.join("\\") || ".")];
										}
										break;
									case 4:
										if (dir) {
											cmd = ["mklink", "/j", PathQuoteSpaces(link), PathQuoteSpaces(target)];
										}
										break;
								}
								if (cmd) {
									await ShellExecute("%ComSpec% /c" + cmd.join(" "), WINVER >= 0x600 && nVerb != 4 ? "RunAs" : null, SW_HIDE);
									await api.Sleep(99);
									if (!await Addons.PasteAsLink.IsFileSystem(link, wfd)) {
										if (nVerb == 4 && WINVER >= 0x600) {
											await ShellExecute("%ComSpec% /c" + cmd.join(" "), "RunAs", SW_HIDE);
										}
										await api.Sleep(99);
										if (!await Addons.PasteAsLink.IsFileSystem(link, wfd)) {
											break;
										}
									}
								}
							}
						}
					}
				}
			}
			return S_OK;
		},

		IsNTFS: async function (path) {
			if (await api.PathIsNetworkPath(path)) {
				return false;
			}
			let d = {};
			const drv = await fso.GetDriveName(path);
			if (drv) {
				try {
					d = await fso.GetDrive(drv);
				} catch (e) { }
			}
			return /NTFS/i.test(await d.FileSystem);
		},

		IsFileSystem: async function (path, wfd) {
			const hFind = await api.FindFirstFile(path, wfd);
			if (hFind != INVALID_HANDLE_VALUE) {
				api.FindClose(hFind);
				return true;
			}
			if (await api.PathIsRoot(path)) {
				wfd.dwFileAttributes = FILE_ATTRIBUTE_DIRECTORY;
				return true;
			}
			return false;
		},

		State: async function () {
			const Items = await api.OleGetClipboard();
			const b = !(Items && await Items.Count);
			let o = document.getElementById("ImgPasteAsLink_$");
			if (o) {
				DisableImage(o, b || !await Addons.PasteAsLink.IsNTFS(await (await GetFolderView()).FolderItem.Path));
			} else {
				const cTC = await te.Ctrls(CTRL_TC, false, window.chrome);
				for (let i = cTC.length; i-- > 0;) {
					o = document.getElementById("ImgPasteAsLink_" + await cTC[i].Id);
					if (o) {
						DisableImage(o, b || !await Addons.PasteAsLink.IsNTFS(await cTC[i].Selected.FolderItem.Path));
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
		SetMenuExec("PasteAsLink", Addons.PasteAsLink.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
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
			onclick: "SyncExec(Addons.PasteAsLink.Exec, this, 9)",
			"class": "button"
		}, GetIconSizeEx(item))]);
	});

	AddEvent("Resize", Addons.PasteAsLink.State);
} else {
	EnableInner();
}
