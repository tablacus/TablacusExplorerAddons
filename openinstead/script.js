var Addon_Id = "openinstead";

if (window.Addon == 1) {
	importJScript("addons\\" + Addon_Id + "\\sync.js");

	AddEvent("WindowRegistered", function (Ctrl) {
		Sync.OpenInstead.Exec();
		setTimeout(Sync.OpenInstead.Exec, 500);
	});
} else {
	SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
