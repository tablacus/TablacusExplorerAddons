// Tablacus Prevent auto arrange (C)2021 Gaku
// MIT Lisence
// Visual C++ 2017 Express Edition
// 32-bit Visual Studio 2015 - Windows XP (v140_xp)
// 64-bit Visual Studio 2017 (v141)
// https://tablacus.github.io/

#include "resource.h"
#include "tsaa.h"

// Unit

VOID teInsert(std::vector<LPITEMIDLIST> *pppidl, IShellFolder2 *pSF, LPITEMIDLIST pidl)
{
	int nPos = pppidl->size();
	pppidl->push_back(NULL);
	int nMin = 0;
	int nMax = nPos - 1;
	int nIndex;
	while (nMin <= nMax) {
		nIndex = (nMin + nMax) / 2;
		if ((short)(pSF->CompareIDs(0, pidl, pppidl->at(nIndex))) < 0) {
			nMax = nIndex - 1;
		} else {
			nMin = nIndex + 1;
		}
	}
	for (int i = nPos; i > nMin; --i) {
		pppidl->at(i) = pppidl->at(i - 1);
	}
	pppidl->at(nMin) = pidl;
}

int teBSearchIDList(std::vector<LPITEMIDLIST> *pppidl, IShellFolder *pSF, LPITEMIDLIST pidl)
{
	int nMin = 0;
	int nMax = pppidl->size() - 1;
	int nIndex;
	short nCC;

	while (nMin <= nMax) {
		nIndex = (nMin + nMax) / 2;
		nCC = (short)(pSF->CompareIDs(0, pidl, pppidl[0][nIndex]));
		if (nCC < 0) {
			nMax = nIndex - 1;
			continue;
		}
		if (nCC > 0) {
			nMin = nIndex + 1;
			continue;
		}
		return nIndex;
	}
	return -1;
}

// Initialize & Finalize
BOOL WINAPI DllMain(HINSTANCE hinstDll, DWORD dwReason, LPVOID lpReserved)
{
	switch (dwReason) {
	case DLL_PROCESS_ATTACH:
		break;
	case DLL_PROCESS_DETACH:
		break;
	}
	return TRUE;
}

//GetImage
HRESULT WINAPI MessageSFVCB(ICommDlgBrowser2 *pSB, IShellFolder2 *pSF2, IShellView *pSV, UINT uMsg, WPARAM wParam, LPARAM lParam)
{
	if (uMsg == SFVM_FSNOTIFY) {
		if (lParam & (SHCNE_UPDATEDIR | SHCNE_UPDATEITEM)) {
			IShellFolderView *pSFV;
			if SUCCEEDED(pSV->QueryInterface(IID_PPV_ARGS(&pSFV))) {
				SHCONTF grfFlags = SHCONTF_FOLDERS | SHCONTF_NONFOLDERS | SHCONTF_INCLUDEHIDDEN;
				HKEY hKey;
				if (RegOpenKeyExA(HKEY_CURRENT_USER, "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced", 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
					DWORD dwData;
					DWORD dwSize = sizeof(DWORD);
					if (RegQueryValueExA(hKey, "ShowSuperHidden", NULL, NULL, (LPBYTE)&dwData, &dwSize) == S_OK) {
						if (dwData) {
							grfFlags |= SHCONTF_INCLUDESUPERHIDDEN;
						}
					}
				}
				std::vector<LPITEMIDLIST> ppidl;
				ppidl.reserve(65536);
				IEnumIDList *peidl;
				if SUCCEEDED(pSF2->EnumObjects(NULL, grfFlags, &peidl)) {
					LPITEMIDLIST pidl = NULL;
					while (peidl->Next(1, &pidl, NULL) == S_OK) {
						teInsert(&ppidl, pSF2, pidl);
					}
					peidl->Release();
				}
				HWND hwnd = NULL;
				IUnknown_GetWindow(pSB, &hwnd);
				SendMessage(hwnd, WM_SETREDRAW, FALSE, 0);
				UINT uItems = 0;
				if SUCCEEDED(pSFV->GetObjectCount(&uItems)) {
					for (int i = uItems; --i >= 0;) {
						LPITEMIDLIST pidl = NULL;
						if SUCCEEDED(pSFV->GetObjectW(&pidl, i)) {
							if (teBSearchIDList(&ppidl, pSF2, pidl) < 0) {
								UINT u;
								pSFV->RemoveObject(pidl, &u);
							}
							::CoTaskMemFree(pidl);
						}
					}
				}
				for (size_t i = 0; i < ppidl.size(); ++i) {
					LPITEMIDLIST pidl = ppidl[i];
					UINT u = (UINT)-1;
					if FAILED(pSFV->UpdateObject(pidl, pidl, &u)) {
						u = (UINT)-1;
					}
					if (u == (UINT)-1) {
						pSFV->AddObject(pidl, &u);
					}
					::CoTaskMemFree(pidl);
				}
				SendMessage(hwnd, WM_SETREDRAW, TRUE, 0);
				pSFV->Release();
				return S_FALSE;
			}
		}
	}
	return S_OK;
}
