var Addon_Id = "attributescolor";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.AttributesColor = {
		Color: {},
		attrs: ["root", FILE_ATTRIBUTE_REPARSE_POINT, FILE_ATTRIBUTE_ENCRYPTED, FILE_ATTRIBUTE_SYSTEM, FILE_ATTRIBUTE_HIDDEN, FILE_ATTRIBUTE_READONLY, FILE_ATTRIBUTE_COMPRESSED, FILE_ATTRIBUTE_DIRECTORY]
	};

	AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes)
	{
		if (pid) {
			if (api.PathIsRoot(pid.Path)) {
				var i = Addons.AttributesColor.Color["root"];
				if (isFinite(i)) {
					vcd.clrText = i;
					return;
				}
			}
			var wfd = api.Memory("WIN32_FIND_DATA");
			api.SHGetDataFromIDList(pid, SHGDFIL_FINDDATA, wfd, wfd.Size);
			for (var i in Addons.AttributesColor.attrs) {
				var j = Addons.AttributesColor.attrs[i];
				if (j & wfd.dwFileAttributes) {
					vcd.clrText = Addons.AttributesColor.Color[j];
					break;
				}
			}
		}
	});

	for (var i = Addons.AttributesColor.attrs.length; i--;) {
		var j = Addons.AttributesColor.attrs[i];
		var s = GetWinColor(item.getAttribute("c" + j));
		if (isFinite(s) && s !== null) {
			Addons.AttributesColor.Color[j] = s;
		} else {
			delete Addons.AttributesColor.attrs[i];
		}
	}
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
