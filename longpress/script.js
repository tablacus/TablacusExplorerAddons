if (window.Addon == 1) {
	const Addon_Id = "longpress";
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "", '<label>@comres.dll,-1953</label><br><input type="text" name="timeout" placeholder="500" class="number"><label>@powrprof.dll,-82[ms]</label>');
}
