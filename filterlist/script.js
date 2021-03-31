const Addon_Id = "filterlist";
const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.FilterList = {
		Menus: [],
		Name: GetNum(item.getAttribute("Name")),
		Filter: GetNum(item.getAttribute("Filter")),

		Exec: async function (Ctrl, pt, Id) {
			if (await api.GetKeyState(VK_SHIFT) < 0 && await api.GetKeyState(VK_CONTROL) < 0) {
				AddonOptions("filterlist");
				return S_OK;
			}
			let o;
			const FV = await GetFolderView(Ctrl, pt);
			if (!FV) {
				return S_OK;
			}
			let fuFlags = TPM_RIGHTBUTTON | TPM_RETURNCMD;
			if (Ctrl && !await Ctrl.Type) {
				o = Ctrl;
				pt = GetPos(o, 9);
				if (pt.x || pt.y) {
					fuFlags |= TPM_RIGHTALIGN;
					pt.x += o.offsetWidth;
				}
			}
			if (!await pt) {
				pt = await api.Memory("POINT");
				await api.GetCursorPos(pt);
			}
			if (o && isFinite(Id)) {
				Activate(o, Id);
			}
			const hMenu = await api.CreatePopupMenu();
			for (let i = Addons.FilterList.Menus.length; i--;) {
				const ar = Addons.FilterList.Menus[i].split("\t");
				if (Addons.FilterList.Name) {
					if (!Addons.FilterList.Filter && ar[0]) {
						ar.splice(1, 1);
					}
				} else if (Addons.FilterList.Filter && ar[1]) {
					ar.splice(0, 1);
				}
				api.InsertMenu(hMenu, 0, MF_BYPOSITION | MF_STRING, i + 1, ar.join("\t"));
			}
			const Verb = await api.TrackPopupMenuEx(hMenu, fuFlags, await pt.x, await pt.y, ui_.hwnd, null, null);
			api.DestroyMenu(hMenu);
			if (Verb) {
				let ar = Addons.FilterList.Menus[Verb - 1].split("\t");
				let s = ar[1];
				if (!/^\//.test(s)) {
					ar = s.split(/;/);
					for (let i in ar) {
						const res = /^([^\*\?]+)$/.exec(ar[i]);
						if (res) {
							ar[i] = "*" + res[1] + "*";
						}
					}
					s = ar.join(";");
				}
				FV.FilterView = s || null;
				FV.Refresh();
			}
			return S_OK;
		}
	};
	const data = (await ReadTextFile(BuildPath(await te.Data.DataFolder, "config", Addon_Id + ".tsv"))).replace(/\r?\n$/, "").split(/\r?\n/);
	for (let s; s = data.shift();) {
		Addons.FilterList.Menus.push(s);
	}
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
