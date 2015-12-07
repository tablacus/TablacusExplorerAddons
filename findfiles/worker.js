importScripts("..\\..\\script\\consts.js");

BUF_SIZE = 32000;

if (MainWindow.Exchange) {
	g_ex = MainWindow.Exchange[arg[3]];
	if (g_ex) {
		g_abort = false;
		g_FV = g_ex.FV;
		var ar = g_ex.Path.split("|");
		var path = ar.shift();
		g_mask = ar.shift();
		g_filter = ar.join("|");
		g_length = g_filter.length * 2;
		g_sessionId = g_ex.SessionId;
		g_re = new RegExp(g_filter.replace(/([\+\*\.\?\^\$\[\-\]\|\(\)\\])/g, "\\$1"), "i");
		FindFiles(path);
		g_ex.ShowStatusText(g_FV, "", 0, g_sessionId);
		delete MainWindow.Exchange[arg[3]];
	}
}

function FindFiles(path)
{
	if (g_abort || !g_ex.ShowStatusText(g_FV, path, 0, g_sessionId)) {
		g_abort = true;
		return;
	}
	var bAdd;
	if (/^[A-Z]:\\\$Recycle\.Bin$/i.test(path)) {
		return;
	}
	var wfd = api.Memory("WIN32_FIND_DATA");
	var hFind = api.FindFirstFile(fso.BuildPath(path, "*"), wfd);
	var bFind = hFind != INVALID_HANDLE_VALUE;
	while (bFind && !g_abort) {
		var fn = fso.BuildPath(path, wfd.cFileName);
		if (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
			if (!/^\.\.?$/.test(wfd.cFileName)) {
				FindFiles(fn);
			}
		} else if (api.PathMatchSpec(wfd.cFileName, g_mask)) {
			if (g_length) {
				bAdd = false;
				var ado = te.CreateObject("Adodb.Stream");
				var charset = "_autodetect_all";
				try {
					ado.CharSet = "iso-8859-1";
					ado.Open();
					ado.LoadFromFile(fn);
					var s = ado.ReadText(3);
					if (/^\xEF\xBB\xBF/.test(s)) {
						charset = 'utf-8';
					} else if (/^\xFF\xFE|^\xFE\xFF/.test(s)) {
						charset = 'unicode';
					}
				} catch (e) {
					ado.close();
					return;
				}
				ado.Position = 0;
				ado.CharSet = charset;
				var n = -1;
				while (!ado.EOS && n < 0) {
					if (ado.Position > g_length) {
						ado.Position = ado.Position - g_length;
					}
					var s = ado.readText(BUF_SIZE);
					n = s.indexOf("\0");
					if (n >= 0) {
						s = s.substr(0, n);
					}
					if (g_re.test(s)) {
						bAdd = true;
						break;
					}
				}
				ado.close();
			} else {
				bAdd = true;
			}
			if (bAdd) {
				var pidl = api.ILCreateFromPath(fn);
				try {
					g_FV.AddItem(pidl, g_sessionId);
				} catch (e) {
					g_abort = true;
					return;
				}
			}
		}
		bFind = api.FindNextFile(hFind, wfd);
	}
	api.FindClose(hFind);
}
