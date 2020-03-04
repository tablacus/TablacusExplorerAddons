var Addon_Id = "jumplist";

if (window.Addon == 1) {
	Addons.JumpList =
	{
		DLL: api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\jumplist\\jumplist", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{3B821327-7ACA-4d96-A311-05B7C5E6D07B}"),

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
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
