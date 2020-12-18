const Addon_Id = "openinstead";
if (window.Addon == 1) {
	AddEvent("WindowRegistered", function (Ctrl) {
		Sync.OpenInstead.Exec();
		setTimeout(Sync.OpenInstead.Exec, 500);
	});
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
