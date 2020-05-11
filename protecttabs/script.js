var Addon_Id = "protecttabs";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Tabs");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.ProtectTabs = {
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		Exec: function (Ctrl, pt) {
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Data.Protect = !FV.Data.Protect;
				RunEvent1("Lock", FV, FV.Index, FV.Data.Lock);
			}
		}
	};

	AddEvent("CanClose", function (FV) {
		if (FV.Data.Protect) {
			return S_FALSE;
		}
	});

	AddEvent("SaveFV", function (FV, item) {
		if (FV.Data.Protect) {
			item.setAttribute("Protect", true);
		}
	});

	AddEvent("LoadFV", function (FV, item) {
		FV.Data.Protect = item.getAttribute("Protect");
	});

	//Menu
	if (item.getAttribute("MenuExec")) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, SelItem, ContextMenu, Name, pt) {
			var FV = GetFolderView(Ctrl, pt);
			api.InsertMenu(hMenu, Addons.ProtectTabs.nPos, MF_BYPOSITION | MF_STRING | (FV && FV.Data.Protect ? MF_CHECKED : 0), ++nPos, GetText(Addons.ProtectTabs.strName));
			ExtraMenuCommand[nPos] = Addons.ProtectTabs.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.ProtectTabs.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.ProtectTabs.Exec, "Func");
	}
	AddTypeEx("Add-ons", "Sort tabs", Addons.ProtectTabs.Exec);
} else {
	SetTabContents(0, "General", '<label><input type="checkbox" id="Auto">Auto</label>');
}
