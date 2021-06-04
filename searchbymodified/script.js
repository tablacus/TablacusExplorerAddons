const Addon_Id = "searchbymodified";
const Default = "ToolBar2Left";
if (window.Addon == 1) {
	let item = await GetAddonElement(Addon_Id);
	Addons.SearchByModified = {
		sName: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			const hDll = await api.GetModuleHandle("propsys.dll");
			if (FV && hDll) {
				FV.Focus();
				const ar = WINVER > 0x601 ? [106, 105, 500, 104, 501, 502, 503, 504] : [106, 105, 39265, 104, 39270, 39271, 39275, 39276];
				let str = [];
				for (let i = ar.length; i--;) {
					str[i] = api.LoadString(hDll, ar[i]);
				}
				str = await Promise.all(str);
				for (let i = ar.length; i--;) {
					const res = /^([^\|]+)\|/.exec(str[i]);
					if (res) {
						str[i] = res[1];
					}
				}
				const hMenu = await api.CreatePopupMenu();
				for (let i = 0; i < ar.length; ++i) {
					await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, i + 1, str[i]);
				}
				const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, await pt.x, await pt.y, ui_.hwnd, null, null);
				api.DestroyMenu(hMenu);
				if (nVerb) {
					const method = (await api.PSGetDisplayName("System.DateModified")).toLowerCase().replace(/\s/g, "");
					const arg = Addons.SearchByModified.Parse(await FV.FolderItem);
					const re = new RegExp("[:" + String.fromCharCode(0xff1a) + "]");
					let nNew = arg.length;
					for (let i = arg.length; --i >= 0;) {
						const a = arg[i].split(re);
						if (a.length > 1) {
							if (a[0].toLowerCase().replace(/\s/g, "") == method || String(await api.PSGetDisplayName(a[0])).toLowerCase().replace(/\s/g, "") == method) {
								nNew = i;
								break;
							}
						}
					}
					arg[nNew] = method + ":" + str[nVerb - 1].toLowerCase().replace(/\s/g, "");
					FV.Search(arg.join(" "));
				}
			}
			return S_OK;
		},

		Parse: async function (pid) {
			const res = /^search\-ms:.*?crumb=([^&]*)/.exec(await pid.Path);
			const groups = [];
			const ar = (res ? decodeURIComponent(res[1]) : "").replace(/(\([^\(\)]*\))/g, function (strMatch, ref1) {
				groups.push(ref1);
				return "(%" + (groups.length - 1) + ")";
			}).replace(/("[^")]")/g, function (strMatch, ref1) {
				groups.push(ref1);
				return "(%" + (groups.length - 1) + ")";
			}).split(/\s/);
			for (let i = ar.length; --i >= 0;) {
				ar[i] = ar[i].replace(/\(%(\d+)\)/, function (strMatch, ref1) {
					return groups[ref1];
				});
			}
			return ar;
		}
	};

	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("SearchByModified", Addons.SearchByModified.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.SearchByModified.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.SearchByModified.Exec, "Async");
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, [await GetImgTag({
			title: Addons.SearchByModified.sName,
			src: item.getAttribute("Icon") || "icon:general,17",
			onclick: "SyncExec(Addons.SearchByModified.Exec, this, 9)",
			"class": "button"
		}, GetIconSizeEx(item))]);
	});

	AddEvent("Resize", Addons.SearchByModified.State);
} else {
	EnableInner();
}
