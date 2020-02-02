// Tablacus Archive image (C)2020 Gaku
// MIT Lisence
// Visual C++ 2017 Express Edition
// Windows SDK v7.1
// https://tablacus.github.io/

#include "resource.h"
#include "arcimg.h"

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

HRESULT teCreateInstance(CLSID clsid, LPWSTR lpszDllFile, HMODULE *phDll, REFIID riid, PVOID *ppvObj)
{
	*ppvObj = NULL;
	HMODULE hDll = NULL;
	HRESULT hr = CoCreateInstance(clsid, NULL, CLSCTX_INPROC_SERVER | CLSCTX_LOCAL_SERVER, riid, ppvObj);
	if FAILED(hr) {
		hDll = LoadLibrary(lpszDllFile);
		if (hDll) {
			LPFNDllGetClassObject lpfnDllGetClassObject = (LPFNDllGetClassObject)GetProcAddress(hDll, "DllGetClassObject");
			if (lpfnDllGetClassObject) {
				IClassFactory *pCF;
				hr = lpfnDllGetClassObject(clsid, IID_PPV_ARGS(&pCF));
				if (hr == S_OK) {
					hr = pCF->CreateInstance(NULL, riid, ppvObj);
					pCF->Release();
					if (hr == S_OK && phDll) {
						*phDll = hDll;
					}
				}
			} else {
				FreeLibrary(hDll);
			}
		}
	}
	return hr;
}

HRESULT teInitStorage(LPCWSTR lpArcPath, HMODULE *phDll, IStorage **ppStorage)
{
	HRESULT hr = E_FAIL;
	WCHAR pszDllFile[MAX_PATH * 2];
	GetSystemDirectory(pszDllFile, MAX_PATH);
	PathAppend(pszDllFile, L"zipfldr.dll");
	if SUCCEEDED(teCreateInstance(CLSID_CompressedFolder, pszDllFile, phDll, IID_PPV_ARGS(ppStorage))) {
		IPersistFile *pPF;
		hr = (*ppStorage)->QueryInterface(IID_PPV_ARGS(&pPF));
		if SUCCEEDED(hr) {
			hr = pPF->Load(lpArcPath, STGM_READ);
			pPF->Release();
		} else {
			IPersistFolder *pPF2;
			hr = (*ppStorage)->QueryInterface(IID_PPV_ARGS(&pPF2));
			if SUCCEEDED(hr) {
				LPITEMIDLIST pidl = ILCreateFromPath(const_cast<LPWSTR>(lpArcPath));
				if (pidl) {
					hr = pPF2->Initialize(pidl);
					::CoTaskMemFree(pidl);
				}
				pPF2->Release();
			}
		}
	}
	return hr;
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

//GetArchive
HRESULT WINAPI GetArchive(LPCWSTR lpszArcPath, LPCWSTR lpszItem, IStream **ppStream, LPVOID lpReserved)
{
	IStorage *pStorage = NULL;
	HMODULE hDll = NULL;
	HRESULT hr = teInitStorage(lpszArcPath, &hDll, &pStorage);
	if SUCCEEDED(hr) {
		LPWSTR lpPath;
		LPCWSTR lpPath1 = lpszItem;
		while (lpPath = StrChr(lpPath1, '\\')) {
			lpPath[0] = NULL;
			IStorage *pStorageNew;
			pStorage->OpenStorage(lpPath1, NULL, STGM_READ, 0, 0, &pStorageNew);
			if (pStorageNew) {
				pStorage->Release();
				pStorage = pStorageNew;
			} else {
				break;
			}
			lpPath1 = lpPath + 1;
		}
		hr = pStorage->OpenStream(lpPath1, NULL, STGM_READ, NULL, ppStream);
	}
	SafeRelease(&pStorage);
	if (hDll) {
		FreeLibrary(hDll);
	}
	return hr;
}
