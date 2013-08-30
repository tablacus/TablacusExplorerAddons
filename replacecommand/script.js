var Addon_Id = "replacecommand";
(function () {
	var items = te.Data.Addons.getElementsByTagName(Addon_Id);
	if (items.length) {
		var item = items[0];
		if (!item.getAttribute("Set")) {
			item.setAttribute("re", "/^(notepad\\.exe)/$1/i");
		}
	}
	if (window.Addon == 1) {
		AddEvent("ExtractMacro", [/./, function(Ctrl, s, re)
		{
			var lines = GetAddonOption("replacecommand", "re").split("\n");
			for (var i in lines) {
				var line = lines[i];
				if (line.length) {
					var re = line.split(line.charAt(0));
					if (re.length > 3) {
						s = s.replace(new RegExp(re[1], re[3]), re[2]);
					}
				}
			}
			return s;
		}]);
	}
})();
