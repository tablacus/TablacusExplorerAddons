var Addon_Id = "paste";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	var item = await GetAddonElement(Addon_Id);

	Addons.Paste = {
		strName: item.getAttribute("MenuName") || await api.LoadString(hShell32, 33562),

		Exec: async function (Ctrl, pt) {
			var FV = await GetFolderViewEx(Ctrl, pt);
			if (FV) {
				FV.Focus();
				var Items = await FV.FolderItem;
				var ContextMenu = await api.ContextMenu(Items, FV);
				if (ContextMenu) {
					var hMenu = await api.CreatePopupMenu();
					await ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_DEFAULTONLY);
					await ContextMenu.InvokeCommand(0, ui_.hwnd, CommandID_PASTE - 1, null, null, SW_SHOWNORMAL, 0, 0);
					api.DestroyMenu(hMenu);
				}
			}
			return S_OK;
		},

		State: async function () {
			var Items = await api.OleGetClipboard();
			var b = !(Items && await Items.Count);
			var o = document.getElementById("ImgPaste_$");
			if (o) {
				DisableImage(o, b);
			} else {
				var cTC = await te.Ctrls(CTRL_TC);
				for (var i = await cTC.Count; i-- > 0;) {
					o = document.getElementById("ImgPaste_" + await cTC[i].Id);
					if (o) {
						DisableImage(o, b);
					}
				}
			}
		}
	};

	AddEvent("SystemMessage", function (Ctrl, hwnd, msg, wParam, lParam) {
		if (msg == WM_CLIPBOARDUPDATE) {
			Addons.Paste.State();
		}
	});

	AddEvent("Resize", Addons.Paste.State);

	//Menu
	if (item.getAttribute("MenuExec")) {
		Common.Paste = await api.CreateObject("Object");
		Common.Paste.strMenu = item.getAttribute("Menu");
		Common.Paste.strName = Addons.Paste.strName;
		Common.Paste.nPos = GetNum(item.getAttribute("MenuPos"));
		$.importScript("addons\\" + Addon_Id + "\\sync.js");
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Paste.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Paste.Exec, "Async");
	}
	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,7" : "bitmap:ieframe.dll,214,24,7");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.Paste.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: Addons.Paste.strName, id: "ImgPaste_$", src: src }, h), '</span>']);
} else {
	EnableInner();
}
