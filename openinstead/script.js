const Addon_Id = "openinstead";
const item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.OpenInstead = {
		RealFolders: item.getAttribute("RealFolders"),
		SpecialFolders: item.getAttribute("SpecialFolders"),
		TakeOver: item.getAttribute("TakeOver"),

		Worker: async function (Retry) {
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
								if (path && Addons.OpenInstead[/^.?:\\|^\\\\/.test(path) ? "RealFolders" : "SpecialFolders"]) {
									const pid = await api.ILCreateFromPath(url);
									if (!await RunEvent3("UseExplorer", pid)) {
										exp.Visible = false;
										let FV = await (await GetFolderView()).Navigate((await pid.ExtendedProperty("linktarget")) || url, SBSP_NEWBROWSER);
										if (Addons.OpenInstead.TakeOver) {
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
										Retry = false;
									}
								}
							} catch (e) { }
						}
					}
				}
			}
			if (Retry) {
				setTimeout(Addons.OpenInstead.Worker, 500);
			}
		}
	};

	AddEvent("WindowRegistered", function () {
		setTimeout(Addons.OpenInstead.Worker, 500, true);
	});
} else {
	SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
