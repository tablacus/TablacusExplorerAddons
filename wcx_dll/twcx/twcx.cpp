// Tablacus Total Commander Packer Plugin (C)2016 Gaku
// MIT Lisence
// Visual C++ 2017 Express Edition
// 32-bit Visual Studio 2015 - Windows XP (v140_xp)
// 64-bit Visual Studio 2017 (v141)
// https://tablacus.github.io/

#include "twcx.h"

// Global Variables:
const TCHAR g_szProgid[] = TEXT("Tablacus.TotalCommanderPackerPlugin");
const TCHAR g_szClsid[] = TEXT("{56297D71-E778-4dfd-8678-6F4079A2BC50}");
HINSTANCE	g_hinstDll = NULL;
LONG		g_lLocks = 0;
CteBase		*g_pBase = NULL;
std::vector <CteWCX	*> g_ppObject;
IDispatch	*g_pdispChangeVolProc = NULL;
IDispatch	*g_pdispProcessDataProc = NULL;

std::unordered_map<std::wstring, DISPID> g_umBASE = {
	{ L"Open", 0x60010000 },
	{ L"Close", 0x6001000C },
};

std::unordered_map<std::wstring, DISPID> g_umWCX = {
	{ L"OpenArchive", 0x60010001 },
	{ L"ReadHeaderEx", 0x60010002 },
	{ L"ProcessFile", 0x60010003 },
	{ L"CloseArchive", 0x60010004 },
	{ L"PackFiles", 0x60010005 },
	{ L"DeleteFiles", 0x60010006 },
	{ L"CanYouHandleThisFile", 0x60010007 },
	{ L"ConfigurePacker", 0x60010008 },
	{ L"SetChangeVolProc", 0x60010009 },
	{ L"SetProcessDataProc", 0x6001000A },
	{ L"PackSetDefaultParams", 0x6001000B },
	{ L"Close", 0x6001000C },
	{ L"IsUnicode", 0x4001FFFF },
};

// Unit
VOID SafeRelease(PVOID ppObj)
{
	try {
		IUnknown **ppunk = static_cast<IUnknown **>(ppObj);
		if (*ppunk) {
			(*ppunk)->Release();
			*ppunk = NULL;
		}
	} catch (...) {
	}
}

VOID teGetProcAddress(HMODULE hModule, LPSTR lpName, FARPROC *lpfnA, FARPROC *lpfnW)
{
	*lpfnA = GetProcAddress(hModule, lpName);
	if (lpfnW) {
		char pszProcName[80];
		strcpy_s(pszProcName, 80, lpName);
		strcat_s(pszProcName, 80, "W");
		*lpfnW = GetProcAddress(hModule, (LPCSTR)pszProcName);
	}
}

void LockModule(BOOL bLock)
{
	if (bLock) {
		InterlockedIncrement(&g_lLocks);
	} else {
		InterlockedDecrement(&g_lLocks);
	}
}

HRESULT ShowRegError(LSTATUS ls)
{
	LPTSTR lpBuffer = NULL;
	FormatMessage(FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_FROM_SYSTEM,  
		NULL, ls, LANG_USER_DEFAULT, (LPTSTR)&lpBuffer, 0, NULL);  
	MessageBox(NULL, lpBuffer, TEXT(PRODUCTNAME), MB_ICONHAND | MB_OK);  
	LocalFree(lpBuffer);
	return HRESULT_FROM_WIN32(ls);
}

LSTATUS CreateRegistryKey(HKEY hKeyRoot, LPTSTR lpszKey, LPTSTR lpszValue, LPTSTR lpszData)
{
	HKEY  hKey;
	LSTATUS  lr;
	DWORD dwSize;

	lr = RegCreateKeyEx(hKeyRoot, lpszKey, 0, NULL, REG_OPTION_NON_VOLATILE, KEY_WRITE, NULL, &hKey, NULL);
	if (lr == ERROR_SUCCESS) {
		if (lpszData != NULL) {
			dwSize = (lstrlen(lpszData) + 1) * sizeof(TCHAR);
		} else {
			dwSize = 0;
		}
		lr = RegSetValueEx(hKey, lpszValue, 0, REG_SZ, (LPBYTE)lpszData, dwSize);
		RegCloseKey(hKey);
	}
	return lr;
}

BSTR GetLPWSTRFromVariant(VARIANT *pv)
{
	if (pv->vt == (VT_VARIANT | VT_BYREF)) {
		return GetLPWSTRFromVariant(pv->pvarVal);
	}
	switch (pv->vt) {
		case VT_BSTR:
		case VT_LPWSTR:
			return pv->bstrVal;
		default:
			return NULL;
	}//end_switch
}

int GetIntFromVariant(VARIANT *pv)
{
	if (pv) {
		if (pv->vt == (VT_VARIANT | VT_BYREF)) {
			return GetIntFromVariant(pv->pvarVal);
		}
		if (pv->vt == VT_I4) {
			return pv->lVal;
		}
		if (pv->vt == VT_UI4) {
			return pv->ulVal;
		}
		if (pv->vt == VT_R8) {
			return (int)(LONGLONG)pv->dblVal;
		}
		VARIANT vo;
		VariantInit(&vo);
		if SUCCEEDED(VariantChangeType(&vo, pv, 0, VT_I4)) {
			return vo.lVal;
		}
		if SUCCEEDED(VariantChangeType(&vo, pv, 0, VT_UI4)) {
			return vo.ulVal;
		}
		if SUCCEEDED(VariantChangeType(&vo, pv, 0, VT_I8)) {
			return (int)vo.llVal;
		}
	}
	return 0;
}

int GetIntFromVariantClear(VARIANT *pv)
{
	int i = GetIntFromVariant(pv);
	VariantClear(pv);
	return i;
}

#ifdef _WIN64
LONGLONG GetLLFromVariant(VARIANT *pv)
{
	if (pv) {
		if (pv->vt == (VT_VARIANT | VT_BYREF)) {
			return GetLLFromVariant(pv->pvarVal);
		}
		if (pv->vt == VT_I4) {
			return pv->lVal;
		}
		if (pv->vt == VT_R8) {
			return (LONGLONG)pv->dblVal;
		}
		if (pv->vt == (VT_ARRAY | VT_I4)) {
			LONGLONG ll = 0;
			PVOID pvData;
			if (::SafeArrayAccessData(pv->parray, &pvData) == S_OK) {
				::CopyMemory(&ll, pvData, sizeof(LONGLONG));
				::SafeArrayUnaccessData(pv->parray);
				return ll;
			}
		}
		VARIANT vo;
		VariantInit(&vo);
		if SUCCEEDED(VariantChangeType(&vo, pv, 0, VT_I8)) {
			return vo.llVal;
		}
	}
	return 0;
}
#endif

