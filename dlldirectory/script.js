var Addon_Id = "dlldirectory";

if (window.Addon == 1) {
	api.SetDllDirectory(ExtractMacro(te, GetAddonOption("dlldirectory", "x" + (api.sizeof("HANDLE") * 8))));
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "", ado.ReadText(adReadAll));
		ado.Close();
	}
}
