Sync.FolderSettings = {
	Get: function (Ctrl) {
		if (!Sync.FolderSettings.xml) {
			Sync.FolderSettings.xml = OpenXml("foldersettings.xml", false, true).getElementsByTagName("Item");
		}
		const items = Sync.FolderSettings.xml;
		const path = api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
		let path2 = api.GetDisplayNameOf(Ctrl, SHGDN_FORPARSING);
		if (path == path2) {
			path2 = "";
		}
		for (let i = items.length; i-- > 0;) {
			const filter = items[i].getAttribute("Filter");
			if (PathMatchEx(path, filter) || (path2 && PathMatchEx(path2, filter))) {
				return items[i];
			}
		}
	}

};

AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev) {
	if (Ctrl.Data && !Ctrl.Data.Setting) {
		const item = Sync.FolderSettings.Get(Ctrl);
		if (item) {
			const s = item.text || item.textContent;
			let res = /SetViewMode\(\s*(\-?\d)\s*,\s*(\d+)/i.exec(s);
			if (res) {
				fs.ViewMode = res[1];
				fs.ImageSize = res[2];
			}
			res = /CurrentViewMode\(\s*(\-?\d)\s*,\s*(\d+)/i.exec(s);
			if (res) {
				fs.ViewMode = res[1];
				fs.ImageSize = res[2];
			}
			res = /CurrentViewMode\s*=\s*(\-?\d)/i.exec(s);
			if (res) {
				fs.ViewMode = res[1];
			}
			res = /IconSize\s*=\s*(\d+)/i.exec(s);
			if (res) {
				fs.ImageSize = res[1];
			}
			Ctrl.Data.Setting = 'FolderSettings';
		}
	}
});

AddEvent("NavigateComplete", function (Ctrl) {
	if (Ctrl.Data && Ctrl.Data.Setting === 'FolderSettings') {
		const item = Sync.FolderSettings.Get(Ctrl);
		if (item) {
			const s = item.text || item.textContent;
			if (s) {
				Exec(Ctrl, s, item.getAttribute("Type"), null);
			}
		}
	}
});

AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
	if (wParam == 28722 && Ctrl.Type <= CTRL_EB) {
		const opt = api.CreateObject("Object");
		opt.MainWindow = window;
		opt.te = te;
		opt.width = 640;
		opt.height = 480;
		opt.GetCurrent = true;
		ShowDialog("../addons/foldersettings/options.html", opt);
		return S_OK;
	}
});
