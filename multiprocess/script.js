var Addon_Id = "multiprocess";

var item = GetAddonElement(Addon_Id);
if (!api.LowPart(item.getAttribute("Delete")) && !api.LowPart(item.getAttribute("Paste")) && !api.LowPart(item.getAttribute("Drop")) && !api.LowPart(item.getAttribute("RDrop"))) {
	item.setAttribute("Delete", 1);
	item.setAttribute("Paste", 1);
	item.setAttribute("Drop", 1);
	item.setAttribute("RDrop", 1);
}

Addons.MultiProcess =
{
	Delete: api.LowPart(item.getAttribute("Delete")),
	Paste: api.LowPart(item.getAttribute("Paste")),
	Drop: api.LowPart(item.getAttribute("Drop")),
	RDrop: api.LowPart(item.getAttribute("RDrop")),
	NoTemp: item.getAttribute("NoTemp"),

	FO: function (Ctrl, Items, Dest, grfKeyState, pt, pdwEffect, nMode)
	{
		if (Items.Count == 0) {
			return false;
		}
		var dwEffect = pdwEffect[0];
		if (Dest !== null) {
			var path = api.GetDisplayNameOf(Dest, SHGDN_FORPARSING);
			if (/^::{/.test(path) || (/^[A-Z]:\\|^\\/i.test(path) && !fso.FolderExists(path))) {
				return false;
			}
			if (nMode == 0) {
				if (!(grfKeyState & MK_CONTROL) && api.ILIsEqual(Dest, Items.Item(-1))) {
					return false;
				}
				var DropTarget = api.DropTarget(Dest);
				DropTarget.DragOver(Items, grfKeyState, pt, pdwEffect);
			}
			var pidTemp = api.ILCreateFromPath(fso.GetSpecialFolder(2).Path);
			pidTemp.IsFolder;
			var strTemp = pidTemp.Path + "\\";
			var strTemp2;
			var arRen1 = [], arRen2 = [];
			var Items2 = api.CreateObject("FolderItems");
			for (var i = Items.Count; i-- > 0;) {
				var path1 = Items.Item(i).Path;
				if (IsExists(path1)) {
					if (!api.StrCmpNI(path1, strTemp, strTemp.length)) {
						if (!arRen1.length) {
							if (Addons.MultiProcess.NoTemp) {
								return false;
							}
							strTemp2 = strTemp + "tablacus\\" + fso.GetTempName() + "\\";
							DeleteItem(strTemp2);
						}
						arRen1.unshift(path1);
						path1 = strTemp2 + path1.slice(strTemp.length);
						arRen2.unshift(path1);
						CreateFolder(fso.GetParentFolderName(path1));
					}
					Items2.AddItem(path1);
				} else {
					arRen1.length = 0;
					break;
				}
			}
			if (arRen1.length) {
				api.SHFileOperation(FO_MOVE, arRen1.join("\0"), arRen2.join("\0"), FOF_MULTIDESTFILES | FOF_SILENT, false);
				Items = Items2;
			}
		}
		if (nMode == 0) {
			if (grfKeyState & MK_RBUTTON) {
				if (!Addons.MultiProcess.RDrop) {
					return false;
				}
			} else {
				if (!Addons.MultiProcess.Drop) {
					return false;
				}
			}
		} else if (nMode == 1) {
			if (!Addons.MultiProcess.Delete) {
				return false;
			}
		} else if (nMode == 2) {
			if (!Addons.MultiProcess.Paste) {
				return false;
			}
		}

		Addons.MultiProcess.tid = setTimeout(function ()
		{
			Addons.MultiProcess.tid = null;
			var hwnd = null;
			while (hwnd = api.FindWindowEx(null, hwnd, null, null)) {
				if (api.GetClassName(hwnd) == "OperationStatusWindow") {
					if (!(api.GetWindowLongPtr(hwnd, GWL_EXSTYLE) & 8)) {
						api.SetForegroundWindow(hwnd);
						api.SetWindowPos(hwnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
					}
		}
			}
		}, 5000);

		var State = [VK_SHIFT, VK_CONTROL, VK_MENU];
		for (var i = State.length; i--;) {
			if (api.GetKeyState(State[i]) >= 0) {
				State.splice(i, 1);
			}
		}
		OpenNewProcess("addons\\multiprocess\\worker.js",
		{
			Items: Items,
			Dest: Dest,
			Mode: nMode,
			grfKeyState: grfKeyState,
			pt: pt,
			dwEffect: dwEffect,
			TimeOver: item.getAttribute("TimeOver"),
			Sec: item.getAttribute("Sec"),
			State: State,
			Callback: Addons.MultiProcess.Player
		});
		return true;
	},

	Player: function (autoplay)
	{
		if (Addons.MultiProcess.tid) {
			clearTimeout(Addons.MultiProcess.tid);
			Addons.MultiProcess.tid = null;
		}
		var el;
		var src = api.PathUnquoteSpaces(ExtractMacro(te, (autoplay === true) ? item.getAttribute("File") : document.F.File.value));
		if (autoplay === true && api.PathMatchSpec(src, "*.wav")) {
			api.PlaySound(src, null, 1);
			return;
		}
		if (g_.IEVer >= 11 && api.PathMatchSpec(src, "*.mp3;*.m4a;*.webm;*.mp4")) {
			el = document.createElement('audio');
			if (autoplay === true) {
				el.setAttribute("autoplay", "true");
			} else {
				el.setAttribute("controls", "true");
			}
			if (autoplay === true) {
				el.setAttribute("autoplay", "true");
			}
		} else {
			el = document.createElement('embed');
			el.setAttribute("volume", "0");
			el.setAttribute("autoplay", autoplay === true);
		}
		el.src = src;
		el.setAttribute("style", "width: 100%; height: 3.5em");
		var o = document.getElementById('multiprocess_player');
		while (o.firstChild) {
			o.removeChild(o.firstChild);
		}
		if (src) {
			o.appendChild(el);
		}
	}
};

if (window.Addon == 1) {
	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		switch (Ctrl.Type) {
			case CTRL_SB:
			case CTRL_EB:
			case CTRL_TV:
				var Dest = Ctrl.HitTest(pt);
				if (Dest) {
					if (!fso.FolderExists(Dest.Path)) {
						if (api.DropTarget(Dest)) {
							return E_FAIL;
						}
						Dest = Ctrl.FolderItem;
					}
				} else {
					Dest = Ctrl.FolderItem;
				}
				if (Dest && Addons.MultiProcess.FO(Ctrl, dataObj, Dest, grfKeyState, pt, pdwEffect, 0)) {
					return S_OK
				}
				break;
			case CTRL_DT:
				if (Addons.MultiProcess.FO(null, dataObj, Ctrl.FolderItem, grfKeyState, pt, pdwEffect, 0)) {
					return S_OK
				}
				break;
		}
	});

	AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
			switch ((wParam & 0xfff) + 1) {
				case CommandID_PASTE:
					var Items = api.OleGetClipboard();
					if (!api.ILIsEmpty(Items.Item(-1)) && Addons.MultiProcess.FO(null, Items, Ctrl.FolderItem, MK_LBUTTON, null, Items.pdwEffect, 2)) {
						return S_OK;
					}
					break;
				case CommandID_DELETE:
					var Items = Ctrl.SelectedItems();
					if (Addons.MultiProcess.FO(null, Items, null, MK_LBUTTON, null, Items.pdwEffect, 1)) {
						return S_OK;
					}
					break;
			}
		}
	});

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		switch (Verb + 1) {
			case CommandID_PASTE:
				var Target = ContextMenu.Items();
				if (Target.Count) {
					var Items = api.OleGetClipboard()
					if (Addons.MultiProcess.FO(null, Items, Target.Item(0), MK_LBUTTON, null, Items.pdwEffect, 2)) {
						return S_OK;
					}
				}
				break;
			case CommandID_DELETE:
				var Items = ContextMenu.Items();
				if (Addons.MultiProcess.FO(null, Items, null, MK_LBUTTON, null, Items.pdwEffect, 1)) {
					return S_OK;
				}
				break;
		}
	});
	document.getElementById('None').insertAdjacentHTML("BeforeEnd", '<div id="multiprocess_player"></div>');
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "", ado.ReadText(adReadAll));
		ado.Close();
	}

	AddEventEx(window, "load", Addons.MultiProcess.Player);
}
