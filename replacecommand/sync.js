const Addon_Id = "replacecommand";
const item = GetAddonElement(Addon_Id);
Sync.ReplaceCommand = {
	lines: (GetAddonOption("replacecommand", "re") || "").split("\n")
}

AddEvent("ExtractMacro", [/./, function (Ctrl, s, re) {
	const lines = Sync.ReplaceCommand.lines;
	for (let i = 0; i < lines.length; ++i) {
		const line = lines[i];
		if (line.length) {
			const re = line.split(line.charAt(0));
			if (re.length > 3) {
				try {
					s = s.replace(new RegExp(re[1], re[3]), re[2]);
				} catch (e) { }
			}
		}
	}
	return s;
}]);
