var Addon_Id = "jumplist";

var item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.JumpList =
	{
		DLL: api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\jumplist\\jumplist", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{3B821327-7ACA-4d96-A311-05B7C5E6D07B}"),
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		Exec: function (Ctrl, pt) {
			var FV = GetFolderView(Ctrl, pt);
			FV.Focus();
			Exec(Ctrl, "Add-ons&Id=jumplist", "Options", 0, pt);
			return S_OK;
		},

		Finalize: function ()
		{
			if (Addons.JumpList.DLL) {
				Addons.JumpList.DLL.Delete();
				delete Addons.JumpList.DLL;
			}
		}
	};

	AddEvent("AddonDisabled", function (Id)
	{
		if (Id.toLowerCase() == "jumplist") {
			Addons.JumpList.Finalize();
		}
	});

	//Menu
	if (item.getAttribute("MenuExec")) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
			api.InsertMenu(hMenu, Addons.JumpList.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.JumpList.strName);
			ExtraMenuCommand[nPos] = Addons.JumpList.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.JumpList.Exec, "Func", true);
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.JumpList.Exec, "Func", true);
	}

	if (Addons.JumpList.DLL) {
		var obj = {};
		try {
			var ado = OpenAdodbFromTextFile(fso.BuildPath(te.Data.DataFolder, "config\\jumplist.tsv"));
			while (!ado.EOS) {
				var ar = ExtractMacro(te, ado.ReadText(adReadLine)).split("\t");
				var cat = ar[3] || GetText("List");
				if (!obj[cat]) {
					obj[cat] = [];
				}
				var icon = ar[2].replace(/^icon:/, "").split(",");
				obj[cat].push({
					Name: ar[0] || fso.GetFileName(api.PathUnquoteSpaces(ar[1])),
					Path: ar[1],
					Icon: icon[0] || api.ILCreateFromPath(ar[1]),
					iIcon: icon[1]
				});
			}
			ado.Close();
		} catch (e) { }
		Addons.JumpList.DLL.Create(obj);
	}
	AddTypeEx("Add-ons", "Jump list", Addons.JumpList.Exec);
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
