// Tablacus Archive image (C)2020 Gaku
// MIT Lisence
// Visual C++ 2017 Express Edition
// Windows SDK v7.1
// https://tablacus.github.io/

#include "resource.h"
#include "fldrimg.h"

LPFNGetImage lpfnGetImage = NULL;
int	g_nItems = 30;
BOOL g_bExpanded = TRUE;
LPWSTR g_bsFilter = NULL;
LPWSTR g_bsInvalid = NULL;
DWORD g_dwMainThreadId = GetCurrentThreadId();
HWND g_hwndMain = NULL;
LONG g_lLocks = 0;
HMODULE g_hSQLite3 = 0;
sqlite3	*g_pSQLite3 = NULL;
BOOL g_bWinSQLite3 = FALSE;
FARPROC sqlite3_open = NULL;
FARPROC sqlite3_close = NULL;
FARPROC sqlite3_exec = NULL;

// Unit
VOID SafeRelease(PVOID ppObj)
{
	try {
		IUnknown **ppunk = static_cast<IUnknown **>(ppObj);
		if (*ppunk) {
			(*ppunk)->Release();
			*ppunk = NULL;
		}
	} catch (...) {}
}

VOID teSysFreeString(BSTR *pbs)
{
	if (*pbs) {
		::SysFreeString(*pbs);
		*pbs = NULL;
	}
}

VOID teFreeAnsiString(LPSTR *lplpA)
{
	::SysFreeString((BSTR)*lplpA);
	*lplpA = NULL;
}

LPSTR teWide2Ansi(LPWSTR lpW, int nLenW, int nCP)
{
	int nLenA = WideCharToMultiByte(nCP, 0, (LPCWSTR)lpW, nLenW, NULL, 0, NULL, NULL);
	BSTR bs = ::SysAllocStringByteLen(NULL, nLenA);
	WideCharToMultiByte(nCP, 0, (LPCWSTR)lpW, nLenW, (LPSTR)bs, nLenA, NULL, NULL);
	return (LPSTR)bs;
}

BSTR teAnsi2Wide(LPCSTR lpstr, int nCP)
{
	BSTR bsW = NULL;
	int nLenW = MultiByteToWideChar(nCP, 0, lpstr, -1, NULL, NULL);
	if (nLenW) {
		bsW = ::SysAllocStringLen(NULL, nLenW - 1);
		bsW[0] = NULL;
		MultiByteToWideChar(nCP, 0, (LPCSTR)lpstr, -1, bsW, nLenW);
	} else {
		bsW = NULL;
	}
	return bsW;
}

BSTR teSysAllocStringLen(const OLECHAR *strIn, UINT uSize)
{
	UINT uOrg = lstrlen(strIn);
	if (strIn && uSize > uOrg) {
		BSTR bs = ::SysAllocStringLen(NULL, uSize);
		lstrcpy(bs, strIn);
		return bs;
	}
	return ::SysAllocStringLen(strIn, uSize);
}

VOID tePathAppend(BSTR *pbsPath, LPCWSTR pszPath, LPWSTR pszFile)
{
	BSTR bsPath = teSysAllocStringLen(pszPath, lstrlen(pszPath) + lstrlen(pszFile) + 1);
	PathAppend(bsPath, pszFile);
	*pbsPath = ::SysAllocString(bsPath);
	teSysFreeString(&bsPath);
}

HRESULT teGetStorageFromPath(LPCWSTR lpPath, REFIID riid, void **ppvOut)
{
	HRESULT hr = E_FAIL;
	LPITEMIDLIST pidl = ILCreateFromPath(const_cast<LPWSTR>(lpPath));
	if (pidl) {
		LPCITEMIDLIST pidlPart;
		IShellFolder *pSF;
		hr = SHBindToParent(pidl, IID_PPV_ARGS(&pSF), &pidlPart);
		if SUCCEEDED(hr) {
			hr = pSF->BindToStorage(pidlPart, NULL, riid, ppvOut);
			pSF->Release();
		}
		::CoTaskMemFree(pidl);
	}
	return hr;
}

int __stdcall win_sqlite3_callback(void *pArg, int argc, char **argv, char **columnNames)
{
	if (argc) {
		BSTR *pbsImage = (BSTR *)pArg;
		*pbsImage = teAnsi2Wide(argv[0], CP_UTF8);
	}
	return SQLITE_OK;
}