VOID teSetBool(VARIANT *pv, BOOL b)
{
	if (pv) {
		pv->boolVal = b ? VARIANT_TRUE : VARIANT_FALSE;
		pv->vt = VT_BOOL;
	}
}

VOID teSysFreeString(BSTR *pbs)
{
	if (*pbs) {
		::SysFreeString(*pbs);
		*pbs = NULL;
	}
}

VOID teSetLong(VARIANT *pv, LONG i)
{
	if (pv) {
		pv->lVal = i;
		pv->vt = VT_I4;
	}
}

VOID teSetLL(VARIANT *pv, LONGLONG ll)
{
	if (pv) {
		pv->lVal = static_cast<int>(ll);
		if (ll == static_cast<LONGLONG>(pv->lVal)) {
			pv->vt = VT_I4;
			return;
		}
		pv->dblVal = static_cast<DOUBLE>(ll);
		if (ll == static_cast<LONGLONG>(pv->dblVal)) {
			pv->vt = VT_R8;
			return;
		}
		SAFEARRAY *psa;
		psa = SafeArrayCreateVector(VT_I4, 0, sizeof(LONGLONG) / sizeof(int));
		if (psa) {
			PVOID pvData;
			if (::SafeArrayAccessData(psa, &pvData) == S_OK) {
				::CopyMemory(pvData, &ll, sizeof(LONGLONG));
				::SafeArrayUnaccessData(psa);
				pv->vt = VT_ARRAY | VT_I4;
				pv->parray = psa;
			}
		}
	}
}

BOOL teSetObject(VARIANT *pv, PVOID pObj)
{
	if (pObj) {
		try {
			IUnknown *punk = static_cast<IUnknown *>(pObj);
			if SUCCEEDED(punk->QueryInterface(IID_PPV_ARGS(&pv->pdispVal))) {
				pv->vt = VT_DISPATCH;
				return true;
			}
			if SUCCEEDED(punk->QueryInterface(IID_PPV_ARGS(&pv->punkVal))) {
				pv->vt = VT_UNKNOWN;
				return true;
			}
		} catch (...) {}
	}
	return false;
}

BOOL teSetObjectRelease(VARIANT *pv, PVOID pObj)
{
	if (pObj) {
		try {
			IUnknown *punk = static_cast<IUnknown *>(pObj);
			if (pv) {
				if SUCCEEDED(punk->QueryInterface(IID_PPV_ARGS(&pv->pdispVal))) {
					pv->vt = VT_DISPATCH;
					SafeRelease(&punk);
					return true;
				}
				if SUCCEEDED(punk->QueryInterface(IID_PPV_ARGS(&pv->punkVal))) {
					pv->vt = VT_UNKNOWN;
					SafeRelease(&punk);
					return true;
				}
			}
			SafeRelease(&punk);
		} catch (...) {}
	}
	return false;
}

VOID teSetSZA(VARIANT *pv, LPCSTR lpstr, int nCP)
{
	if (pv) {
		int nLenW = MultiByteToWideChar(nCP, 0, lpstr, -1, NULL, NULL);
		if (nLenW) {
			pv->bstrVal = ::SysAllocStringLen(NULL, nLenW - 1);
			pv->bstrVal[0] = NULL;
			MultiByteToWideChar(nCP, 0, (LPCSTR)lpstr, -1, pv->bstrVal, nLenW);
		} else {
			pv->bstrVal = NULL;
		}
		pv->vt = VT_BSTR;
	}
}

VOID teSetSZ(VARIANT *pv, LPCWSTR lpstr)
{
	if (pv) {
		pv->bstrVal = ::SysAllocString(lpstr);
		pv->vt = VT_BSTR;
	}
}

VOID teSetBSTR(VARIANT *pv, BSTR bs, int nLen)
{
	if (pv) {
		pv->vt = VT_BSTR;
		if (bs) {
			if (nLen < 0) {
				nLen = lstrlen(bs);
			}
			if (::SysStringLen(bs) == nLen) {
				pv->bstrVal = bs;
				return;
			}
		}
		pv->bstrVal = SysAllocStringLen(bs, nLen);
		teSysFreeString(&bs);
	}
}

BOOL FindUnknown(VARIANT *pv, IUnknown **ppunk)
{
	if (pv) {
		if (pv->vt == VT_DISPATCH || pv->vt == VT_UNKNOWN) {
			*ppunk = pv->punkVal;
			return *ppunk != NULL;
		}
		if (pv->vt == (VT_VARIANT | VT_BYREF)) {
			return FindUnknown(pv->pvarVal, ppunk);
		}
		if (pv->vt == (VT_DISPATCH | VT_BYREF) || pv->vt == (VT_UNKNOWN | VT_BYREF)) {
			*ppunk = *pv->ppunkVal;
			return *ppunk != NULL;
		}
	}
	*ppunk = NULL;
	return false;
}

HRESULT tePutProperty0(IUnknown *punk, LPOLESTR sz, VARIANT *pv, DWORD grfdex)
{
	HRESULT hr = E_FAIL;
	DISPID dispid, putid;
	DISPPARAMS dispparams;
	IDispatchEx *pdex;
	if SUCCEEDED(punk->QueryInterface(IID_PPV_ARGS(&pdex))) {
		BSTR bs = ::SysAllocString(sz);
		hr = pdex->GetDispID(bs, grfdex, &dispid);
		if SUCCEEDED(hr) {
			putid = DISPID_PROPERTYPUT;
			dispparams.rgvarg = pv;
			dispparams.rgdispidNamedArgs = &putid;
			dispparams.cArgs = 1;
			dispparams.cNamedArgs = 1;
			hr = pdex->InvokeEx(dispid, LOCALE_USER_DEFAULT, DISPATCH_PROPERTYPUTREF, &dispparams, NULL, NULL, NULL);
		}
		::SysFreeString(bs);
		SafeRelease(&pdex);
	}
	return hr;
}

