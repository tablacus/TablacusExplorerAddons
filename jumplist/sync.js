const Addon_Id = "jumplist";
const item = GetAddonElement(Addon_Id);

Sync.JumpList = {
	DLL: api.DllGetClassObject(BuildPath(te.Data.Installed, ["addons\\jumplist\\jumplist", g_.bit, ".dll"].join("")), "{3B821327-7ACA-4d96-A311-05B7C5E6D07B}"),
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),

	Exec: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		FV.Focus();
		Exec(Ctrl, "Add-ons&Id=jumplist", "Options", 0, pt);
		return S_OK;
	},

	Finalize: function () {
		if (Sync.JumpList.DLL) {
			Sync.JumpList.DLL.Delete();
			delete Sync.JumpList.DLL;
		}
	}
};

AddEvent("AddonDisabled", function (Id) {
	if (SameText(Id, "jumplist")) {
		Sync.JumpList.Finalize();
	}
});

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.JumpList.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Sync.JumpList.strName);
		ExtraMenuCommand[nPos] = Sync.JumpList.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.JumpList.Exec, "Func", true);
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.JumpList.Exec, "Func", true);
}

if (Sync.JumpList.DLL) {
	const obj = {};
	try {
		const ado = OpenAdodbFromTextFile(BuildPath(te.Data.DataFolder, "config\\jumplist.tsv"));
		while (!ado.EOS) {
			const ar = ExtractMacro(te, ado.ReadText(adReadLine)).split("\t");
			const cat = ar[3] || GetText("List");
			if (!obj[cat]) {
				obj[cat] = [];
			}
			const icon = ar[2].replace(/^icon:/, "").split(",");
			obj[cat].push({
				Name: ar[0] || GetFileName(PathUnquoteSpaces(ar[1])),
				Path: ar[1],
				Icon: icon[0] || api.ILCreateFromPath(ar[1]),
				iIcon: icon[1]
			});
		}
		ado.Close();
	} catch (e) { }
	Sync.JumpList.DLL.Create(obj);
}
AddTypeEx("Add-ons", "Jump list", Sync.JumpList.Exec);
