const Addon_Id = "addonsupdater";

if (window.Addon == 1) {
	Addons.AddonsUpdater = {
		url: "https://tablacus.github.io/TablacusExplorerAddons/",

		Exec: async function (Ctrl, pt) {
			const arg = await api.CreateObject("Object");
			arg.pcRef = await api.CreateObject("Array");
			arg.pcRef[0] = 0;
			arg.Updated = await api.CreateObject("FolderItems");
			arg.addons = BuildPath(await te.Data.TempFolder, "addons"),
			arg.bReload = true;
			DeleteItem(await arg.addons);
			OpenHttpRequest(Addons.AddonsUpdater.url + "index.xml", "http", "Addons.AddonsUpdater.List", arg);
			return S_OK;
		},

		List: async function (xhr, url, arg) {
			const xml = await xhr.get_responseXML ? await xhr.get_responseXML() : xhr.responseXML;
			if (xml) {
				const items = await xml.getElementsByTagName("Item");
				const TEVer = await AboutTE(0);
				const bAll = GetNum(await arg.all);
				const nLen = await GetLength(items);
				for (let i = 0; i < nLen; i++) {
					const item = await items[i];
					const info = {};
					const Id = await item.getAttribute("Id");
					const installed = await GetAddonInfo(Id);
					if (installed && await installed.Version) {
						GetAddonInfo2(item, info, "General");
						if (await installed.Version < info.Version) {
							if (bAll || TEVer >= CalcVersion(info.MinVersion)) {
								await MainWindow.AddonDisabled(Id);
								if (await AddonBeforeRemove(Id) < 0) {
									return;
								}
								OpenHttpRequest(Addons.AddonsUpdater.url + Id + '/' + Id + '_' + ((info.Version).replace(/\./, "")) + '.zip', "http", "Addons.AddonsUpdater.Save", arg);
							}
						}
					}
				}
				if (GetNum(await arg.bReload)) {
					Addons.AddonsUpdater.Reload(arg);
				}
			}
		},

		Save: async function (xhr, url, arg) {
			debugger;
			const res = /([^\/]+)\/([^\/]+)$/.exec(url);
			if (res) {
				const Id = res[1];
				const file = res[2];
				const temp = await arg.addons;
				CreateFolder2(GetParentFolderName(temp));
				CreateFolder2(temp);
				const dest = BuildPath(temp, Id);
				const hr = await Extract(BuildPath(await te.Data.TempFolder, file), temp, xhr);
				if (hr) {
					MessageBox([(await api.LoadString(hShell32, 4228)).replace(/^\t/, "").replace("%d", await api.sprintf(99, "0x%08x", hr)), await GetText("Extract"), file].join("\n\n"), TITLE, MB_OK | MB_ICONSTOP);
					return;
				}
				const configxml = dest + "\\config.xml";
				for (let nDog = 300; !await $.fso.FileExists(configxml);) {
					if ($.wsh.Popup(await GetText("Please wait."), 1, TITLE, MB_ICONINFORMATION | MB_OKCANCEL) == IDCANCEL || nDog-- == 0) {
						return;
					}
				}
				arg.Updated.AddItem(dest);
			}
		},

		Reload: async function (arg) {
			if (await arg.pcRef && await arg.pcRef[0]) {
				setTimeout(Addons.AddonsUpdater.Reload, 500, arg);
				return;
			}
			if (await arg.Updated.Count) {
				await sha.NameSpace(BuildPath(ui_.Installed, "addons")).MoveHere(await arg.Updated, FOF_NOCONFIRMATION | FOF_NOCONFIRMMKDIR);
				te.Reload();
			}
		}
	};

	AddEvent("CheckUpdate", Addons.AddonsUpdater.Exec);

	AddEvent("CreateUpdater", async function (arg) {
		arg.all = true;
		arg.pcRef = await api.CreateObject("Array");
		arg.pcRef[0] = 0;
		arg.Updated = await api.CreateObject("FolderItems");
		arg.addons = BuildPath(await arg.temp, "addons");
		OpenHttpRequest("https://tablacus.github.io/TablacusExplorerAddons/index.xml", "http", "Addons.AddonsUpdater.List", arg);
	}, true);

	AddTypeEx("Add-ons", "Addons updater", Addons.AddonsUpdater.Exec);
}