int __cdecl sqlite3_callback(void *pArg, int argc, char **argv, char **columnNames)
{
	if (argc) {
		BSTR *pbsImage = (BSTR *)pArg;
		*pbsImage = teAnsi2Wide(argv[0], CP_UTF8);
	}
	return SQLITE_OK;
}

HRESULT teGetImageFromDB(IStream *pStream, LPCWSTR lpPath, int cx, HBITMAP *phBM, int *pnAlpha)
{
	HRESULT hr = E_NOTIMPL;
	LPSTR bsPathA = teWide2Ansi((LPWSTR)lpPath, -1, CP_UTF8);
	int nLen = strlen(bsPathA) + 99;
	LPSTR bsSQLA = (LPSTR)::SysAllocStringByteLen(NULL, nLen);
	strcpy_s(bsSQLA, nLen, "SELECT image FROM db WHERE folder=\"");
	strcat_s(bsSQLA, nLen, bsPathA);
	strcat_s(bsSQLA, nLen, "\";");
	BSTR bsImage = NULL;
	int iResult;
	if (g_bWinSQLite3) {
		iResult = ((LPFN_win_sqlite3_exec)sqlite3_exec)(g_pSQLite3, bsSQLA, win_sqlite3_callback, &bsImage, NULL);
	} else {
		iResult = ((LPFN_sqlite3_exec)sqlite3_exec)(g_pSQLite3, bsSQLA, sqlite3_callback, &bsImage, NULL);
	}
	if (iResult == SQLITE_OK && bsImage) {
		if (lstrcmp(bsImage, L"-")) {
			IStream *pStreamImage;
			if SUCCEEDED(teGetStorageFromPath(bsImage, IID_PPV_ARGS(&pStreamImage))) {
				hr = lpfnGetImage(pStreamImage, bsImage, cx, phBM, pnAlpha);
				pStreamImage->Release();
			}
		} else {
			hr = E_ABORT;
		}
	}
	teSysFreeString(&bsImage);
	teFreeAnsiString(&bsSQLA);
	teFreeAnsiString(&bsPathA);
	return hr;
}

VOID teSetImageIntoDB(LPCWSTR lpPath, LPWSTR lpImage)
{
	LPSTR bsFolderA = teWide2Ansi((LPWSTR)lpPath, -1, CP_UTF8);
	LPSTR bsImageA = teWide2Ansi((LPWSTR)lpImage, -1, CP_UTF8);
	int nLen = strlen(bsFolderA) + strlen(bsImageA) + 99;
	LPSTR bsSQLA = (LPSTR)::SysAllocStringByteLen(NULL, nLen);
	strcpy_s(bsSQLA, nLen, "INSERT OR REPLACE INTO db (folder, image) VALUES (\"");
	strcat_s(bsSQLA, nLen, bsFolderA);
	strcat_s(bsSQLA, nLen, "\", \"");
	strcat_s(bsSQLA, nLen, bsImageA);
	strcat_s(bsSQLA, nLen, "\");");
	if (g_bWinSQLite3) {
		((LPFN_win_sqlite3_exec)sqlite3_exec)(g_pSQLite3, bsSQLA, NULL, NULL, NULL);
	} else {
		((LPFN_sqlite3_exec)sqlite3_exec)(g_pSQLite3, bsSQLA, NULL, NULL, NULL);
	}
	teFreeAnsiString(&bsImageA);
	teFreeAnsiString(&bsFolderA);
	teFreeAnsiString(&bsSQLA);
}

// Initialize & Finalize
BOOL WINAPI DllMain(HINSTANCE hinstDll, DWORD dwReason, LPVOID lpReserved)
{
	switch (dwReason) {
	case DLL_PROCESS_ATTACH:
		break;
	case DLL_PROCESS_DETACH:
		teSysFreeString(&g_bsFilter);
		teSysFreeString(&g_bsInvalid);
		break;
	}
	return TRUE;
}

