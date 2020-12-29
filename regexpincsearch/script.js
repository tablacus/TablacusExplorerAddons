const Addon_Id = "regexpincsearch";
if (window.Addon == 1) {
	Addons.RegExpIncSearch = {
		Timer: function () {
			clearTimeout(Addons.RegExpIncSearch.tid);
			Addons.RegExpIncSearch.tid = setTimeout(Sync.RegExpIncSearch.Search, 200);
		}
	}
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "", '<label>Timeout</label><table style="width: 100%"><tr><td style="width: 100%"><input type="text" placeholder="2000" id="Timeout" style="width: 6em; text-align:right"><label>@calc.exe,-1721[ms]</label></td><td><input type="button" value="Set Default" onclick="document.F.Timeout.value=\'\'"></td></tr></table>');
}
