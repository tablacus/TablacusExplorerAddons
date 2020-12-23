const Addon_Id = "dataurischeme";
const item = GetAddonElement(Addon_Id);

Sync.DataURIScheme = {
	strName: item.getAttribute("MenuName") || "Copy Data URI Scheme",

	Exec: function (Ctrl, pt) {
		const Selected = GetSelectedArray(Ctrl, pt, true).shift();
		if (Selected && Selected.Count && !Selected.Item(0).IsFolder) {
			const path = Selected.Item(0).Path;
			if (path) {
				let ct = "application/x-" + fso.GetExtensionName(path);
				try {
					ct = wsh.RegRead("HKCR\\." + fso.GetExtensionName(path) + "\\Content Type");
				} catch (e) { }
				try {
					const ado = api.CreateObject("ads");
					ado.Type = adTypeBinary;
					ado.Open();
					ado.LoadFromFile(Selected.Item(0).path);
					clipboardData.setData("text", "data:" + ct + ";base64," + api.base64_encode(ado.Read()).replace(/\s/g, ""));
					ado.Close();
				} catch (e) {
					wsh.Popup(e.description + "\n" + s, 0, TITLE, MB_ICONEXCLAMATION);
				}
			}
		}
	}
}

//Menu
if (item.getAttribute("MenuExec")) {
	Sync.DataURIScheme.nPos = GetNum(item.getAttribute("MenuPos"));
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item) {
		if (item && item.IsFileSystem && !item.IsFolder) {
			api.InsertMenu(hMenu, Sync.DataURIScheme.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Sync.DataURIScheme.strName);
			ExtraMenuCommand[nPos] = Sync.DataURIScheme.Exec;
		}
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.DataURIScheme.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.DataURIScheme.Exec, "Func");
}

AddTypeEx("Add-ons", "Copy Data URI Scheme", Sync.DataURIScheme.Exec);
