var Addon_Id = "replacecommand";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("re", "/^(notepad\\.exe)/$1/i");
}
Addons.ReplaceCommand = {
	lines: (GetAddonOption("replacecommand", "re") || "").split("\n")
}

if (window.Addon == 1) {
	AddEvent("ExtractMacro", [/./, function(Ctrl, s, re)
	{
		var lines = Addons.ReplaceCommand.lines;
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			if (line.length) {
				var re = line.split(line.charAt(0));
				if (re.length > 3) {
					try {
						s = s.replace(new RegExp(re[1], re[3]), re[2]);
					} catch (e) {}
				}
			}
		}
		return s;
	}]);
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