HRESULT tePutProperty(IUnknown *punk, LPOLESTR sz, VARIANT *pv)
{
	return tePutProperty0(punk, sz, pv, fdexNameEnsure);
}

// VARIANT Clean-up of an array
VOID teClearVariantArgs(int nArgs, VARIANTARG *pvArgs)
{
	if (pvArgs && nArgs > 0) {
		for (int i = nArgs ; i-- >  0;){
			VariantClear(&pvArgs[i]);
		}
		delete[] pvArgs;
		pvArgs = NULL;
	}
}

HRESULT Invoke5(IDispatch *pdisp, DISPID dispid, WORD wFlags, VARIANT *pvResult, int nArgs, VARIANTARG *pvArgs)
{
	HRESULT hr;
	// DISPPARAMS
	DISPPARAMS dispParams;
	dispParams.rgvarg = pvArgs;
	dispParams.cArgs = abs(nArgs);
	DISPID dispidName = DISPID_PROPERTYPUT;
	if (wFlags & DISPATCH_PROPERTYPUT) {
		dispParams.cNamedArgs = 1;
		dispParams.rgdispidNamedArgs = &dispidName;
	} else {
		dispParams.rgdispidNamedArgs = NULL;
		dispParams.cNamedArgs = 0;
	}
	try {
		hr = pdisp->Invoke(dispid, IID_NULL, LOCALE_USER_DEFAULT,
			wFlags, &dispParams, pvResult, NULL, NULL);
	} catch (...) {
		hr = E_FAIL;
	}
	teClearVariantArgs(nArgs, pvArgs);
	return hr;
}

HRESULT Invoke4(IDispatch *pdisp, VARIANT *pvResult, int nArgs, VARIANTARG *pvArgs)
{
	return Invoke5(pdisp, DISPID_VALUE, DISPATCH_METHOD, pvResult, nArgs, pvArgs);
}

VARIANTARG* GetNewVARIANT(int n)
{
	VARIANT *pv = new VARIANTARG[n];
	while (n--) {
		VariantInit(&pv[n]);
	}
	return pv;
}

int twcx_Proc(IDispatch *pdisp, char *Name, WCHAR *NameW, int n)
{
	if (pdisp) {
		VARIANT vResult;
		VariantInit(&vResult);
		VARIANTARG *pv = GetNewVARIANT(2);
		if (NameW) {
			teSetSZ(&pv[1], NameW);
		} else if (Name) {
			teSetSZA(&pv[1], Name, CP_ACP);
		}
		teSetLong(&pv[0], n);
		if SUCCEEDED(Invoke4(pdisp, &vResult, 2, pv)) {
			return GetIntFromVariantClear(&vResult);
		}
	}
	return 1;
}

int __stdcall twcx_tChangeVolProc(char *ArcName, int Mode)
{
	return twcx_Proc(g_pdispChangeVolProc, ArcName, NULL, Mode);
}

int __stdcall twcx_tChangeVolProcW(WCHAR *ArcName, int Mode)
{
	return twcx_Proc(g_pdispChangeVolProc, NULL, ArcName, Mode);
}

int __stdcall twcx_tProcessDataProc(char *FileName, int Size)
{
	return twcx_Proc(g_pdispProcessDataProc, FileName, NULL, Size);
}

int __stdcall twcx_tProcessDataProcW(WCHAR *FileName, int Size)
{
	return twcx_Proc(g_pdispProcessDataProc, NULL, FileName, Size);
}

HRESULT teGetProperty(IDispatch *pdisp, LPOLESTR sz, VARIANT *pv)
{
	DISPID dispid;
	HRESULT hr = pdisp->GetIDsOfNames(IID_NULL, &sz, 1, LOCALE_USER_DEFAULT, &dispid);
	if (hr == S_OK) {
		hr = Invoke5(pdisp, dispid, DISPATCH_PROPERTYGET, pv, 0, NULL);
	}
	return hr;
}

VOID teVariantChangeType(__out VARIANTARG * pvargDest,
				__in const VARIANTARG * pvarSrc, __in VARTYPE vt)
{
	VariantInit(pvargDest);
	if FAILED(VariantChangeType(pvargDest, pvarSrc, 0, vt)) {
		pvargDest->llVal = 0;
	}
}

BSTR teWide2Ansi(LPWSTR lpW, int nLenW)
{
	if (lpW) {
		int nLenA = WideCharToMultiByte(CP_ACP, 0, (LPCWSTR)lpW, nLenW, NULL, 0, NULL, NULL);
		BSTR bs = ::SysAllocStringByteLen(NULL, nLenA);
		WideCharToMultiByte(CP_ACP, 0, (LPCWSTR)lpW, nLenW, (LPSTR)bs, nLenA, NULL, NULL);
		LPSTR lp = (LPSTR)bs;
		return bs;
	}
	return NULL;
}

BOOL GetDispatch(VARIANT *pv, IDispatch **ppdisp)
{
	IUnknown *punk;
	if (FindUnknown(pv, &punk)) {
		return SUCCEEDED(punk->QueryInterface(IID_PPV_ARGS(ppdisp)));
	}
	return false;
}

// Initialize & Finalize
BOOL WINAPI DllMain(HINSTANCE hinstDll, DWORD dwReason, LPVOID lpReserved)
{
	switch (dwReason) {
		case DLL_PROCESS_ATTACH:
			g_pBase = new CteBase();
			g_hinstDll = hinstDll;
			break;
		case DLL_PROCESS_DETACH:
			for (size_t i = g_ppObject.size(); i--;) {
				g_ppObject[i]->Close();
				SafeRelease(&g_ppObject[i]);
			}
			g_ppObject.clear();
			SafeRelease(&g_pBase);
			SafeRelease(&g_pdispChangeVolProc);
			SafeRelease(&g_pdispProcessDataProc);
			break;
	}
	return TRUE;
}

// DLL Export

STDAPI DllCanUnloadNow(void)
{
	return g_lLocks == 0 ? S_OK : S_FALSE;
}

