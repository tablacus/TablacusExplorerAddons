var Addon_Id = "sorttabs";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Tabs");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.SortTabs = {
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),
		tid: {},

		Exec: function (Ctrl, pt) {
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				var TC = FV.Parent;
				if (Addons.SortTabs.tid[TC.id]) {
					clearTimeout(Addons.SortTabs.tid[TC.id]);
					delete Addons.SortTabs.tid[TC.id];
				}
				var ids = [];
				for (var i = 0; i < TC.Count; i++) {
					ids.push(TC[i].Id);
				}
				ids.sort(function (a, b) {
					return api.StrCmpLogical(te.Ctrl(CTRL_FV, a).FolderItem.Path, te.Ctrl(CTRL_FV, b).FolderItem.Path);
				});
				for (var i = 0; i < TC.Count; i++) {
					var j = te.Ctrl(CTRL_FV, ids[i]).Index;
					if (i != j) {
						TC.Move(j, i);
					}
				}
			}
		}
	};

	if (item.getAttribute("Auto")) {
		AddEvent("ChangeView", function (Ctrl) {
			var TC = Ctrl.Parent;
			if (Addons.SortTabs.tid[TC.id]) {
				clearTimeout(Addons.SortTabs.tid[TC.id]);
			}
			Addons.SortTabs.tid[TC.id] = setTimeout(function () {
				Addons.SortTabs.Exec(TC);
			}, 99);
		});
	}

	//Menu
	if (item.getAttribute("MenuExec")) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
			api.InsertMenu(hMenu, Addons.SortTabs.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.SortTabs.strName));
			ExtraMenuCommand[nPos] = Addons.SortTabs.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.SortTabs.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.SortTabs.Exec, "Func");
	}
	AddTypeEx("Add-ons", "Sort tabs", Addons.SortTabs.Exec);
} else {
	SetTabContents(0, "General", '<label><input type="checkbox" id="Auto">Auto</label>');
}
