var Addon_Id = "branchbar";
var Default = "ToolBar2Right";

if (window.Addon == 1) {
	Addons.BranchBar =
	{
		Get: function (Ctrl)
		{
			var s = api.CreateProcess("git branch --contains", Ctrl.FolderItem.Path);
			var o = document.getElementById("branchbar");
			if (o) {
				o.innerHTML = s && s[0] == "*" ? s.substr(1) : "";
			}
		}
	};

	AddEvent("ChangeView", Addons.BranchBar.Get);
	SetAddon(Addon_Id, Default, '<span id="branchbar" style="white-space: nowrap"></span>', "middle");
}