STDAPI DllGetClassObject(REFCLSID rclsid, REFIID riid, LPVOID *ppv)
{
	static CteClassFactory serverFactory;
	CLSID clsid;
	HRESULT hr = CLASS_E_CLASSNOTAVAILABLE;

	*ppv = NULL;
	CLSIDFromString(g_szClsid, &clsid);
	if (IsEqualCLSID(rclsid, clsid)) {
		hr = serverFactory.QueryInterface(riid, ppv);
	}
	return hr;
}

STDAPI DllRegisterServer(void)
{
	TCHAR szModulePath[MAX_PATH];
	TCHAR szKey[256];

	wsprintf(szKey, TEXT("CLSID\\%s"), g_szClsid);
	LSTATUS lr = CreateRegistryKey(HKEY_CLASSES_ROOT, szKey, NULL, const_cast<LPTSTR>(g_szProgid));
	if (lr != ERROR_SUCCESS) {
		return ShowRegError(lr);
	}
	GetModuleFileName(g_hinstDll, szModulePath, sizeof(szModulePath) / sizeof(TCHAR));
	wsprintf(szKey, TEXT("CLSID\\%s\\InprocServer32"), g_szClsid);
	lr = CreateRegistryKey(HKEY_CLASSES_ROOT, szKey, NULL, szModulePath);
	if (lr != ERROR_SUCCESS) {
		return ShowRegError(lr);
	}
	lr = CreateRegistryKey(HKEY_CLASSES_ROOT, szKey, TEXT("ThreadingModel"), TEXT("Apartment"));
	if (lr != ERROR_SUCCESS) {
		return ShowRegError(lr);
	}
	wsprintf(szKey, TEXT("CLSID\\%s\\ProgID"), g_szClsid);
	lr = CreateRegistryKey(HKEY_CLASSES_ROOT, szKey, NULL, const_cast<LPTSTR>(g_szProgid));
	if (lr != ERROR_SUCCESS) {
		return ShowRegError(lr);
	}
	lr = CreateRegistryKey(HKEY_CLASSES_ROOT, const_cast<LPTSTR>(g_szProgid), NULL, TEXT(PRODUCTNAME));
	if (lr != ERROR_SUCCESS) {
		return ShowRegError(lr);
	}
	wsprintf(szKey, TEXT("%s\\CLSID"), g_szProgid);
	lr = CreateRegistryKey(HKEY_CLASSES_ROOT, szKey, NULL, const_cast<LPTSTR>(g_szClsid));
	if (lr != ERROR_SUCCESS) {
		return ShowRegError(lr);
	}
	return S_OK;
}

STDAPI DllUnregisterServer(void)
{
	TCHAR szKey[64];
	wsprintf(szKey, TEXT("CLSID\\%s"), g_szClsid);
	LSTATUS ls = SHDeleteKey(HKEY_CLASSES_ROOT, szKey);
	if (ls == ERROR_SUCCESS) {
		ls = SHDeleteKey(HKEY_CLASSES_ROOT, g_szProgid);
		if (ls == ERROR_SUCCESS) {
			return S_OK;
		}
	}
	return ShowRegError(ls);
}

//CteWCX

CteWCX::CteWCX(HMODULE hDll, LPWSTR lpLib)
{
	m_cRef = 1;
	m_hDll = hDll;
	m_bsLib = ::SysAllocString(lpLib);

	teGetProcAddress(m_hDll, "OpenArchive", (FARPROC *)&WCX_OpenArchive, (FARPROC *)&WCX_OpenArchiveW);
	teGetProcAddress(m_hDll, "ReadHeader", (FARPROC *)&WCX_ReadHeader, NULL);
	teGetProcAddress(m_hDll, "ReadHeaderEx", (FARPROC *)&WCX_ReadHeaderEx, (FARPROC *)&WCX_ReadHeaderExW);
	teGetProcAddress(m_hDll, "ProcessFile", (FARPROC *)&WCX_ProcessFile, (FARPROC *)&WCX_ProcessFileW);
	teGetProcAddress(m_hDll, "CloseArchive", (FARPROC *)&WCX_CloseArchive, NULL);
	teGetProcAddress(m_hDll, "SetChangeVolProc", (FARPROC *)&WCX_SetChangeVolProc, (FARPROC *)&WCX_SetChangeVolProcW);
	teGetProcAddress(m_hDll, "SetProcessDataProc", (FARPROC *)&WCX_SetProcessDataProc, (FARPROC *)&WCX_SetProcessDataProcW);
	teGetProcAddress(m_hDll, "PackFiles", (FARPROC *)&WCX_PackFiles, (FARPROC *)&WCX_PackFilesW);
	teGetProcAddress(m_hDll, "DeleteFiles", (FARPROC *)&WCX_DeleteFiles, (FARPROC *)&WCX_DeleteFilesW);
	teGetProcAddress(m_hDll, "CanYouHandleThisFile", (FARPROC *)&WCX_CanYouHandleThisFile, (FARPROC *)&WCX_CanYouHandleThisFileW);
	teGetProcAddress(m_hDll, "ConfigurePacker", (FARPROC *)&WCX_ConfigurePacker, NULL);
	teGetProcAddress(m_hDll, "PackSetDefaultParams", (FARPROC *)&WCX_PackSetDefaultParams, NULL);
	SetProcEx(INVALID_HANDLE_VALUE, 3);
}

CteWCX::~CteWCX()
{
	Close();
	for (size_t i = g_ppObject.size(); i--;) {
		if (this == g_ppObject[i]) {
			g_ppObject.erase(g_ppObject.begin() + i);
			break;
		}
	}
}

VOID CteWCX::Close()
{
	if (m_hDll) {
		FreeLibrary(m_hDll);
		m_hDll = NULL;
	}
	WCX_OpenArchive = NULL;
	WCX_OpenArchiveW = NULL;
	WCX_ReadHeader = NULL;
	WCX_ReadHeaderEx = NULL;
	WCX_ReadHeaderExW = NULL;
	WCX_ProcessFile = NULL;
	WCX_ProcessFileW = NULL;
	WCX_CloseArchive = NULL;
	WCX_PackFiles = NULL;
	WCX_PackFilesW = NULL;
	WCX_DeleteFiles = NULL;
	WCX_DeleteFilesW = NULL;
	WCX_CanYouHandleThisFile = NULL;
	WCX_CanYouHandleThisFileW = NULL;
	WCX_ConfigurePacker = NULL;
	WCX_PackSetDefaultParams = NULL;
}

