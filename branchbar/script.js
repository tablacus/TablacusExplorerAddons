const Addon_Id = "branchbar";
const Default = "ToolBar2Right";
if (window.Addon == 1) {
	Addons.BranchBar = {
		Get: async function (Ctrl) {
			const el = document.getElementById("branchbar");
			if (el && el.tagName) {
				const s = await api.CreateProcess("git branch --contains", await Ctrl.FolderItem.Path, 65001);
				el.innerHTML = "";
				if ("string" === typeof s) {
					const ar = s.split(/\r?\n/);
					for (let i = ar.length; i--;) {
						if (ar[i][0] === "*") {
							el.innerHTML = ar[i].substr(1);
							break;
						}
					}
				}
			}
		}
	};

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, '<span id="branchbar" style="white-space: nowrap"></span>', "middle");
	});

	AddEvent("ChangeView", Addons.BranchBar.Get);
}
