var Addon_Id = "addonsupdater";

if (window.Addon == 1) {
	Addons.AddonsUpdater =
	{
		url: "https://tablacus.github.io/TablacusExplorerAddons/",

		Exec: function (Ctrl, pt)
		{
			var arg = {
				pcRef: [0],
				Updated: api.CreateObject("FolderItems"),
				addons: fso.BuildPath(wsh.ExpandEnvironmentStrings("%TEMP%"), "tablacus\\addons"),

				fn: function (arg)
				{
					while (arg.pcRef[0]) {
						api.Sleep(500);
						api.DoEvents();
					}
					if (arg.Updated.Count) {
						sha.NameSpace(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons")).MoveHere(arg.Updated, FOF_NOCONFIRMATION | FOF_NOCONFIRMMKDIR);
						te.Reload();
					}
				}
			};
			DeleteItem(arg.addons);
			OpenHttpRequest(Addons.AddonsUpdater.url + "index.xml", "http", Addons.AddonsUpdater.List, arg);
			return S_OK;
		},

		List: function (xhr, url, arg)
		{
			var xml = xhr.get_responseXML ? xhr.get_responseXML() : xhr.responseXML;
			if (xml) {
				var items = xml.getElementsByTagName("Item");
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					var info = [];
					var Id = item.getAttribute("Id");
					var installed = GetAddonInfo(Id);
					if (installed) {
						GetAddonInfo2(item, info, "General");
						if (installed.Version < info.Version) {
							if (arg.all || AboutTE(0) >= CalcVersion(info.MinVersion)) {
								MainWindow.AddonDisabled(Id);
								if (AddonBeforeRemove(Id) < 0) {
									return;
								}
								OpenHttpRequest(Addons.AddonsUpdater.url + Id + '/' + Id + '_' + (info.Version.replace(/\./, "")) + '.zip', "http", Addons.AddonsUpdater.Save, arg);
							}
						}
					}
				}
				if (arg.fn) {
					arg.fn(arg);
				}
			}
		},

		Save: function (xhr, url, arg)
		{
			var res = /([^\/]+)\/([^\/]+)$/.exec(url);
			if (res) {
				var Id = res[1];
				var file = res[2];
				var temp = arg.addons;
				CreateFolder2(fso.GetParentFolderName(temp));
				CreateFolder2(temp);
				var dest = fso.BuildPath(temp, Id);
				var hr = Extract(fso.BuildPath(wsh.ExpandEnvironmentStrings("%TEMP%"), "tablacus\\" + file), temp, xhr);
				if (hr) {
					MessageBox([api.LoadString(hShell32, 4228).replace(/^\t/, "").replace("%d", api.sprintf(99, "0x%08x", hr)), GetText("Extract"), file].join("\n\n"), TITLE, MB_OK | MB_ICONSTOP);
					return;
				}
				var configxml = dest + "\\config.xml";
				for (var nDog = 300; !fso.FileExists(configxml);) {
					if (wsh.Popup(GetText("Please wait."), 1, TITLE, MB_ICONINFORMATION | MB_OKCANCEL) == IDCANCEL || nDog-- == 0) {
						return;
					}
				}
				arg.Updated.AddItem(dest);
			}
		}
	};

	AddEvent("CheckUpdate", Addons.AddonsUpdater.Exec);

	AddEvent("CreateUpdater", function (arg)
	{
		arg.pcRef = [0];
		arg.Updated = api.CreateObject("FolderItems");
		arg.addons = fso.BuildPath(arg.temp, "addons");
		arg.all = true;
		OpenHttpRequest(Addons.AddonsUpdater.url + "index.xml", "http", Addons.AddonsUpdater.List, arg);
		while (arg.pcRef[0]) {
			api.Sleep(500);
			api.DoEvents();
		}
	}, true);

	AddTypeEx("Add-ons", "Addons updater", Addons.AddonsUpdater.Exec);
}