VOID CteWCX::SetProcEx(HANDLE hArcData, int n)
{
	if (n & 1) {
		if (WCX_SetChangeVolProcW) {
			WCX_SetChangeVolProcW(hArcData, twcx_tChangeVolProcW);
		} else if (WCX_SetChangeVolProc) {
			WCX_SetChangeVolProc(hArcData, twcx_tChangeVolProc);
		}
	}
	if (n & 2) {
		if (WCX_SetProcessDataProcW) {
			WCX_SetProcessDataProcW(hArcData, twcx_tProcessDataProcW);
		} else if (WCX_SetProcessDataProc) {
			WCX_SetProcessDataProc(hArcData, twcx_tProcessDataProc);
		}
	}
}

STDMETHODIMP CteWCX::QueryInterface(REFIID riid, void **ppvObject)
{
	static const QITAB qit[] =
	{
		QITABENT(CteWCX, IDispatch),
		{ 0 },
	};
	return QISearch(this, qit, riid, ppvObject);
}

STDMETHODIMP_(ULONG) CteWCX::AddRef()
{
	return ::InterlockedIncrement(&m_cRef);
}

STDMETHODIMP_(ULONG) CteWCX::Release()
{
	if (::InterlockedDecrement(&m_cRef) == 0) {
		delete this;
		return 0;
	}
	return m_cRef;
}

STDMETHODIMP CteWCX::GetTypeInfoCount(UINT *pctinfo)
{
	*pctinfo = 0;
	return S_OK;
}

STDMETHODIMP CteWCX::GetTypeInfo(UINT iTInfo, LCID lcid, ITypeInfo **ppTInfo)
{
	return E_NOTIMPL;
}

STDMETHODIMP CteWCX::GetIDsOfNames(REFIID riid, LPOLESTR *rgszNames, UINT cNames, LCID lcid, DISPID *rgDispId)
{
	auto itr = g_umWCX.find(*rgszNames);
	if (itr != g_umWCX.end()) {
		*rgDispId = itr->second;
		return S_OK;
	}
#ifdef _DEBUG
	OutputDebugStringA("GetIDsOfNames:");
	OutputDebugString(rgszNames[0]);
	OutputDebugStringA("\n");
#endif
	return DISP_E_UNKNOWNNAME;
}