//GetImage
HRESULT WINAPI GetImage(IStream *pStream, LPCWSTR lpPath, int cx, HBITMAP *phBM, int *pnAlpha)
{
	InterlockedIncrement(&g_lLocks);
	HRESULT hr = E_NOTIMPL;
	IProgressDialog *ppd = NULL;
	if (g_dwMainThreadId == GetCurrentThreadId()) {
		CoCreateInstance(CLSID_ProgressDialog, NULL, CLSCTX_INPROC_SERVER | CLSCTX_LOCAL_SERVER, IID_PPV_ARGS(&ppd));
		if (ppd) {
			ppd->StartProgressDialog(g_hwndMain, NULL, PROGDLG_NORMAL, NULL);
		}
	}
	try {
		if (lpfnGetImage && PathMatchSpec(lpPath, L"?:\\*;\\\\*\\*")) {
			if (ppd) {
				ppd->SetTitle(lpPath);
			}
			TEFOLDER TEFolder;
			if SUCCEEDED(teGetStorageFromPath(lpPath, IID_PPV_ARGS(&TEFolder.pStorage))) {
				int nDog = g_nItems;
				std::deque<TEFOLDER> ppFolder;
				TEFolder.bsPath = sqlite3_exec ? ::SysAllocString(lpPath) : NULL;
				ppFolder.push_back(TEFolder);
				if (sqlite3_exec) {
					hr = teGetImageFromDB(pStream, lpPath, cx, phBM, pnAlpha);
					if (hr == S_OK || hr == E_ABORT) {
						nDog = 0;
					}
				}
				while (!ppFolder.empty()) {
					TEFolder = ppFolder.front();
					ppFolder.pop_front();
					if (nDog) {
						STATSTG statstg;
						if (ppd) {
							if SUCCEEDED(TEFolder.pStorage->Stat(&statstg, STATFLAG_DEFAULT)) {
								ppd->SetLine(1, statstg.pwcsName, true, NULL);
							}
							if (ppd->HasUserCancelled()) {
								nDog = 0;
								break;
							}
						}
						IEnumSTATSTG *pEnumSTATSTG = NULL;
						IStream *pStreamNew;
						if SUCCEEDED(TEFolder.pStorage->EnumElements(NULL, NULL, NULL, &pEnumSTATSTG)) {
							while (FAILED(hr) && pEnumSTATSTG->Next(1, &statstg, NULL) == S_OK) {
								if (ppd) {
									ppd->SetLine(2, statstg.pwcsName, true, NULL);
									ppd->SetProgress(g_nItems - nDog, g_nItems);
									if (ppd->HasUserCancelled()) {
										nDog = 0;
										break;
									}
								}
								if (statstg.type == STGTY_STORAGE) {
									if (g_bExpanded && statstg.cbSize.QuadPart == 0) {
										TEFOLDER NewFolder;
										NewFolder.bsPath = NULL;
										if (sqlite3_exec) {
											tePathAppend(&NewFolder.bsPath, TEFolder.bsPath, statstg.pwcsName);
											hr = teGetImageFromDB(pStream, lpPath, cx, phBM, pnAlpha);
											if (hr == S_OK || hr == E_ABORT) {
												teSysFreeString(&NewFolder.bsPath);
												nDog = 0;
												break;
											}
										}
										if SUCCEEDED(TEFolder.pStorage->OpenStorage(statstg.pwcsName, NULL, STGM_READ, 0, 0, &NewFolder.pStorage)) {
											ppFolder.push_back(NewFolder);
										} else {
											teSysFreeString(&NewFolder.bsPath);
										}
									}
								} else if (statstg.type == STGTY_STREAM) {
									if (PathMatchSpec(statstg.pwcsName, g_bsFilter) && !PathMatchSpec(statstg.pwcsName, g_bsInvalid)) {
										if SUCCEEDED(TEFolder.pStorage->OpenStream(statstg.pwcsName, NULL, STGM_READ, NULL, &pStreamNew)) {
											hr = lpfnGetImage(pStreamNew, statstg.pwcsName, cx, phBM, pnAlpha);
											if (hr == S_OK) {
												nDog = 0;
												if (sqlite3_exec) {
													BSTR bsImage;
													tePathAppend(&bsImage, TEFolder.bsPath, statstg.pwcsName);
													teSetImageIntoDB(lpPath, bsImage);
													teSysFreeString(&bsImage);
												}
											}
											pStreamNew->Release();
										}
									}
								}
								if (nDog == 0) {
									break;
								}
								nDog--;
							}
						}
					}
					SafeRelease(&TEFolder.pStorage);
					teSysFreeString(&TEFolder.bsPath);
				}
				if (nDog && sqlite3_exec) {
					teSetImageIntoDB(lpPath, L"-");
				}
			}
		}
	} catch (...) {}
	if (ppd) {
		ppd->StopProgressDialog();
		ppd->Release();
	}
	InterlockedDecrement(&g_lLocks);
	return hr;
}

// DLL Export
STDAPI DllCanUnloadNow(void)
{
	return g_lLocks == 0 ? S_OK : S_FALSE;
}

