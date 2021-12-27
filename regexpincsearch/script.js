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
	SetTabContents(0, "", '<label>@comres.dll,-1953</label><br><input type="text" placeholder="2000" id="Timeout" class="number"><label>@powrprof.dll,-82[ms]</label>');
}