STDMETHODIMP CteWCX::Invoke(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags, DISPPARAMS *pDispParams, VARIANT *pVarResult, EXCEPINFO *pExcepInfo, UINT *puArgErr)
{
	int nArg = pDispParams ? pDispParams->cArgs - 1 : -1;
	int nResult = E_NOT_SUPPORTED;
	try {
		switch (dispIdMember) {
			//OpenArchive
			case 0x60010001:
				if (nArg >= 0) {
					HANDLE hArcData = 0;
					IDispatch *pdisp;
					if (GetDispatch(&pDispParams->rgvarg[nArg], &pdisp)) {
						tOpenArchiveDataW OpenDataW = { 0 };
						VARIANT vArcName, v;
						teGetProperty(pdisp, L"ArcName", &vArcName);
						OpenDataW.ArcName = vArcName.bstrVal;
						teGetProperty(pdisp, L"OpenMode", &v);
						OpenDataW.OpenMode = GetIntFromVariantClear(&v);
						if (WCX_OpenArchiveW) {
							hArcData = WCX_OpenArchiveW(&OpenDataW);
							teSetLong(&v, OpenDataW.OpenResult);
						} else if (WCX_OpenArchive) {
							tOpenArchiveData OpenDataA = { 0 };
							OpenDataA.OpenMode = OpenDataW.OpenMode;
							BSTR bsArcName = teWide2Ansi(OpenDataW.ArcName, -1);
							OpenDataA.ArcName = (char *)bsArcName;
							hArcData = WCX_OpenArchive(&OpenDataA);
							teSetLong(&v, OpenDataA.OpenResult);
							teSysFreeString(&bsArcName);
						}
						teSetPtr(pVarResult, hArcData);
						SetProcEx(hArcData, 3);
						if (v.vt != VT_EMPTY) {
							tePutProperty(pdisp, L"OpenResult", &v);
							VariantClear(&v);
						}
						SafeRelease(&pdisp);
					}
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					if (WCX_OpenArchiveW || WCX_OpenArchive) {
						teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
					}
				}
				return S_OK;		
			//ReadHeaderEx
			case 0x60010002:
				if (nArg >= 1) {
					IUnknown *punk;
					if (FindUnknown(&pDispParams->rgvarg[nArg - 1], &punk)) {
						tHeaderDataExW HeaderExW = { 0 };
						HANDLE hArcData = (HANDLE)GetPtrFromVariant(&pDispParams->rgvarg[nArg]); 
						if (WCX_ReadHeaderExW) {
							nResult = WCX_ReadHeaderExW(hArcData, &HeaderExW);
						} else if (WCX_ReadHeaderEx) {
							tHeaderDataEx HeaderExA = { 0 };
							nResult = WCX_ReadHeaderEx(hArcData, &HeaderExA);
							MultiByteToWideChar(CP_ACP, 0, (LPCSTR)HeaderExA.ArcName, 1024, HeaderExW.ArcName, 1024);
							MultiByteToWideChar(CP_ACP, 0, (LPCSTR)HeaderExA.FileName, 1024, HeaderExW.FileName, 1024);
							HeaderExW.Flags = HeaderExA.Flags;
							HeaderExW.PackSize = HeaderExA.PackSize;
							HeaderExW.PackSizeHigh = HeaderExA.PackSizeHigh;
							HeaderExW.UnpSize = HeaderExA.UnpSize;
							HeaderExW.UnpSizeHigh = HeaderExA.UnpSizeHigh;
							HeaderExW.HostOS = HeaderExA.HostOS;
							HeaderExW.FileCRC = HeaderExA.FileCRC;
							HeaderExW.FileTime = HeaderExA.FileTime;
							HeaderExW.UnpVer = HeaderExA.UnpVer;
							HeaderExW.Format = HeaderExA.Format;
							HeaderExW.FileAttr = HeaderExA.FileAttr;
						} else if (WCX_ReadHeader) {
							tHeaderData HeaderA = { 0 };
							nResult = WCX_ReadHeader(hArcData, &HeaderA);
							MultiByteToWideChar(CP_ACP, 0, (LPCSTR)HeaderA.ArcName, 260, HeaderExW.ArcName, 1024);
							MultiByteToWideChar(CP_ACP, 0, (LPCSTR)HeaderA.FileName, 260, HeaderExW.FileName, 1024);
							HeaderExW.Flags = HeaderA.Flags;
							HeaderExW.PackSize = HeaderA.PackSize;
							HeaderExW.UnpSize = HeaderA.UnpSize;
							HeaderExW.HostOS = HeaderA.HostOS;
							HeaderExW.FileCRC = HeaderA.FileCRC;
							HeaderExW.FileTime = HeaderA.FileTime;
							HeaderExW.UnpVer = HeaderA.UnpVer;
							HeaderExW.Format = HeaderA.Format;
							HeaderExW.FileAttr = HeaderA.FileAttr;
						}
						if (nResult == E_SUCCESS) {
							VARIANT v;
							teSetSZ(&v, HeaderExW.ArcName);
							tePutProperty(punk, L"ArcName", &v);
							VariantClear(&v);
							teSetSZ(&v, HeaderExW.FileName);
							tePutProperty(punk, L"FileName", &v);
							VariantClear(&v);
							teSetLong(&v, HeaderExW.Flags);
							tePutProperty(punk, L"Flags", &v);
							VariantClear(&v);
							teSetLL(&v, HeaderExW.PackSize);
							tePutProperty(punk, L"PackSize", &v);
							VariantClear(&v);
							teSetLL(&v, HeaderExW.PackSizeHigh);
							tePutProperty(punk, L"PackSizeHigh", &v);
							VariantClear(&v);
							teSetLL(&v, HeaderExW.UnpSize);
							tePutProperty(punk, L"UnpSize", &v);
							VariantClear(&v);
							teSetLL(&v, HeaderExW.UnpSizeHigh);
							tePutProperty(punk, L"UnpSizeHigh", &v);
							VariantClear(&v);
							teSetLong(&v, HeaderExW.HostOS);
							tePutProperty(punk, L"HostOS", &v);
							VariantClear(&v);
							teSetLong(&v, HeaderExW.FileCRC);
							tePutProperty(punk, L"FileCRC", &v);
							VariantClear(&v);
							if (::DosDateTimeToVariantTime(HIWORD(HeaderExW.FileTime), LOWORD(HeaderExW.FileTime), &v.date)) {
								v.vt = VT_DATE;
								tePutProperty(punk, L"FileTime", &v);
								VariantClear(&v);
							}
							teSetLong(&v, HeaderExW.UnpVer);
							tePutProperty(punk, L"UnpVer", &v);
							VariantClear(&v);
							teSetLong(&v, HeaderExW.Format);
							tePutProperty(punk, L"Format", &v);
							VariantClear(&v);
							teSetLong(&v, HeaderExW.FileAttr);
							tePutProperty(punk, L"FileAttr", &v);
							VariantClear(&v);
						}
					}
					teSetLong(pVarResult, nResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					if (WCX_ReadHeaderExW || WCX_ReadHeaderEx || WCX_ReadHeader) {
						teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
					}
				}
				return S_OK;
			//ProcessFile
			case 0x60010003:
				if (nArg >= 1) {
					HANDLE hArcData = (HANDLE)GetPtrFromVariant(&pDispParams->rgvarg[nArg]); 
					int nOperation = GetIntFromVariant(&pDispParams->rgvarg[nArg - 1]); 
					LPWSTR lpDestPath = nArg >= 2 ? GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 2]) : NULL;
					LPWSTR lpDestName = nArg >= 3 ? GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 3]) : NULL;
					if (WCX_ProcessFileW) {
						nResult = WCX_ProcessFileW(hArcData, nOperation, lpDestPath, lpDestName);
					} else if (WCX_ProcessFile) {
						BSTR bsDestPath = teWide2Ansi(lpDestPath, -1);
						BSTR bsDestName = teWide2Ansi(lpDestName, -1);
						if (nOperation == 2) {
							char *lp1 = (char *)bsDestName;
						}
						try {
							nResult = WCX_ProcessFile(hArcData, nOperation, (char *)bsDestPath, (char *)bsDestName);
						} catch (...) {
							nResult = 13;
						}
						teSysFreeString(&bsDestName);
						teSysFreeString(&bsDestPath);
					}
					teSetLong(pVarResult, nResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					if (WCX_ProcessFileW || WCX_ProcessFile) {
						teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
					}
				}
				return S_OK;
			//CloseArchive
			case 0x60010004:
				if (WCX_CloseArchive && nArg >= 0) {
					teSetLong(pVarResult, WCX_CloseArchive((HANDLE)GetPtrFromVariant(&pDispParams->rgvarg[nArg])));
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					if (WCX_CloseArchive) {
						teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
					}
				}
				return S_OK;		
			//PackFiles
			case 0x60010005:
				if (nArg >= 4) {
					LPWSTR lpPackedFile = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
					LPWSTR lpSubPath = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 1]);
					if (lstrlen(lpSubPath) == 0) {
						lpSubPath = NULL;
					}
					LPWSTR lpSrcPath = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 2]);
					LPWSTR lpAddList = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 3]);
					int nFlags = GetIntFromVariant(&pDispParams->rgvarg[nArg - 4]);
					SetProcEx(INVALID_HANDLE_VALUE, 3);
					if (WCX_PackFilesW) {
						try {
							nResult = WCX_PackFilesW(lpPackedFile, lpSubPath, lpSrcPath, lpAddList, nFlags);
						} catch (...) {
							nResult = E_NOT_SUPPORTED;
						}
					} else if (WCX_PackFiles) {
						BSTR bsPackedFile = teWide2Ansi(lpPackedFile, -1);
						BSTR bsSubPath = teWide2Ansi(lpSubPath, -1);
						BSTR bsSrcPath = teWide2Ansi(lpSrcPath, -1);
						BSTR bsAddList = teWide2Ansi(lpAddList, ::SysStringLen(lpAddList));
						try {
							nResult = WCX_PackFiles((char *)bsPackedFile, (char *)bsSubPath, (char *)bsSrcPath, (char *)bsAddList, nFlags);
						} catch (...) {
							nResult = E_NOT_SUPPORTED;
						}
						teSysFreeString(&bsAddList);
						teSysFreeString(&bsSrcPath);
						teSysFreeString(&bsSubPath);
						teSysFreeString(&bsPackedFile);
					}
					teSetLong(pVarResult, nResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					if (WCX_PackFilesW || WCX_PackFiles) {
						teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
					}
				}
				return S_OK;
			//DeleteFiles
			case 0x60010006:
				if (nArg >= 1) {
					LPWSTR lpPackedFile = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
					LPWSTR lpDeleteList = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 1]);
					SetProcEx(INVALID_HANDLE_VALUE, 3);
					if (WCX_DeleteFilesW) {
						try {
							nResult = WCX_DeleteFilesW(lpPackedFile, lpDeleteList);
						} catch (...) {
							nResult = E_NOT_SUPPORTED;
						}
					} else if (WCX_DeleteFiles) {
						BSTR bsPackedFile = teWide2Ansi(lpPackedFile, -1);
						BSTR bsDeleteList = teWide2Ansi(lpDeleteList, ::SysStringLen(lpDeleteList));
						try {
							nResult = WCX_DeleteFiles((char *)bsPackedFile, (char *)bsDeleteList);
						} catch (...) {
							nResult = E_NOT_SUPPORTED;
						}
						teSysFreeString(&bsDeleteList);
						teSysFreeString(&bsPackedFile);
					}
					teSetLong(pVarResult, nResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					if (WCX_DeleteFilesW || WCX_DeleteFiles) {
						teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
					}
				}
				return S_OK;
			//CanYouHandleThisFile
			case 0x60010007:
				if (nArg >= 0) {
					LPWSTR lpFileName = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
					if (WCX_CanYouHandleThisFileW) {
						teSetBool(pVarResult, WCX_CanYouHandleThisFileW(lpFileName));
					} else if (WCX_CanYouHandleThisFile) {
						BSTR bsFileName = teWide2Ansi(lpFileName, -1);
						teSetBool(pVarResult, WCX_CanYouHandleThisFile((char *)bsFileName));
						teSysFreeString(&bsFileName);
					} else {
						HANDLE hArcData = 0;
						if (WCX_OpenArchiveW) {
							tOpenArchiveDataW OpenDataW = { 0 };
							OpenDataW.ArcName = lpFileName;
							hArcData = WCX_OpenArchiveW(&OpenDataW);
						} else if (WCX_OpenArchive) {
							tOpenArchiveData OpenDataA = { 0 };
							BSTR bsArcName = teWide2Ansi(lpFileName, -1);
							OpenDataA.ArcName = (char *)bsArcName;
							hArcData = WCX_OpenArchive(&OpenDataA);
							teSysFreeString(&bsArcName);
						}
						if (hArcData && WCX_CloseArchive) {
							WCX_CloseArchive(hArcData);
							teSetBool(pVarResult, TRUE);
						} else {
							teSetBool(pVarResult, FALSE);
						}
					}
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					if (WCX_CanYouHandleThisFileW || WCX_CanYouHandleThisFile) {
						teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
					}
				}
				return S_OK;
			//ConfigurePacker
			case 0x60010008:
				if (nArg >= 0) {
					if (WCX_ConfigurePacker) {
						WCX_ConfigurePacker((HWND)GetPtrFromVariant(&pDispParams->rgvarg[nArg]), g_hinstDll);
					}
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					if (WCX_ConfigurePacker) {
						teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
					}
				}
				return S_OK;
			//SetChangeVolProc
			case 0x60010009:
				if (nArg >= 1) {
					SetProcEx((HANDLE)GetPtrFromVariant(&pDispParams->rgvarg[nArg]), 1);
					SafeRelease(&g_pdispChangeVolProc);
					GetDispatch(&pDispParams->rgvarg[nArg - 1], &g_pdispChangeVolProc);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					if (WCX_SetChangeVolProcW || WCX_SetChangeVolProc) {
						teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
					}
				}
				return S_OK;
			//SetProcessDataProc
			case 0x6001000A:
				if (nArg >= 1) {
					SetProcEx((HANDLE)GetPtrFromVariant(&pDispParams->rgvarg[nArg]), 2);
					SafeRelease(&g_pdispProcessDataProc);
					GetDispatch(&pDispParams->rgvarg[nArg - 1], &g_pdispProcessDataProc);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					if (WCX_SetProcessDataProcW || WCX_SetProcessDataProc) {
						teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
					}
				}
				return S_OK;
			//PackSetDefaultParams
			case 0x6001000B:
				if (nArg >= 0 && WCX_PackSetDefaultParams) {
					PackDefaultParamStruct dps = { sizeof(PackDefaultParamStruct), 21, 2 };
					LPWSTR lpPath = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
					if (lpPath) {
						WideCharToMultiByte(CP_ACP, 0, (LPCWSTR)lpPath, -1, dps.DefaultIniName, MAX_PATH, NULL, NULL);
					}
					WCX_PackSetDefaultParams(&dps);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					if (WCX_PackSetDefaultParams) {
						teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
					}
				}
				return S_OK;
			//Close
			case 0x6001000C:
				if (wFlags == DISPATCH_PROPERTYGET) {
					teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
				}
			return S_OK;
			//IsUnicode
			case 0x4001FFFF:
				teSetBool(pVarResult, WCX_OpenArchiveW != NULL);
				return S_OK;
			//this
			case DISPID_VALUE:
				if (pVarResult) {
					teSetObject(pVarResult, this);
				}
				return S_OK;
		}//end_switch
	} catch (...) {
		return DISP_E_EXCEPTION;
	}
	return DISP_E_MEMBERNOTFOUND;
}