//Option
void __stdcall SetGetImageW(HWND hwnd, HINSTANCE hinst, LPWSTR lpszCmdLine, int nCmdShow)
{
	g_hwndMain = hwnd;
#ifdef _WIN64
	swscanf_s(lpszCmdLine, L"%llx", &lpfnGetImage);
#else
	swscanf_s(lpszCmdLine, L"%lx", &lpfnGetImage);
#endif
}

void __stdcall SetItemsW(HWND hwnd, HINSTANCE hinst, LPWSTR lpszCmdLine, int nCmdShow)
{
	swscanf_s(lpszCmdLine, L"%ld", &g_nItems);
}

void __stdcall SetExpandedW(HWND hwnd, HINSTANCE hinst, LPWSTR lpszCmdLine, int nCmdShow)
{
	swscanf_s(lpszCmdLine, L"%ld", &g_bExpanded);
}

void __stdcall SetFilterW(HWND hwnd, HINSTANCE hinst, LPWSTR lpszCmdLine, int nCmdShow)
{
	teSysFreeString(&g_bsFilter);
	g_bsFilter = ::SysAllocString(lpszCmdLine);
}

void __stdcall SetInvalidW(HWND hwnd, HINSTANCE hinst, LPWSTR lpszCmdLine, int nCmdShow)
{
	teSysFreeString(&g_bsInvalid);
	g_bsInvalid = ::SysAllocString(lpszCmdLine);
}

void __stdcall OpenSQLite3W(HWND hwnd, HINSTANCE hinst, LPWSTR lpszCmdLine, int nCmdShow)
{
	g_hSQLite3 = LoadLibrary(lpszCmdLine);
	if (!g_hSQLite3) {
		return;
	}
	sqlite3_open = GetProcAddress(g_hSQLite3, "sqlite3_open");
	sqlite3_close = GetProcAddress(g_hSQLite3, "sqlite3_close");
	sqlite3_exec = GetProcAddress(g_hSQLite3, "sqlite3_exec");
	g_bWinSQLite3 = PathMatchSpec(lpszCmdLine, L"*winsqlite3.dll");
}

void __stdcall CloseSQLite3W(HWND hwnd, HINSTANCE hinst, LPWSTR lpszCmdLine, int nCmdShow)
{
	if (g_pSQLite3) {
		if (g_bWinSQLite3) {
			((LPFN_win_sqlite3_close)sqlite3_close)(g_pSQLite3);
		} else {
			((LPFN_sqlite3_close)sqlite3_close)(g_pSQLite3);
		}
		g_pSQLite3 = NULL;
	}
	sqlite3_open = NULL;
	sqlite3_close = NULL;
	sqlite3_exec = NULL;
	if (g_hSQLite3) {
		FreeLibrary(g_hSQLite3);
		g_hSQLite3 = NULL;
	}
}

void __stdcall OpenDBFileW(HWND hwnd, HINSTANCE hinst, LPWSTR lpszCmdLine, int nCmdShow)
{
	if (!sqlite3_open) {
		return;
	}
	LPSTR lpFile = teWide2Ansi(lpszCmdLine, -1, CP_UTF8);
	if (lpFile) {
		try {
			int iResult;
			if (g_bWinSQLite3) {
				iResult = ((LPFN_win_sqlite3_open)sqlite3_open)(lpFile, &g_pSQLite3);
			} else {
				iResult = ((LPFN_sqlite3_open)sqlite3_open)(lpFile, &g_pSQLite3);
			}
			if (iResult != SQLITE_OK) {
				sqlite3_exec = NULL;
			}
		} catch (...) {
			sqlite3_exec = NULL;
		}
		teFreeAnsiString(&lpFile);
	}
}

void __stdcall ExecSQLite3W(HWND hwnd, HINSTANCE hinst, LPWSTR lpszCmdLine, int nCmdShow)
{
	if (!sqlite3_exec) {
		return;
	}
	LPSTR lpExec = teWide2Ansi(lpszCmdLine, -1, CP_UTF8);
	if (lpExec) {
		if (g_bWinSQLite3) {
			((LPFN_win_sqlite3_exec)sqlite3_exec)(g_pSQLite3, lpExec, NULL, NULL, NULL);
		} else {
			((LPFN_sqlite3_exec)sqlite3_exec)(g_pSQLite3, lpExec, NULL, NULL, NULL);
		}
		teFreeAnsiString(&lpExec);
	}
}
