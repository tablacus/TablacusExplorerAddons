// Tablacus Thumbnail engine (C)2020 Gaku
// MIT Lisence
// Visual C++ 2017 Express Edition
// Windows SDK v7.1
// https://tablacus.github.io/

#include "resource.h"
#include "thumb.h"

LPWSTR g_bsFilter = NULL;
LPWSTR g_bsInvalid = NULL;
int g_nSize = 1024;
BOOL g_bFolder = TRUE;
BOOL g_bTP = TRUE;
BOOL g_bEI = TRUE;

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
HRESULT WINAPI GetImage(IStream *pStream, LPWSTR lpszPath, int cx, HBITMAP *phBM, int *pnAlpha)
{
	IThumbnailProvider *pTP;
	IInitializeWithStream *pInitStream;
	HRESULT hr = E_NOTIMPL;
	BOOL bFile = PathMatchSpec(lpszPath, g_bsFilter) && !PathMatchSpec(lpszPath, g_bsInvalid);
	if (bFile && g_bTP) { 
		hr = CoCreateInstance(CLSID_PhotoThumbnailProvider, NULL, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&pInitStream));
		if SUCCEEDED(hr) {
			hr = pInitStream->Initialize(pStream, STGM_READ);
			if SUCCEEDED(hr) {
				hr = pInitStream->QueryInterface(IID_PPV_ARGS(&pTP));
				if SUCCEEDED(hr) {
					WTS_ALPHATYPE alphaType = WTSAT_RGB;
					hr = pTP->GetThumbnail(cx ? cx : g_nSize, phBM, &alphaType);
					pTP->Release();
					*pnAlpha = alphaType == WTSAT_ARGB ? 0 : 2;
				}
			}
			pInitStream->Release();
		}
	}
	if (hr != S_OK && PathMatchSpec(lpszPath, L"?:\\*;\\\\*\\*")) {
		LPITEMIDLIST pidl = ILCreateFromPath(lpszPath);
		if (pidl) {
			SIZE size;
			size.cx = cx ? cx : g_nSize;
			IShellFolder *pSF;
			LPCITEMIDLIST pidlPart;
			if SUCCEEDED(SHBindToParent(pidl, IID_PPV_ARGS(&pSF), &pidlPart)) {
				SFGAOF sfAttr = SFGAO_FOLDER;
				if SUCCEEDED(pSF->GetAttributesOf(1, &pidlPart, &sfAttr)) {
					sfAttr &= SFGAO_FOLDER;
					if (sfAttr ? g_bFolder : bFile) {
						IExtractImage *pEI;
						IThumbnailProvider *pTP;
						if (g_bTP && pSF->GetUIObjectOf(NULL, 1, &pidlPart, IID_IThumbnailProvider, NULL, (void **)&pTP) == S_OK) {
							WTS_ALPHATYPE alphaType = WTSAT_RGB;
							hr = pTP->GetThumbnail(size.cx, phBM, &alphaType);
							pTP->Release();
							*pnAlpha = alphaType == WTSAT_ARGB ? 0 : 2;
						} else if (g_bEI && pSF->GetUIObjectOf(NULL, 1, &pidlPart, IID_IExtractImage, NULL, (void **)&pEI) == S_OK) {
							size.cy = size.cx;
							DWORD dwFlags = cx ? IEIFLAG_SCREEN : IEIFLAG_ASPECT | IEIFLAG_ORIGSIZE | IEIFLAG_QUALITY;
							WCHAR pszPath[MAX_PATH];
							hr = pEI->GetLocation(pszPath, MAX_PATH, NULL, &size, 24, &dwFlags);
							//Fix for Acrobat Reader DC
							if (FAILED(hr) && size.cx > 512) {
								size.cx = 512;
								size.cy = size.cx;
								pEI->GetLocation(pszPath, MAX_PATH, NULL, &size, 24, &dwFlags);
							}
							hr = pEI->Extract(phBM);
							pEI->Release();
							if (hr == S_OK) {
								*pnAlpha = sfAttr ? 0 : 2;
							}
						}
					}
				}
				pSF->Release();
			}
			::CoTaskMemFree(pidl);
		}
	}
	return hr;
}

//Options
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

void __stdcall SetSizeW(HWND hwnd, HINSTANCE hinst, LPWSTR lpszCmdLine, int nCmdShow)
{
	swscanf_s(lpszCmdLine, L"%ld", &g_nSize);
}

void __stdcall SetFolderW(HWND hwnd, HINSTANCE hinst, LPWSTR lpszCmdLine, int nCmdShow)
{
	swscanf_s(lpszCmdLine, L"%ld", &g_bFolder);
}

void __stdcall SetTPW(HWND hwnd, HINSTANCE hinst, LPWSTR lpszCmdLine, int nCmdShow)
{
	swscanf_s(lpszCmdLine, L"%ld", &g_bTP);
}

void __stdcall SetEIW(HWND hwnd, HINSTANCE hinst, LPWSTR lpszCmdLine, int nCmdShow)
{
	swscanf_s(lpszCmdLine, L"%ld", &g_bEI);
}