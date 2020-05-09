var Addon_Id = "rotatepane";
var Default = "ToolBar2Left";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("Menu", "Tool");
	item.setAttribute("MenuPos", -1);
	item.setAttribute("KeyOn", "All");
	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	Addons.RotatePane =
	{
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		Exec: function (Ctrl, pt) {
			var cTC = te.Ctrls(CTRL_TC, true);
			var TC = te.Ctrl(CTRL_TC);
			var nLen = cTC.length;
			var ix = [], cPos = [];
			for (var i = nLen; i--;) {
				ix.push(i);
			}
			ix = ix.sort(
				function (b, a) {
					var rca = api.Memory("RECT");
					var rcb = api.Memory("RECT");
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
			for (var i = nLen; i--;) {
				var TC = cTC[ix[i]];
				cPos[(i + 1) % nLen] = {
					Left: TC.Left,
					Top: TC.Top,
					Width: TC.Width,
					Height: TC.Height,
				};
			}
			for (var i = nLen; i--;) {
				var TC = cTC[ix[i]];
				TC.Left = cPos[i].Left;
				TC.Top = cPos[i].Top;
				TC.Width = cPos[i].Width;
				TC.Height = cPos[i].Height;
			}
			GetFolderView(Ctrl, pt).Focus();
			return S_OK;
		}
	}

	AddTypeEx("Add-ons", "Rotate pane", Addons.RotatePane.Exec);

	//Menu
	if (api.LowPart(item.getAttribute("MenuExec"))) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
			api.InsertMenu(hMenu, Addons.RotatePane.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.RotatePane.strName));
			ExtraMenuCommand[nPos] = Addons.RotatePane.Exec;
			return nPos;
		});
	}
	//Key
	if (api.LowPart(item.getAttribute("KeyExec"))) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.RotatePane.Exec, "Func");
	}
	//Mouse
	if (api.LowPart(item.getAttribute("MouseExec"))) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.RotatePane.Exec, "Func");
	}
	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,33" : "bitmap:ieframe.dll,214,24,33");
	SetAddon(Addon_Id, Default, ['<span class="button" id="Run" onclick="Addons.RotatePane.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.RotatePane.strName, src: src }, h), '</span>']);
} else {
	EnableInner();
}
