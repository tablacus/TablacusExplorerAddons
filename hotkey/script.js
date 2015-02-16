var Addon_Id = "hotkey";

if (window.Addon == 1) {
	Addons.Hotkey =
	{
		id: api.GlobalAddAtom('HotKeyTE')
	};

	AddEvent("Finalize", function ()
	{
		api.UnregisterHotKey(te.hwnd, Addons.Hotkey.id);
		api.GlobalDeleteAtom(Addons.Hotkey.id);
	});

	AddEvent("SystemMessage", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		if (msg == WM_HOTKEY) {
			RestoreFromTray();
			return 1;
		}
	});

	var nKey = GetKeyKey(GetAddonOption(Addon_Id, "Key") || "");
	var fsModifiers = WINVER >= 0x601 ? MOD_NOREPEAT : 0;
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
	nKey = api.MapVirtualKey(nKey & 0xfff, 3);
	if (nKey) {
		if (!api.RegisterHotKey(te.hwnd, Addons.Hotkey.id, fsModifiers, nKey)) {
			var o = document.getElementById("BottomBar3Left");
			o.insertAdjacentHTML("BeforeEnd", ["<b id='error_hotkey'>Hot Key ", GetText("Error"), ":", GetAddonOption(Addon_Id, "Key"), '<img class="button" src="', MakeImgSrc("bitmap:ieframe.dll,545,13,1", 0, false, 13), '" onmouseover="MouseOver(this)" onmouseout="MouseOut()" onclick="Addons.Hotkey.Close()"></b>'].join(""));
			o.style.display = !document.documentMode || api.StrCmpI(o.tagName, "td") ? "block" : "table-cell";
			Addons.Hotkey.Close = function ()
			{
				document.getElementById("error_hotkey").style.display = "none";
			}
		}
	}
}
