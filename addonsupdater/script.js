const Addon_Id = "addonsupdater";

if (window.Addon == 1) {
	Addons.AddonsUpdater = {
		url: "https://tablacus.github.io/TablacusExplorerAddons/",

		Exec: async function (Ctrl, pt) {
			const arg = await api.CreateObject("Object");
			arg.tm = new Date().getTime() + 99999;
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
			const xml = window.chrome && await xhr.get_responseText ? new DOMParser().parseFromString(await xhr.get_responseText(), "application/xml") : xhr.responseXML;
			if (xml) {
				const items = xml.getElementsByTagName("Item");
				const TEVer = await AboutTE(0);
				const bAll = GetNum(await arg.all);
				for (let i = 0; i < items.length; i++) {
					const item = items[i];
					const info = {};
					const Id = item.getAttribute("Id");
					const installedVersion = await GetAddonInfo(Id).Version;
					if (installedVersion) {
						GetAddonInfo2(item, info, "General");
						if (installedVersion < info.Version) {
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
				setTimeout(async function () {
					if (GetNum(await arg.bReload)) {
						Addons.AddonsUpdater.Reload(arg);
					}
				}, 500);
			}
		},

		Save: async function (xhr, url, arg) {
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
				for (let nDog = 300; !await fso.FileExists(configxml);) {
					if (wsh.Popup(await GetText("Please wait."), 1, TITLE, MB_ICONINFORMATION | MB_OKCANCEL) == IDCANCEL || nDog-- == 0) {
						return;
					}
				}
				arg.Updated.AddItem(dest);
			}
		},

		Reload: async function (arg) {
			if (await arg.pcRef && await arg.pcRef[0] && new Date().getTime() < await arg.tm) {
				setTimeout(Addons.AddonsUpdater.Reload, 999, arg);
				return;
			}
			if (await arg.Updated.Count) {
				await sha.NameSpace(BuildPath(ui_.Installed, "addons")).MoveHere(await arg.Updated, FOF_NOCONFIRMATION | FOF_NOCONFIRMMKDIR);
				ReloadCustomize();
			}
		}
	};

	AddEvent("CheckUpdate", Addons.AddonsUpdater.Exec);

	AddEvent("CreateUpdater", async function (arg) {
		arg.all = true;
		arg.tm = new Date().getTime() + 99999;
		arg.pcRef = await api.CreateObject("Array");
		arg.pcRef[0] = 0;
		arg.Updated = await api.CreateObject("FolderItems");
		arg.addons = BuildPath(await arg.temp, "addons");
		OpenHttpRequest("https://tablacus.github.io/TablacusExplorerAddons/index.xml", "http", "Addons.AddonsUpdater.List", arg);
	}, true);

	AddTypeEx("Add-ons", "Addons updater", Addons.AddonsUpdater.Exec);
}
