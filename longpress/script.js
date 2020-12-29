if (window.Addon == 1) {
	const Addon_Id = "longpress";
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "", '<label>Timeout</label><br><input type="text" name="timeout" placeholder="500" style="width: 6em; text-align:right"><label>@calc.exe,-1721[ms]</label>');
}
