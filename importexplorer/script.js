const Addon_Id = "importexplorer";
const Default = "ToolBar2Left";
const item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("RealFolders", 1);
	item.setAttribute("SpecialFolders", 1);
	item.setAttribute("TakeOver", 1);
}
if (window.Addon == 1) {
	Addons.ImportExplorer = {
		sName: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,
		nPos: GetNum(item.getAttribute("MenuPos")),
		RealFolders: item.getAttribute("RealFolders"),
		SpecialFolders: item.getAttribute("SpecialFolders"),
		TakeOver: item.getAttribute("TakeOver"),

		Exec: async function () {
			const sw = await sha.Windows();
			for (let i = await sw.Count; i-- > 0;) {
				let exp = await sw.item(i);
				if (exp) {
					let r = await Promise.all([exp.Visible, exp.Busy, exp.Document]);
					if (r[0] && !r[1]) {
						let doc = await r[2];
						if (doc) {
							try {
								let path = await api.GetDisplayNameOf(doc, SHGDN_FORPARSING);
								let url = doc;
								if (!path && /\\explorer\.exe$/i.test(await exp.FullName)) {
									path = await api.PathCreateFromUrl(await exp.LocationURL);
									url = path;
								}
								if (path && Addons.ImportExplorer[/^.?:\\|^\\\\/.test(path) ? "RealFolders" : "SpecialFolders"]) {
									const pid = await api.ILCreateFromPath(url);
									if (!await RunEvent3("UseExplorer", pid)) {
										exp.Visible = false;
										let FV = await (await GetFolderView()).Navigate((await pid.ExtendedProperty("linktarget")) || url, SBSP_NEWBROWSER);
										if (Addons.ImportExplorer.TakeOver) {
											r = await Promise.all([doc.CurrentViewMode, doc.IconSize, doc.SortColumns, doc.GroupBy, doc.FocusedItem]);
											FV.CurrentViewMode = r[0];
											if (r[1]) {
												FV.IconSize = r[1];
											}
											if (r[2]) {
												FV.SortColumns = r[2];
											}
											if (r[3]) {
												FV.GroupBy = r[3];
											}
										}
										FV.SelectItem(r[4], SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_DESELECTOTHERS | SVSI_SELECTIONMARK | SVSI_SELECT);
										exp.Quit();
										RestoreFromTray();
										api.SetForegroundWindow(ui_.hwnd);
									}
								}
							} catch (e) { }
						}
					}
				}
			}
		}
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.ImportExplorer.Exec(this);" oncontextmenu="Addons.ImportExplorer.Exec(this); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,
			src: item.getAttribute("Icon") || "%SystemRoot%\\explorer.exe"
		}, GetIconSizeEx(item)), '</span>']);
	});
	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("ImportExplorer", Addons.ImportExplorer.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.ImportExplorer.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.ImportExplorer.Exec, "Async");
	}
	//Type
	AddTypeEx("Add-ons", "Import Explorer", Addons.ImportExplorer.Exec);
} else {
	EnableInner();
	SetTabContents(0, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
