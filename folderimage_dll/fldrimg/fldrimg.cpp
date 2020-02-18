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
			LPITEMIDLIST pidl = ILCreateFromPath(const_cast<LPWSTR>(lpPath));
			if (pidl) {
				LPCITEMIDLIST pidlPart;
				IShellFolder *pSF;
				if SUCCEEDED(SHBindToParent(pidl, IID_PPV_ARGS(&pSF), &pidlPart)) {
					IStorage *pStorage;
					if SUCCEEDED(pSF->BindToStorage(pidlPart, NULL, IID_PPV_ARGS(&pStorage))) {
						std::deque<IStorage *> ppFolder;
						ppFolder.push_back(pStorage);
						int nDog = g_nItems;
						while (!ppFolder.empty()) {
							pStorage = ppFolder.front();
							ppFolder.pop_front();
							if (nDog) {
								STATSTG statstg;
								if (ppd) {
									if SUCCEEDED(pStorage->Stat(&statstg, STATFLAG_DEFAULT)) {
										ppd->SetLine(1, statstg.pwcsName, true, NULL);
									}
									if (ppd->HasUserCancelled()) {
										nDog = 0;
										break;
									}
								}
								IEnumSTATSTG *pEnumSTATSTG = NULL;
								IStream *pStreamNew;
								if SUCCEEDED(pStorage->EnumElements(NULL, NULL, NULL, &pEnumSTATSTG)) {
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
												IStorage *pStorageNew;
												pStorage->OpenStorage(statstg.pwcsName, NULL, STGM_READ, 0, 0, &pStorageNew);
												ppFolder.push_back(pStorageNew);
											}
										} else if (statstg.type == STGTY_STREAM) {
											if (PathMatchSpec(statstg.pwcsName, g_bsFilter) && !PathMatchSpec(statstg.pwcsName, g_bsInvalid)) {
												if SUCCEEDED(pStorage->OpenStream(statstg.pwcsName, NULL, STGM_READ, NULL, &pStreamNew)) {
													hr = lpfnGetImage(pStreamNew, statstg.pwcsName, cx, phBM, pnAlpha);
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
							pStorage->Release();
						}
					}
					pSF->Release();
				}
				CoTaskMemFree(pidl);
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
