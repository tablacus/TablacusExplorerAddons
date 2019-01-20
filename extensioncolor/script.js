var Addon_Id = "extensioncolor";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.ExtensionColor = {
		Color: {}
	};
	try {
		var ado = OpenAdodbFromTextFile(fso.BuildPath(te.Data.DataFolder, "config\\extensioncolor.tsv"));
		while (!ado.EOS) {
			var ar = ado.ReadText(adReadLine).split("\t");
			if (ar[0]) {
				var a2 = ar[0].toLowerCase().split(/\s*;\s*/);
				for (var i in a2) {
					var s = a2[i].replace(/[\.\*]/, "");
					if (s != "") {
						Addons.ExtensionColor.Color[s] = GetWinColor(ar[1]);
					}
				}
			}
		}
		ado.Close();
	} catch (e) {}

	AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes)
	{
		if (pid) {
			var c = Addons.ExtensionColor.Color[fso.GetExtensionName(api.GetDisplayNameOf(pid, SHGDN_FORPARSING)).toLowerCase()];
			if (isFinite(c)) {
				var wfd = api.Memory("WIN32_FIND_DATA");
				var hr = api.SHGetDataFromIDList(pid, SHGDFIL_FINDDATA, wfd, wfd.Size);
				if (hr < 0 || !(wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY)) {
					vcd.clrText = c;
					return S_OK;
				}
			}
		}
	});
} else {
	hint = "ext";
	importScript("addons\\" + Addon_Id + "\\options.js");
}