//CteBase

CteBase::CteBase()
{
	m_cRef = 1;
}

CteBase::~CteBase()
{
}

STDMETHODIMP CteBase::QueryInterface(REFIID riid, void **ppvObject)
{
	static const QITAB qit[] =
	{
		QITABENT(CteBase, IDispatch),
		{ 0 },
	};
	return QISearch(this, qit, riid, ppvObject);
}

STDMETHODIMP_(ULONG) CteBase::AddRef()
{
	return ::InterlockedIncrement(&m_cRef);
}

STDMETHODIMP_(ULONG) CteBase::Release()
{
	if (::InterlockedDecrement(&m_cRef) == 0) {
		delete this;
		return 0;
	}
	return m_cRef;
}

STDMETHODIMP CteBase::GetTypeInfoCount(UINT *pctinfo)
{
	*pctinfo = 0;
	return S_OK;
}

STDMETHODIMP CteBase::GetTypeInfo(UINT iTInfo, LCID lcid, ITypeInfo **ppTInfo)
{
	return E_NOTIMPL;
}

STDMETHODIMP CteBase::GetIDsOfNames(REFIID riid, LPOLESTR *rgszNames, UINT cNames, LCID lcid, DISPID *rgDispId)
{
	auto itr = g_umBASE.find(*rgszNames);
	if (itr != g_umBASE.end()) {
		*rgDispId = itr->second;
		return S_OK;
	}
#ifdef _DEBUG
	OutputDebugStringA("GetIDsOfNames:");
	OutputDebugString(rgszNames[0]);
	OutputDebugStringA("\n");
#endif
	return DISP_E_UNKNOWNNAME;
}

