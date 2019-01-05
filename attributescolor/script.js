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
	var s = ['<table>'];
	var attrs = [FILE_ATTRIBUTE_READONLY, FILE_ATTRIBUTE_HIDDEN, FILE_ATTRIBUTE_SYSTEM, FILE_ATTRIBUTE_COMPRESSED, FILE_ATTRIBUTE_ENCRYPTED, FILE_ATTRIBUTE_REPARSE_POINT, FILE_ATTRIBUTE_DIRECTORY, "root"];
	var names = [8768, 8769, 8770, 8771, 8772, "Junction", WINVER >= 0x600 ? 33017 : 4131, GetText("Root")];
	var hModule = api.GetModuleHandle(fso.BuildPath(system32, "shell32.dll"));
	for (var i in names) {
		s.push('<tr><td>', isFinite(names[i]) ? api.LoadString(hModule, names[i]) : names[i], '</td>');
		s.push('<td style="width: 7em"><input type="text" name="c', attrs[i], '" style="width: 100%" placeholder="Color" title="Color" onchange="ColorChanged(this)" /></td>');
		s.push('<td style="width: 1em"><input type="button" id="Color_c', attrs[i], '" value=" " class="color" style="background-color:', attrs[i], '; width: 100%" onclick="ChooseColor2(this)" title="Color" /></td>');
		s.push('<td><input type="button" value="Default" onclick="SetDefault(document.F.c', attrs[i], ", ''", ')" /></td>');
		s.push('</tr>');
	}
	s.push('</table>');
	SetTabContents(0, "General", s.join(""));
	ColorChanged = function (o)
	{
		document.getElementById("Color_" + o.name).style.backgroundColor = o.value;
	}
}
