const Addon_Id = "synchronize";
const item = GetAddonElement(Addon_Id);

Sync.Synchronize = {
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),
	Disabled: !GetNum(item.getAttribute("Start")),

	Exec: function (Ctrl, pt) {
		Sync.Synchronize.Disabled = !Sync.Synchronize.Disabled;
		InvokeUI("Addons.Synchronize.State", Sync.Synchronize.Disabled);
	},

	Run: function (Ctrl, Prev, fn) {
		const parent = GetFileName(Prev.Path);
		const TC = Ctrl.Parent;
		const Id = TC.Id;
		Sync.Synchronize.Id = Id;
		Sync.Synchronize.tm = new Date().getTime() + 5000;
		const cTC = te.Ctrls(CTRL_TC, true);
		for (let i in cTC) {
			if (Id != cTC[i].Id) {
				fn(Ctrl, cTC[i].Selected, parent);
			}
		}
	}
};

AddEvent("Load", function () {
	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev) {
		if (Sync.Synchronize.Disabled) {
			return;
		}
		if (Sync.Synchronize.Id) {
			if (new Date().getTime() < Sync.Synchronize.tm) {
				return;
			}
		}
		if (api.ILIsParent(Prev, Ctrl, true) || (/\.cfu$/i.test((Prev || {}).Path) || /\.cfu$/i.test((Ctrl.FolderItem || {}).Path))) {
			Sync.Synchronize.Run(Ctrl, Prev, function (Ctrl, FV, parent) {
				const path = BuildPath(FV.FolderItem.Path, GetFileName(Ctrl.FolderItem.Path));
				if (IsExists(path)) {
					FV.Navigate(path, SBSP_SAMEBROWSER);
				}
			});
		} else if (api.ILIsParent(Ctrl, Prev, true)) {
			Sync.Synchronize.Run(Ctrl, Prev, function (Ctrl, FV, parent) {
				if (SameText(parent, GetFileName(FV.FolderItem.Path))) {
					FV.Navigate(null, SBSP_PARENT);
				}
			});
		}
	});

	AddEvent("NavigateComplete", function (Ctrl) {
		if (Sync.Synchronize.Id == Ctrl.Parent.Id) {
			delete Sync.Synchronize.Id;
			setTimeout(function () {
				Ctrl.Focus();
			}, 999);
		}
	});
});

//Menu
if (GetNum(item.getAttribute("MenuExec"))) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.Synchronize.nPos, MF_BYPOSITION | (Sync.Synchronize.Disabled ? 0 : MF_CHECKED), ++nPos, Sync.Synchronize.strName);
		ExtraMenuCommand[nPos] = Sync.Synchronize.Exec;
		return nPos;
	});
}
//Key
if (GetNum(item.getAttribute("KeyExec"))) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.Synchronize.Exec, "Func");
}
//Mouse
if (GetNum(item.getAttribute("MouseExec"))) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.Synchronize.Exec, "Func");
}
AddTypeEx("Add-ons", "Synchronize", Sync.Synchronize.Exec);