STDMETHODIMP CteBase::Invoke(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags, DISPPARAMS *pDispParams, VARIANT *pVarResult, EXCEPINFO *pExcepInfo, UINT *puArgErr)
{
	int nArg = pDispParams ? pDispParams->cArgs - 1 : -1;
	HRESULT hr = S_OK;
	if (wFlags == DISPATCH_PROPERTYGET && dispIdMember >= TE_METHOD) {
		teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
		return S_OK;
	}

	switch (dispIdMember) {
		//Open
		case 0x60010000:
			if (nArg >= 0) {
				LPWSTR lpLib = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);

				CteWCX *pItem;
				for (size_t i = g_ppObject.size(); i--;) {
					pItem = g_ppObject[i];
					if (pItem) {
						if (lstrcmpi(lpLib, pItem->m_bsLib) == 0) {
							teSetObject(pVarResult, pItem);
							return S_OK;
						}
					}
				}
				HMODULE hDll = LoadLibrary(lpLib);
				if (hDll) {
					pItem = new CteWCX(hDll, lpLib);
					g_ppObject.push_back(pItem);
					teSetObjectRelease(pVarResult, pItem);
				}
			}
			return S_OK;
		//Close
		case 0x6001000C:
			if (nArg >= 0) {
				LPWSTR lpLib = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);

				for (size_t i = g_ppObject.size(); i--;) {
					if (g_ppObject[i]) {
						if (lstrcmpi(lpLib, g_ppObject[i]->m_bsLib) == 0) {
							g_ppObject[i]->Close();
							SafeRelease(&g_ppObject[i]);
							break;
						}
					}
				}
			}
			return S_OK;
		//this
		case DISPID_VALUE:
			if (pVarResult) {
				teSetObject(pVarResult, this);
			}
			return S_OK;
	}//end_switch
	return DISP_E_MEMBERNOTFOUND;
}

// CteClassFactory

STDMETHODIMP CteClassFactory::QueryInterface(REFIID riid, void **ppvObject)
{
	static const QITAB qit[] =
	{
		QITABENT(CteClassFactory, IClassFactory),
		{ 0 },
	};
	return QISearch(this, qit, riid, ppvObject);
}

STDMETHODIMP_(ULONG) CteClassFactory::AddRef()
{
	LockModule(TRUE);
	return 2;
}

STDMETHODIMP_(ULONG) CteClassFactory::Release()
{
	LockModule(FALSE);
	return 1;
}

STDMETHODIMP CteClassFactory::CreateInstance(IUnknown *pUnkOuter, REFIID riid, void **ppvObject)
{
	*ppvObject = NULL;

	if (pUnkOuter != NULL) {
		return CLASS_E_NOAGGREGATION;
	}
	return g_pBase->QueryInterface(riid, ppvObject);
}

STDMETHODIMP CteClassFactory::LockServer(BOOL fLock)
{
	LockModule(fLock);
	return S_OK;
}

//CteDispatch

CteDispatch::CteDispatch(IDispatch *pDispatch, int nMode, DISPID dispId)
{
	m_cRef = 1;
	pDispatch->QueryInterface(IID_PPV_ARGS(&m_pDispatch));
	m_dispIdMember = dispId;
}

CteDispatch::~CteDispatch()
{
	Clear();
}

VOID CteDispatch::Clear()
{
	SafeRelease(&m_pDispatch);
}

STDMETHODIMP CteDispatch::QueryInterface(REFIID riid, void **ppvObject)
{
	static const QITAB qit[] =
	{
		QITABENT(CteDispatch, IDispatch),
	{ 0 },
	};
	return QISearch(this, qit, riid, ppvObject);
}

STDMETHODIMP_(ULONG) CteDispatch::AddRef()
{
	return ::InterlockedIncrement(&m_cRef);
}

STDMETHODIMP_(ULONG) CteDispatch::Release()
{
	if (::InterlockedDecrement(&m_cRef) == 0) {
		delete this;
		return 0;
	}

	return m_cRef;
}

STDMETHODIMP CteDispatch::GetTypeInfoCount(UINT *pctinfo)
{
	*pctinfo = 0;
	return S_OK;
}

STDMETHODIMP CteDispatch::GetTypeInfo(UINT iTInfo, LCID lcid, ITypeInfo **ppTInfo)
{
	return E_NOTIMPL;
}

STDMETHODIMP CteDispatch::GetIDsOfNames(REFIID riid, LPOLESTR *rgszNames, UINT cNames, LCID lcid, DISPID *rgDispId)
{
	return DISP_E_UNKNOWNNAME;
}

STDMETHODIMP CteDispatch::Invoke(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags, DISPPARAMS *pDispParams, VARIANT *pVarResult, EXCEPINFO *pExcepInfo, UINT *puArgErr)
{
	try {
		if (pVarResult) {
			VariantInit(pVarResult);
		}
		if (wFlags & DISPATCH_METHOD) {
			return m_pDispatch->Invoke(m_dispIdMember, riid, lcid, wFlags, pDispParams, pVarResult, pExcepInfo, puArgErr);
		}
		teSetObject(pVarResult, this);
		return S_OK;
	} catch (...) {}
	return DISP_E_MEMBERNOTFOUND;
}
