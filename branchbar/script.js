const Addon_Id = "branchbar";
const Default = "ToolBar2Right";

if (window.Addon == 1) {
	Addons.BranchBar = {
		Get: async function (Ctrl) {
			const el = document.getElementById("branchbar");
			if (el) {
				const s = await api.CreateProcess("git branch --contains", await Ctrl.FolderItem.Path);
				el.innerHTML = s && s[0] == "*" ? s.substr(1) : "";
			}
		}
	};

	AddEvent("ChangeView", Addons.BranchBar.Get);
	SetAddon(Addon_Id, Default, '<span id="branchbar" style="white-space: nowrap"></span>', "middle");
}
