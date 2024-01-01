const Addon_Id = "mpv";
const item = GetAddonElement(Addon_Id);
const PIPE = "\\\\.\\pipe\\te2mpv";

Sync.mpv = {
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),
	AppPath: PathQuoteSpaces(PathUnquoteSpaces(item.getAttribute("AppPath"))),
	AppOptions: item.getAttribute("AppOptions") || "--geometry=480x270-10+300 --no-keepaspect-window --idle=yes --keep-open --reset-on-next-file=pause",
	Filter: item.getAttribute("Filter") || "*.bmp;*.gif;*.ico;*.jfif;*.jpeg;*.jpg;*.png;*.psd;*.tif;*.webp;*.3gp;*.avi;*.flv;*.mov;*.mkv;*.mp4;*.mpeg;*.mpg;*.ts;*.webm;*.wmv;*.mid;*.mp3;*.ogg;*.wav;*.wma",
	Disabled: true,
	LastPath: "",

	Exec: function (Ctrl, pt) {
		if (Sync.mpv.Disabled) {
			if (Sync.mpv.AppPath) {
				const Item = Sync.mpv.GetCurrent();
				const target = (Item ? Sync.mpv.GetTarget(Item) : "");
				Sync.mpv.Start(target);
				Sync.mpv.Disabled = false;
				Sync.mpv.LastPath = (target ? Item.Path : "");
			}
		} else {
			Sync.mpv.SendCmd("quit");
			Sync.mpv.Disabled = true;
			Sync.mpv.LastPath = "";
		}
		InvokeUI("Addons.mpv.State", Sync.mpv.Disabled);
	},

	Start: function (target) {
		const sExe = Sync.mpv.AppPath + " " + Sync.mpv.AppOptions + " --input-ipc-server=" + PIPE + ' "' + target + '"';
		wsh.Run(sExe, SW_SHOWNOACTIVATE);
	},

	GetCurrent: function () {
		const FV = te.Ctrl(CTRL_FV);
		return (FV && FV.ItemCount(SVGIO_SELECTION) > 0 ? FV.Items(SVGIO_SELECTION).Item(0) : null);
	},

	GetTarget: function (Item) {
		const path = Item.ExtendedProperty("linktarget") || Item.Path;
		return (api.PathMatchSpec(path, Sync.mpv.Filter) && fso.FileExists(path) ? path : "");
	},

	Proc: function (Item) {
		if (Item.Path == Sync.mpv.LastPath) {
			return;
		}
		const target = Sync.mpv.GetTarget(Item);
		if (target) {
			const sCmd = "loadfile ``" + target + "``";
			if (Sync.mpv.SendCmd(sCmd) == E_FAIL) {
				Sync.mpv.Start(target);
			}
			Sync.mpv.LastPath = Item.Path;
		}
	},

	SendCmd: function (sCmd) {
		const hFile = api.CreateFile(PIPE, 0x40000000, 0, null, 3, FILE_ATTRIBUTE_NORMAL, null);
		if (hFile == INVALID_HANDLE_VALUE) {
			return E_FAIL;
		}
		api.WriteFile(hFile, api.WideCharToMultiByte(65001, sCmd + "\n"));
		api.CloseHandle(hFile);
		return S_OK;
	}
}

AddEvent("StatusText", function (Ctrl, Text, iPart) {
	if (Sync.mpv.Disabled) {
		return;
	}
	if (Ctrl.Path) {
		Sync.mpv.Proc(Ctrl);
	} else if (Ctrl.Type <= CTRL_EB && Text) {
		if (Ctrl.ItemCount(SVGIO_SELECTION) > 0) {
			Sync.mpv.Proc(Ctrl.Items(SVGIO_SELECTION).Item(0));
		}
	}
});

if (item.getAttribute("Hover")) {
	AddEvent("ToolTip", function (Ctrl, Index) {
		if (Sync.mpv.Disabled) {
			return;
		}
		if (Ctrl.Type <= CTRL_EB && Index >= 0) {
			const Item = Ctrl.Item(Index);
			if (Item) {
				Sync.mpv.Proc(Item);
			}
		}
	}, true);
}

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.mpv.nPos, MF_BYPOSITION | (Sync.mpv.Disabled ? MF_UNCHECKED : MF_CHECKED), ++nPos, Sync.mpv.strName);
		ExtraMenuCommand[nPos] = Sync.mpv.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.mpv.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.mpv.Exec, "Func");
}

AddTypeEx("Add-ons", "mpv", Sync.mpv.Exec);
