const Addon_Id = "sizestatus";
const Default = "BottomBar3Right";
const item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.SizeStatus = {
		SessionId: 0,
		Folder: item.getAttribute("Folder"),
		FileSize: item.getAttribute("FileSize"),
		FreeSpace: item.getAttribute("FreeSpace"),
		strFreeSpace: await api.PSGetDisplayName("{9B174B35-40FF-11D2-A27E-00C04FC30871} 2") + " ",
		SessionId: {},

		Exec: async function (Ctrl) {
			if (document.getElementById("size_statusbar_$")) {
				const FV = await GetFolderView(Ctrl);
				if (FV) {
					Addons.SizeStatus.Show(FV, "$");
				}
				return;
			}
			const cTC = await te.Ctrls(CTRL_TC, true, window.chrome);
			for (let i = cTC.length; --i >= 0;) {
				const Id = await cTC[i].Id;
				Addons.SizeStatus.Show(await cTC[i].Selected, Id);
			}
		},

		Show: async function (FV, Id) {
			const el = document.getElementById("size_statusbar_" + Id);
			if (!el) {
				return E_FAIL;
			}
			const nAll = await FV.ItemCount(SVGIO_ALLVIEW);
			if ("number" !== typeof nAll) {
				return;
			}
			const pid = await FV.FolderItem;
			if (!pid) {
				return;
			}
			let s = "";
			let bYet = false;
			let nSize = 0;
			const nCount = await FV.ItemCount(SVGIO_SELECTION);
			const SessionId = await api.HashData(nCount ? await ExtractMacro(te, '%Selected%') : BuildPath(await pid.Path, await FV.FilterView, nAll.toString()), 8);
			if (SessionId == Addons.SizeStatus.SessionId[Id]) {
				return;
			}
			let TFS;
			if (nCount || Addons.SizeStatus.FileSize) {
				if (nCount) {
					TFS =  await FV.TotalFileSize;
				}
				let Selected = (nCount || Addons.SizeStatus.FreeSpace) ? await FV.SelectedItems() : await FV.Items();
				if (window.chrome) {
					Selected = await api.CreateObject("SafeArray", Selected);
				}
				for (let i = Selected.length; i-- > 0;) {
					const Item = Selected[i];
					if (await IsFolderEx(Item)) {
						if (TFS) {
							if (Addons.SizeStatus.Folder) {
								const n = await TFS[await api.GetDisplayNameOf(Item, SHGDN_FORPARSING)];
								if (n == null) {
									FV.Notify(0, Item, null, 1);
									bYet = 1;
								} else if (n === "") {
									bYet = 2;
								} else {
									nSize += n;
								}
							} else {
								bYet = 3;
								Addons.SizeStatus.SessionId[Id] = SessionId;
							}
						}
						continue;
					}
					nSize += await Item.ExtendedProperty("Size");
				}
				if (!bYet) {
					Addons.SizeStatus.SessionId[Id] = SessionId;
				}
			} else {
				bYet = 4;
				Addons.SizeStatus.SessionId[Id] = SessionId;
			}
			if (Addons.SizeStatus.Folder || !nSize) {
				if (bYet || (!nSize && !TFS) || !nAll) {
					s = " ";
					if (Addons.SizeStatus.FreeSpace && !await pid.Unavailable) {
						const oDrive = await api.GetDiskFreeSpaceEx(await api.GetDisplayNameOf(pid, SHGDN_FORPARSING));
						if (oDrive) {
							s = Addons.SizeStatus.strFreeSpace + await api.StrFormatByteSize(await oDrive.FreeBytesOfAvailable);
						}
					}
				}
			}
			el.innerHTML = "&nbsp;" + (s || await api.StrFormatByteSize(nSize));
		}
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, '<span id="size_statusbar_$">&nbsp;</span>');
	});

	AddEvent("StatusText", Addons.SizeStatus.Exec);

	AddEvent("PanelCreated", function (Ctrl, Id) {
		delete Addons.SizeStatus.SessionId[Id];
	});
} else {
	EnableInner();
	SetTabContents(0, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
