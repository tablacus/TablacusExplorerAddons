const Addon_Id = "countbar";
const Default = "BottomBar3Left";

if (window.Addon == 1) {
	Addons.CountBar = {
		Title: await GetAddonOption(Addon_Id, "Title"),

		Exec: async function (Ctrl, Text, iPart) {
			const FV = await GetFolderView(Ctrl);
			if (FV && Addons.CountBar.Item) {
				const nType = await FV.Type;
				if (nType != CTRL_SB && nType != CTRL_EB) {
					return;
				}
				if (Text || !Ctrl) {
					if (document.getElementById("countbar_$")) {
						Addons.CountBar.Show(FV, "$", Text);
						return;
					}
					const cTC = await te.Ctrls(CTRL_TC, true, window.chrome);
					for (let i = cTC.length; --i >= 0;) {
						const Id = await cTC[i].Id;
						Addons.CountBar.Show(await cTC[i].Selected, Id, Text);
					}
				}
			}
		},

		Show: async function (FV, Id, Text) {
			const el = document.getElementById("countbar_" + Id);
			if (!el) {
				return E_FAIL;
			}
			let s = [];
			let nCount = await FV.ItemCount(SVGIO_SELECTION);
			if (nCount) {
				const s1 = nCount > 1 ? Addons.CountBar.Item[2] : Addons.CountBar.Item[3];
				if (nCount > 999 && g_.IEVer > 8) {
					nCount = nCount.toLocaleString();
				}
				s.push(await api.sprintf(s1.length + 9, s1, nCount));
			}
			nCount = await FV.ItemCount();
			if (!nCount && !/^0/.test(Text)) {
				return;
			}
			const s1 = nCount > 1 ? Addons.CountBar.Item[0] : Addons.CountBar.Item[1];
			if (nCount > 999 && g_.IEVer > 8) {
				nCount = nCount.toLocaleString();
			}
			s.push(await api.sprintf(s1.length + 9, s1, nCount));
			s = s.join(" / ") + " ";
			el.innerHTML = "&nbsp;" + s;
			if (Addons.CountBar.Title) {
				api.SetWindowText(ui_.hwnd, s + " - " + TITLE);
			}
		}
	}

	Promise.all([api.LoadString(hShell32, 38192), api.LoadString(hShell32, 6466), api.LoadString(hShell32, 38193), api.LoadString(hShell32, 6466), api.LoadString(hShell32, 38194), api.LoadString(hShell32, 6477), api.LoadString(hShell32, 38195), api.LoadString(hShell32, 6477)]).then(function (r) {
		Addons.CountBar.Item = [r[0] || r[1], r[2] || r[3], r[4] || r[5], r[6] || r[7]];
		const ar = ["%s items selected", "%s item selected", "%s items", "%s item"];
		for (let i in Addons.CountBar.Item) {
			const s = Addons.CountBar.Item[i];
			if (!/%s/.test(s)) {
				Addons.CountBar.Item[i] = /%1[^ ]*/.test(s) ? s.replace(/%1[^ ]*/, "%s") : ar[i];
			}
		}
	});

	AddEvent("Layout", function () {
		SetAddon(Addon_Id, Default, '<span id="countbar_$">&nbsp;</span>');
	});

	AddEvent("StatusText", Addons.CountBar.Exec);
} else {
	EnableInner();
	SetTabContents(0, "View", '<label><input type="checkbox" id="Title">Title bar</label>');
}
