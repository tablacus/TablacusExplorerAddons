const Addon_Id = "cmigemo";

Addons.CMigemo = {
	bit: String(await api.sizeof("HANDLE") * 8),

	Init: async function (item) {
		const bit = Addons.CMigemo.bit;
		const migemo = await api.DllGetClassObject(BuildPath(ui_.Installed, "addons\\cmigemo\\tcmigemo" + bit + '.dll'), "{08D62D88-0F74-4a37-9F24-628A385EEC5C}");
		if (migemo) {
			await migemo.open(await api.PathUnquoteSpaces(await ExtractMacro(te, item.getAttribute("dll" + bit))), await api.PathUnquoteSpaces(await ExtractMacro(te, item.getAttribute("dict"))), item.getAttribute("CP"));
		}
		return migemo;
	}
}

if (window.Addon == 1) {
	$.migemo = await Addons.CMigemo.Init(await GetAddonElement(Addon_Id));

	AddEvent("AddonDisabled", function (Id) {
		if (SameText(Id, "cmigemo")) {
			$.migemo = null;
		}
	});
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
