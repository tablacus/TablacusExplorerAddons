var Addon_Id = "checkbox";
if (window.Addon == 1) {
	Addons.CheckBox = {
		tid: {},

		Arrange: function (Id) {
			delete Addons.CheckBox.tid[Id];
			Sync.CheckBox.Arrange(Id);
		},

		Set: function (Id) {
			if (Addons.CheckBox.tid[Id]) {
				clearTimeout(Addons.CheckBox.tid[Id]);
			}
			Addons.CheckBox.tid[Id] = setTimeout(Sync.CheckBox.Arrange, 99, Id);
		}
	}
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "General", '<input type="checkbox" id="All"><label for="All">All</label> (<input type="checkbox" id="Background"><label for="Background">Background</label>)<br><input type="checkbox" id="XP"><label for="XP">XP ' + (GetText("Style").toLowerCase()) + '</label>');
}
