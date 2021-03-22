importScripts("..\\..\\script\\consts.js", "..\\..\\script\\sync.js");
const clsid = "{E840AAD2-1EF2-4F00-8BA8-CE7B57BF8878}";
let s, dllpath, Result, pnReboot = [0, 0];

if (MainWindow.Exchange) {
	const ex = MainWindow.Exchange[arg[3]];
	if (ex) {
		let Explorer;
		if (ex.Explorer) {
			Explorer = wsh.ExpandEnvironmentStrings("%SystemRoot%\\explorer.exe")
			WmiProcess(" WHERE ExecutablePath='" + Explorer.replace(/\\/g, "\\\\") + "'", function (item) {
				item.Terminate();
				pnReboot[1] = 1;
			});
		}
		let reg = "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer\\EnableShellExecuteHooks";
		try {
			s = !wsh.RegRead(reg);
		} catch (e) {
			s = true;
		}
		if (s == ex.EnableShellExecuteHooks && /boolean/i.test(typeof ex.EnableShellExecuteHooks)) {
			try {
				if (s) {
					wsh.RegWrite(reg, 1, "REG_DWORD");
				} else {
					wsh.RegDelete(reg);
				}
				pnReboot[0] |= 1;
			} catch (e) { }
		}
		reg = "HKCU\\SOFTWARE\\Tablacus\\ShellExecuteHook\\ExePath";
		try {
			s = wsh.RegRead(reg);
		} catch (e) { }
		if (s != ex.Path && /string/i.test(typeof ex.Path)) {
			try {
				if (ex.Path) {
					wsh.RegWrite(reg, PathUnquoteSpaces(MainWindow.ExtractMacro(te, ex.Path)), "REG_SZ");
				} else {
					wsh.RegDelete(reg);
					wsh.RegDelete("HKCU\\SOFTWARE\\Tablacus\\ShellExecuteHook\\");
					wsh.RegDelete("HKCU\\SOFTWARE\\Tablacus\\");
				}
			} catch (e) { }
		}
		SetDll(g_.bit, "", system32, pnReboot, ex);
		if (g_.bit == 64) {
			SetDll(32, "Wow6432Node\\", wsh.ExpandEnvironmentStrings("%WINDIR%\\SysWOW64"), pnReboot, ex);
		}
		delete MainWindow.Exchange[arg[3]];

		if (pnReboot[1]) {
			api.CreateProcess(Explorer);
		}
		if (pnReboot[0] & (ex.Explorer ? 2 : 3)) {
			MessageBox(api.LoadString(hShell32, 61961) || "Reboot required.", TITLE, MB_ICONINFORMATION);
		}
	}
}

function SetDll(bit, wow64, sysdir, pnReboot, ex) {
	let s = true;
	const dllpath = [];
	const ver = [];
	if (!/boolean/.test(typeof ex[bit])) {
		return;
	}

	try {
		dllpath[2] = wsh.RegRead("HKCR\\" + wow64 + "CLSID\\" + clsid + "\\InprocServer32\\");
	} catch (e) {
		dllpath[2] = "";
		s = false;
	}
	if (ex[bit]) {
		dllpath[0] = BuildPath(GetParentFolderName(api.GetModuleFileName(null)), "addons\\shellexecutehook\\tshellexecutehook") + bit + ".dll";
		dllpath[1] = BuildPath(sysdir, "tshellexecutehook" + bit + ".dll");
		for (let i = 2; i--;) {
			try {
				ver[i] = fso.GetFileVersion(dllpath[i]);
			} catch (e) { }
		}
		if (ver[0] != ver[1]) {
			try {
				fso.CopyFile(dllpath[0], dllpath[1]);
			} catch (e) {
				pnReboot[0] |= 2;
				DeleteFileEx(dllpath[1]);
				fso.CopyFile(dllpath[0], dllpath[1]);
			}
			pnReboot[0] |= 1;
		}

		if (!s) {
			wsh.Run(PathQuoteSpaces(BuildPath(sysdir, "regsvr32.exe")) + " /s " + PathQuoteSpaces(dllpath[1]));
			pnReboot[0] |= 1;
		}
	}
	if (!ex[bit] && s) {
		if (!dllpath[2] || !fso.FileExists(dllpath[2])) {
			dllpath[2] = BuildPath(GetParentFolderName(api.GetModuleFileName(null)), "addons\\shellexecutehook\\tshellexecutehook") + bit + ".dll";
			s = false;
		}
		if (dllpath[2] && fso.FileExists(dllpath[2])) {
			pnReboot[0] |= 1;
			wsh.Run(PathQuoteSpaces(BuildPath(sysdir, "regsvr32.exe")) + " /u /s " + PathQuoteSpaces(dllpath[2]), 0, true);
			if (s) {
				try {
					fso.DeleteFile(dllpath[2], true);
				} catch (e) {
					pnReboot[0] |= 2;
					DeleteFileEx(dllpath[2]);
				}
			}
		}
	}
}

function DeleteFileEx(path) {
	try {
		const temp = BuildPath(GetParentFolderName(path), fso.GetTempName());
		fso.MoveFile(path, temp);
		api.MoveFileEx(temp, null, MOVEFILE_DELAY_UNTIL_REBOOT);
	} catch (e) { }
}
