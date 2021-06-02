const Addon_Id = "searchbysize";
const Default = "ToolBar2Left";
if (window.Addon == 1) {
	let item = await GetAddonElement(Addon_Id);
	Addons.SearchBySize = {
		sName: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			const hDll = await api.GetModuleHandle("propsys.dll");
			if (FV && hDll) {
				FV.Focus();
				let str = [];
				for (let i = 7; i--;) {
					str[i] = api.LoadString(hDll, 38569 + i);
				}
				str = await Promise.all(str);
				const hMenu = await api.CreatePopupMenu();
				for (let i = 0; i < ar.length; ++i) {
					await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, i + 1, str[i]);
				}
				const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, await pt.x, await pt.y, ui_.hwnd, null, null);
				api.DestroyMenu(hMenu);
				if (nVerb) {
					const method = (await api.PSGetDisplayName("Size")).toLowerCase().replace(/\s/g, "");
					const arg = Addons.SearchBySize.Parse(await FV.FolderItem);
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
					arg[nNew] = method + ":" + (await api.LoadString(hDll, 39200 + nVerb)).toLowerCase().replace(/\s/g, "");
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
		SetMenuExec("Paste", Addons.SearchBySize.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.SearchBySize.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.SearchBySize.Exec, "Async");
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, [await GetImgTag({
			title: Addons.SearchBySize.sName,
			src: item.getAttribute("Icon") || "icon:general,17",
			onclick: "SyncExec(Addons.SearchBySize.Exec, this, 9)",
			"class": "button"
		}, GetIconSizeEx(item))]);
	});

	AddEvent("Resize", Addons.SearchBySize.State);
} else {
	EnableInner();
}
