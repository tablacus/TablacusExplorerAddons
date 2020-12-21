const Addon_Id = "hotkey";

if (window.Addon == 1) {
	Addons.Hotkey = {
		id: await api.GlobalAddAtom('HotKeyTE')
	};

	AddEvent("SystemMessage", function (Ctrl, hwnd, msg, wParam, lParam) {
		if (msg == WM_HOTKEY) {
			RestoreFromTray();
			return 1;
		}
	});

	AddEvent("Finalize", async function () {
		await api.UnregisterHotKey(ui_.hwnd, Addons.Hotkey.id);
		api.GlobalDeleteAtom(Addons.Hotkey.id);
	});

	let nKey = await GetKeyKey(await GetAddonOption(Addon_Id, "Key") || "");
	let fsModifiers = WINVER >= 0x601 ? MOD_NOREPEAT : 0;
	if (nKey & 0x1000) {
		fsModifiers |= MOD_SHIFT;
	}
	if (nKey & 0x2000) {
		fsModifiers |= MOD_CONTROL;
	}
	if (nKey & 0x4000) {
		fsModifiers |= MOD_ALT;
	}
	if (nKey & 0x8000) {
		fsModifiers |= MOD_WIN;
	}
	nKey = await api.MapVirtualKey(nKey & 0xfff, 3);
	if (nKey) {
		if (!await api.RegisterHotKey(ui_.hwnd, Addons.Hotkey.id, fsModifiers, nKey)) {
			var o = document.getElementById("BottomBar3Left");
			o.insertAdjacentHTML("BeforeEnd", ["<b id='error_hotkey'>Hot Key ", await GetText("Error"), ":", await GetAddonOption(Addon_Id, "Key"), '<img class="button" src="', await MakeImgSrc("bitmap:ieframe.dll,545,13,1", 0, false, 13), '" onmouseover="MouseOver(this)" onmouseout="MouseOut()" onclick="Addons.Hotkey.Close()"></b>'].join(""));
			o.style.display = ui_.IEVer > 7 && SameText(o.tagName, "td") ? "table-cell" : "block";
			Addons.Hotkey.Close = function () {
				document.getElementById("error_hotkey").style.display = "none";
			}
		}
	}
} else {
	ChangeForm([["__KeyExec", "style/display", "none"]]);
}
