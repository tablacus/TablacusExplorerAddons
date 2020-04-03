var Addon_Id = "sethome";
var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Tabs");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("Key", "");

	item.setAttribute("MouseOn", "List");
	item.setAttribute("Mouse", "");
}

if (window.Addon == 1) {
	Addons.SetHome = {
		nPos: api.LowPart(item.getAttribute("MenuPos")),
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,

		Exec: function (Ctrl, pt) {
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Data.Home = FV.FolderItem;
			}
			return S_OK;
		},

	};

	AddEvent("SaveFV", function (FV, item) {
		if (FV.Data.Home !== void 0) {
			item.setAttribute("Home", GetSavePath(FV.Data.Home));
		}
	});

	AddEvent("LoadFV", function (FV, item) {
		var Home = item.getAttribute("Home");;
		if (Home) {
			FV.Data.Home = api.ILCreateFromPath(Home);
		}
	});

	//Menu
	if (item.getAttribute("MenuExec")) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
			api.InsertMenu(hMenu, Addons.SetHome.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.SetHome.strName));
			ExtraMenuCommand[nPos] = Addons.SetHome.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.SetHome.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.SetHome.Exec, "Func");
	}

	AddTypeEx("Add-ons", "Set home", Addons.SetHome.Exec);
}
