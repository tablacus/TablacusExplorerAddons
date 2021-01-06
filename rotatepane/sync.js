const Addon_Id = "rotatepane";
const item = GetAddonElement(Addon_Id);

Sync.RotatePane = {
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),

	Exec: function (Ctrl, pt) {
		const cTC = te.Ctrls(CTRL_TC, true);
		const nLen = cTC.Count;
		let ix = [], cPos = [];
		for (let i = nLen; i--;) {
			ix.push(i);
		}
		ix = ix.sort(
			function (b, a) {
				const rca = api.Memory("RECT");
				const rcb = api.Memory("RECT");
				api.GetWindowRect(cTC[a].hwnd, rca);
				api.GetWindowRect(cTC[b].hwnd, rcb);
				if (rca.Top > rcb.Top) {
					return 1;
				} else if (rca.Top < rcb.Top) {
					return -1;
				}
				return rca.Left - rcb.Left;
			}
		);
		for (let i = nLen; i--;) {
			const TC = cTC[ix[i]];
			cPos[(i + 1) % nLen] = {
				Left: TC.Left,
				Top: TC.Top,
				Width: TC.Width,
				Height: TC.Height,
			};
		}
		for (let i = nLen; i--;) {
			const TC = cTC[ix[i]];
			TC.Left = cPos[i].Left;
			TC.Top = cPos[i].Top;
			TC.Width = cPos[i].Width;
			TC.Height = cPos[i].Height;
		}
		GetFolderView(Ctrl, pt).Focus();
		return S_OK;
	}
}

AddTypeEx("Add-ons", "Rotate pane", Sync.RotatePane.Exec);

//Menu
if (GetNum(item.getAttribute("MenuExec"))) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.RotatePane.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Sync.RotatePane.strName));
		ExtraMenuCommand[nPos] = Sync.RotatePane.Exec;
		return nPos;
	});
}
//Key
if (GetNum(item.getAttribute("KeyExec"))) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.RotatePane.Exec, "Func");
}
//Mouse
if (GetNum(item.getAttribute("MouseExec"))) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.RotatePane.Exec, "Func");
}
