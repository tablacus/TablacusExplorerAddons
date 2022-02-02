const Addon_Id = "previewwindow";
const item = GetAddonElement(Addon_Id);

if (!te.Data.AddonsData.PreviewWindow) {
	te.Data.AddonsData.PreviewWindow = api.CreateObject("Object");
	te.Data.AddonsData.PreviewWindow.r = 1;
}

Sync.PreviewWindow = {
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),
	ppid: api.Memory("DWORD"),
	Extract: GetNum(item.getAttribute("IsExtract")) ? item.getAttribute("Extract") || "*" : "-",
	TextFilter: GetNum(item.getAttribute("NoTextFilter")) ? "-" : item.getAttribute("TextFilter") || "*.txt;*.ini;*.css;*.js;*.vba;*.vbs",
	Embed: item.getAttribute("Embed") || "*.mp3;*.m4a;*.webm;*.mp4;*.rm;*.ra;*.ram;*.asf;*.wma;*.wav;*.aiff;*.mpg;*.avi;*.mov;*.wmv;*.mpeg;*.swf;*.pdf",
	Charset: item.getAttribute("Charset"),
	TextSize: item.getAttribute("TextSize") || 4000,
	TextLimit: item.getAttribute("TextLimit") || 10000000,

	Exec: function (Ctrl, pt) {
		GetFolderView(Ctrl, pt).Focus();
		if (Sync.PreviewWindow.dlg) {
			Sync.PreviewWindow.dlg.Document.parentWindow.CloseWindow();
			Sync.PreviewWindow.dlg = void 0;
		} else {
			Sync.PreviewWindow.dlg = ShowDialog("../addons/previewwindow/preview.html", te.Data.AddonsData.PreviewWindow);
		}
	},

	Arrange: function (Ctrl, Item) {
		if (!Ctrl) {
			Ctrl = te.Ctrl(CTRL_FV);
		}
		if (Sync.PreviewWindow.dlg) {
			Sync.PreviewWindow.Item = void 0;
			if (!Item && Ctrl.ItemCount(SVGIO_SELECTION) == 1) {
				Item = Ctrl.SelectedItems().Item(0);
			}
			if (Item) {
				Sync.PreviewWindow.Item = Item;
			}
			const ppid = api.Memory("DWORD");
			api.GetWindowThreadProcessId(api.GetFocus(), ppid);
			if (Sync.PreviewWindow.ppid[0] == ppid[0]) {
				InvokeFunc(Sync.PreviewWindow.dlg.Document.parentWindow.Common.PreviewWindow, [te.hwnd, true]);
			}
		}
	}
};

AddEvent("StatusText", function (Ctrl, Text, iPart) {
	if (Ctrl.Path) {
		Sync.PreviewWindow.Arrange(null, Ctrl);
	} else if (Ctrl.Type <= CTRL_EB && Text) {
		Sync.PreviewWindow.Arrange(Ctrl);
	}
});

if (!item.getAttribute("NoMouse")) {
	AddEvent("ToolTip", function (Ctrl, Index) {
		if (Ctrl.Type == CTRL_SB && Index >= 0) {
			const Item = Ctrl.Item(Index);
			if (Item) {
				Sync.PreviewWindow.Arrange(null, Item);
			}
		}
	});
}

AddEvent("LoadWindow", function (xml) {
	const items = xml ? xml.getElementsByTagName("PreviewWindow") : {};
	if (items.length) {
		te.Data.AddonsData.PreviewWindow.width = items[0].getAttribute("Width");
		te.Data.AddonsData.PreviewWindow.height = items[0].getAttribute("Height");
		te.Data.AddonsData.PreviewWindow.left = items[0].getAttribute("Left");
		te.Data.AddonsData.PreviewWindow.top = items[0].getAttribute("Top");
	}
});

AddEvent("SaveWindow", function (xml, all) {
	if (te.Data.AddonsData.PreviewWindow.width && te.Data.AddonsData.PreviewWindow.height) {
		const item = xml.createElement("PreviewWindow");
		item.setAttribute("Width", te.Data.AddonsData.PreviewWindow.width);
		item.setAttribute("Height", te.Data.AddonsData.PreviewWindow.height);
		item.setAttribute("Left", te.Data.AddonsData.PreviewWindow.left);
		item.setAttribute("Top", te.Data.AddonsData.PreviewWindow.top);
		xml.documentElement.appendChild(item);
	}
});

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.PreviewWindow.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Sync.PreviewWindow.strName);
		ExtraMenuCommand[nPos] = Sync.PreviewWindow.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.PreviewWindow.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.PreviewWindow.Exec, "Func");
}

AddTypeEx("Add-ons", "Preview window", Sync.PreviewWindow.Exec);

api.GetWindowThreadProcessId(te.hwnd, Sync.PreviewWindow.ppid);
