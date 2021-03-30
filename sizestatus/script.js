const Addon_Id = "sizestatus";
const Default = "BottomBar3Right";
const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.SizeStatus = {
		SessionId: 0,
		Folder: item.getAttribute("Folder"),
		FileSize: item.getAttribute("FileSize"),
		strFreeSpace: await api.PSGetDisplayName("{9B174B35-40FF-11D2-A27E-00C04FC30871} 2") + " ",

		Exec: async function (Ctrl) {
			let s = "";
			let bYet = false;
			let nSize = 0;
			const FV = await GetFolderView(Ctrl);
			if (!FV) {
				return;
			}
			const pid = await FV.FolderItem;
			if (!pid) {
				return;
			}
			const nCount = await FV.ItemCount(SVGIO_SELECTION);
			const SessionId = await api.HashData(nCount ? await ExtractMacro(te, '%Selected%') : BuildPath(await pid.Path, await FV.FilterView), 8);
			if (SessionId == Addons.SizeStatus.SessionId) {
				return;
			}
			if (nCount || Addons.SizeStatus.FileSize) {
				const Selected = nCount ? await FV.SelectedItems() : await FV.Items();
				const TFS = await FV.TotalFileSize;
				if (TFS) {
					for (let i = await Selected.Count; i-- > 0;) {
						const Item = await Selected.Item(i);
						if (await IsFolderEx(Item)) {
							if (Addons.SizeStatus.Folder) {
								const n = await TFS[await api.GetDisplayNameOf(Item, SHGDN_FORPARSING | SHGDN_ORIGINAL)];
								if (n == null) {
									FV.Notify(0, Item, null, 1);
									bYet = true;
								} else if (n === "") {
									bYet = true;
								} else {
									nSize += n;
								}
							} else {
								bYet = true;
								Addons.SizeStatus.SessionId = SessionId;
							}
							continue;
						}
						nSize += await Item.ExtendedProperty("Size");
					}
				}
				if (!bYet) {
					Addons.SizeStatus.SessionId = SessionId;
				}
			} else {
				bYet = true;
				Addons.SizeStatus.SessionId = SessionId;
			}
			if (bYet && (Addons.SizeStatus.Folder || !nSize)) {
				s = " ";
				if (!await FV.FolderItem.Unavailable) {
					const oDrive = await api.GetDiskFreeSpaceEx(await pid.Path);
					if (oDrive) {
						s = Addons.SizeStatus.strFreeSpace + await api.StrFormatByteSize(await oDrive.FreeBytesOfAvailable);
					}
				}
			}
			document.getElementById("size_statusbar").innerHTML = "&nbsp;" + (s || await api.StrFormatByteSize(nSize));
		}
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, '<span id="size_statusbar">&nbsp;</span>');
	});

	AddEvent("StatusText", Addons.SizeStatus.Exec);
} else {
	SetTabContents(0, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
