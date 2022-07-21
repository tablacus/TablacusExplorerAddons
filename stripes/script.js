const Addon_Id = "stripes";
const item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Stripes = {
		tid: {},

		Retry: async function (Ctrl, nDog) {
			if (Ctrl && ++nDog < 9) {
				Addons.Stripes.tid[await Ctrl.hwnd] = setTimeout(function () {
					Sync.Stripes.Arrange(Ctrl, nDog);
				}, nDog * 100);
			}
		},

		DeleteTid: function (hwnd) {
			delete Addons.Stripes.tid[hwnd];
		}
	}
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
	AddEvent("Arrange", function (Ctrl) {
		setTimeout(async function () {
			Sync.Stripes.Arrange(await Ctrl.Selected);
		}, 99);
	});

} else {
	SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
