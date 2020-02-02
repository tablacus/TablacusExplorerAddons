// Tablacus Archive image (C)2020 Gaku
// MIT Lisence
// Visual C++ 2017 Express Edition
// Windows SDK v7.1
// https://tablacus.github.io/

#include "resource.h"
#include "fldrimg.h"

LPFNGetImage lpfnGetImage = NULL;
int	g_nItems = 100;
BOOL g_bExpanded = TRUE;
LPWSTR g_bsFilter = NULL;
LPWSTR g_bsInvalid = NULL;

//LPWSTR g_psz

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
	HRESULT hr = E_NOTIMPL;
	if (lpfnGetImage && PathMatchSpec(lpPath, L"?:\\*;\\\\*\\*")) {
		LPITEMIDLIST pidl = ILCreateFromPath(const_cast<LPWSTR>(lpPath));
		if (pidl) {
			LPCITEMIDLIST pidlPart;
			IShellFolder *pSF;
			if SUCCEEDED(SHBindToParent(pidl, IID_PPV_ARGS(&pSF), &pidlPart)) {
				IStorage *pStorage;
				if SUCCEEDED(pSF->BindToStorage(pidlPart, NULL, IID_PPV_ARGS(&pStorage))) {
					std::list<IStorage *> ppFolder;
					ppFolder.push_back(pStorage);
					int nDog = g_nItems;
					while (!ppFolder.empty()) {
						pStorage = ppFolder.front();
						ppFolder.pop_front();
						if (nDog) {
							STATSTG statstg;
							IEnumSTATSTG *pEnumSTATSTG = NULL;
							IStream *pStreamNew;
							if SUCCEEDED(pStorage->EnumElements(NULL, NULL, NULL, &pEnumSTATSTG)) {
								while (FAILED(hr) && pEnumSTATSTG->Next(1, &statstg, NULL) == S_OK && nDog) {
									if (statstg.type == STGTY_STORAGE) {
										if (g_bExpanded) {
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
									if (nDog) {
										nDog--;
									}
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
	return hr;
}

//Option
void __stdcall SetGetImageW(HWND hwnd, HINSTANCE hinst, LPWSTR lpszCmdLine, int nCmdShow)
{
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