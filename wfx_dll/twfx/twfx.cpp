// Tablacus Total Commander Packer Plugin (C)2016 Gaku
// MIT Lisence
// Visual C++ 2008 Express Edition SP1
// Windows SDK v7.0
// http://www.eonet.ne.jp/~gakana/tablacus/

#include "twfx.h"

// Global Variables:
const TCHAR g_szProgid[] = TEXT("Tablacus.TotalCommanderFSPlugin");
const TCHAR g_szClsid[] = TEXT("{5396F915-5592-451c-8811-87314FC0EF11}");
HINSTANCE	g_hinstDll = NULL;
LONG		g_lLocks = 0;
CteBase		*g_pBase = NULL;
CteWFX		*g_ppObject[MAX_OBJ];
IDispatch	*g_pdispArrayProc = NULL;
IDispatch	*g_pdispProgressProc = NULL;
IDispatch	*g_pdispLogProc = NULL;
IDispatch	*g_pdispRequestProc = NULL;
IDispatch	*g_pdispCryptProc = NULL;

TEmethod methodBASE[] = {
	{ 0x60010000, L"Open" },
	{ 0x6001000C, L"Close" },
};

TEmethod methodTWFX[] = {
	{ 0x60010001, L"FsInit" },
	{ 0x60010002, L"FsFindFirst" },
	{ 0x60010003, L"FsFindNext" },
	{ 0x60010004, L"FsFindClose" },
	{ 0x60010005, L"FsGetDefRootName" },
	{ 0x60010006, L"FsGetFile" },
	{ 0x60010007, L"FsPutFile" },
	{ 0x60010008, L"FsRenMovFile" },
	{ 0x60010009, L"FsDeleteFile" },
	{ 0x6001000A, L"FsRemoveDir" },
	{ 0x6001000B, L"FsMkDir" },
	{ 0x6001000C, L"FsExecuteFile" },
	{ 0x6001000D, L"FsSetAttr" },
	{ 0x6001000E, L"FsSetTime" },
	{ 0x6001000F, L"FsDisconnect" },
	{ 0x60010010, L"FsExtractCustomIcon" },
	{ 0x60010011, L"FsSetCryptCallback" },
	{ 0x60010012, L"FsSetDefaultParams" },
	{ 0x6001FFFF, L"IsUnicode" },
	{ 0, NULL }
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

/*
int teBSearch(TEmethod *method, int nSize, int* pMap, LPOLESTR bs)
{
	int nMin = 0;
	int nMax = nSize - 1;
	int nIndex, nCC;

	while (nMin <= nMax) {
		nIndex = (nMin + nMax) / 2;
		nCC = lstrcmpi(bs, method[pMap[nIndex]].name);
		if (nCC < 0) {
			nMax = nIndex - 1;
			continue;
		}
		if (nCC > 0) {
			nMin = nIndex + 1;
			continue;
		}
		return pMap[nIndex];
	}
	return -1;
}
*/
HRESULT teGetDispId(TEmethod *method, int nCount, int* pMap, LPOLESTR bs, DISPID *rgDispId)
{
/*	if (pMap) {
		int nIndex = teBSearch(method, nCount, pMap, bs);
		if (nIndex >= 0) {
			*rgDispId = method[nIndex].id;
			return S_OK;
		}
	} else {*/
		for (int i = 0; method[i].name; i++) {
			if (lstrcmpi(bs, method[i].name) == 0) {
				*rgDispId = method[i].id;
				return S_OK;
			}
		}
//	}
	return DISP_E_UNKNOWNNAME;
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

int twfx_Proc(IDispatch *pdisp, char *Name, WCHAR *NameW, int n)
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

BOOL GetDispatch(VARIANT *pv, IDispatch **ppdisp)
{
	IUnknown *punk;
	if (FindUnknown(pv, &punk)) {
		return SUCCEEDED(punk->QueryInterface(IID_PPV_ARGS(ppdisp)));
	}
	return false;
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

int __stdcall twfx_tProgressProc(int PluginNr,char* SourceName,char* TargetName,int PercentDone)
{
	if (g_pdispProgressProc) {
		if (SourceName || TargetName) {
			VARIANT vResult;
			VariantInit(&vResult);
			VARIANTARG *pv = GetNewVARIANT(4);
			teSetLong(&pv[3], PluginNr);
			teSetSZA(&pv[2], SourceName, CP_ACP);
			teSetSZA(&pv[1], TargetName, CP_ACP);
			teSetLong(&pv[0], PercentDone);
			if SUCCEEDED(Invoke4(g_pdispProgressProc, &vResult, 4, pv)) {
				return GetIntFromVariantClear(&vResult);
			}
		}
	}
	return 0;
}

int __stdcall twfx_tProgressProcW(int PluginNr,WCHAR* SourceName,WCHAR* TargetName,int PercentDone)
{
	if (g_pdispProgressProc) {
		if (SourceName || TargetName) {
			VARIANT vResult;
			VariantInit(&vResult);
			VARIANTARG *pv = GetNewVARIANT(4);
			teSetLong(&pv[3], PluginNr);
			teSetSZ(&pv[2], SourceName);
			teSetSZ(&pv[1], TargetName);
			teSetLong(&pv[0], PercentDone);
			if SUCCEEDED(Invoke4(g_pdispProgressProc, &vResult, 4, pv)) {
				return GetIntFromVariantClear(&vResult);
			}
		}
	}
	return 0;
}

void __stdcall twfx_tLogProc(int PluginNr,int MsgType,char* LogString)
{
	if (g_pdispLogProc) {
		VARIANTARG *pv = GetNewVARIANT(3);
		teSetLong(&pv[2], PluginNr);
		teSetLong(&pv[1], MsgType);
		teSetSZA(&pv[0], LogString, CP_ACP);
		Invoke4(g_pdispLogProc, NULL, 3, pv);
	}
}

void __stdcall twfx_tLogProcW(int PluginNr,int MsgType,WCHAR* LogString)
{
	if (g_pdispLogProc) {
		VARIANTARG *pv = GetNewVARIANT(3);
		teSetLong(&pv[2], PluginNr);
		teSetLong(&pv[1], MsgType);
		teSetSZ(&pv[0], LogString);
		Invoke4(g_pdispLogProc, NULL, 3, pv);
	}
}

VOID twfx_tProcV(IDispatch *pdispProc, int i1, int i2, VARIANT *pv3, VARIANT *pv4, VARIANT *pvInOut, int *piResult)
{
	if (pdispProc && g_pdispArrayProc) {
		VARIANT v;
		VariantInit(&v);
		Invoke4(g_pdispArrayProc, &v, 0, NULL);
		IDispatch *pdisp;
		if (GetDispatch(&v, &pdisp)) {
			VARIANTARG *pv = GetNewVARIANT(5);
			teSetLong(&pv[4], i1);
			teSetLong(&pv[3], i2);
			VariantCopy(&pv[2], pv3);
			VariantClear(pv3);
			VariantCopy(&pv[1], pv4);
			VariantClear(pv4);
			tePutProperty(pdisp, L"0", pvInOut);
			teSetObject(&pv[0], pdisp);
			VariantInit(&v);
			if SUCCEEDED(Invoke4(pdispProc, &v, 5, pv)) {
				*piResult = GetIntFromVariantClear(&v);
			}
			VariantClear(pvInOut);
			teGetProperty(pdisp, L"0", pvInOut);
			pdisp->Release();
		}
	}
}

BOOL __stdcall twfx_tRequestProc(int PluginNr,int RequestType,char* CustomTitle,char* CustomText,char* ReturnedText,int maxlen)
{
	VARIANT vCustomTitle, vCustomText, vReturnedText;
	VariantInit(&vCustomText);
	VariantInit(&vCustomTitle);
	VariantInit(&vReturnedText);
	teSetSZA(&vCustomTitle, CustomTitle, CP_ACP);
	teSetSZA(&vCustomText, CustomText, CP_ACP);
	teSetSZA(&vReturnedText, ReturnedText, CP_ACP);
	BOOL bResult = TRUE;
	twfx_tProcV(g_pdispCryptProc, PluginNr, RequestType, &vCustomTitle, &vCustomText, &vReturnedText, &bResult);
	if (ReturnedText && maxlen && RequestType < 8 && vReturnedText.vt == VT_BSTR) {
		WideCharToMultiByte(CP_ACP, 0, (LPCWSTR)vReturnedText.bstrVal, -1, (LPSTR)ReturnedText, maxlen, NULL, NULL);
	}
	VariantClear(&vReturnedText);
	return bResult;
}

BOOL __stdcall twfx_tRequestProcW(int PluginNr,int RequestType,WCHAR* CustomTitle,WCHAR* CustomText,WCHAR* ReturnedText,int maxlen)
{
	VARIANT vCustomTitle, vCustomText, vReturnedText;
	VariantInit(&vCustomText);
	VariantInit(&vCustomTitle);
	VariantInit(&vReturnedText);
	teSetSZ(&vCustomTitle, CustomTitle);
	teSetSZ(&vCustomText, CustomText);
	teSetSZ(&vReturnedText, ReturnedText);
	BOOL bResult = TRUE;
	twfx_tProcV(g_pdispCryptProc, PluginNr, RequestType, &vCustomTitle, &vCustomText, &vReturnedText, &bResult);
	if (ReturnedText && maxlen && RequestType < 8 && vReturnedText.vt == VT_BSTR) {
		lstrcpyn(ReturnedText, vReturnedText.bstrVal, maxlen);
	}
	VariantClear(&vReturnedText);
	return bResult;
}

int __stdcall twfx_tCryptProc(int PluginNr,int CryptoNumber,int mode,char* ConnectionName,char* Password,int maxlen)
{
	VARIANT vConnectionName, vPassword, vMode;
	BOOL bOut = (mode == 2 || mode == 3);
	VariantInit(&vConnectionName);
	if (!bOut) {
		VariantInit(&vPassword);
	}
	VariantInit(&vMode);
	teSetSZA(&vConnectionName, ConnectionName, CP_ACP);
	teSetSZA(&vPassword, Password, CP_ACP);
	teSetLong(&vMode, mode);
	int iResult = FS_FILE_NOTSUPPORTED;
	twfx_tProcV(g_pdispCryptProc, PluginNr, CryptoNumber, &vMode, &vConnectionName, &vPassword, &iResult);
	if (Password && maxlen && bOut) {
		if (vPassword.vt == VT_BSTR) {
			WideCharToMultiByte(CP_ACP, 0, (LPCWSTR)vPassword.bstrVal, -1, (LPSTR)Password, maxlen, NULL, NULL);
		} else {
			Password[0] = NULL;
		}
	}
	VariantClear(&vPassword);
	return iResult;
}

int __stdcall twfx_tCryptProcW(int PluginNr,int CryptoNumber,int mode,WCHAR* ConnectionName,WCHAR* Password,int maxlen)
{
	VARIANT vConnectionName, vPassword, vMode;
	BOOL bOut = (mode == 2 || mode == 3);
	VariantInit(&vConnectionName);
	VariantInit(&vPassword);
	VariantInit(&vMode);
	teSetSZ(&vConnectionName, ConnectionName);
	if (!bOut) {
		teSetSZ(&vPassword, Password);
	}
	teSetLong(&vMode, mode);
	int iResult = FS_FILE_NOTSUPPORTED;
	twfx_tProcV(g_pdispCryptProc, PluginNr, CryptoNumber, &vMode, &vConnectionName, &vPassword, &iResult);
	if (bOut && Password && maxlen) {
		if (vPassword.vt == VT_BSTR) {
			lstrcpyn(Password, vPassword.bstrVal, maxlen);
		} else {
			Password[0] = NULL;
		}
	}
	VariantClear(&vPassword);
	return iResult;
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

VOID ConvWin32FindDataFromA(WIN32_FIND_DATAW *pwfd, WIN32_FIND_DATAA *pwfda)
{
	pwfd->dwFileAttributes = pwfda->dwFileAttributes;
	pwfd->ftCreationTime = pwfda->ftCreationTime;
	pwfd->ftLastAccessTime = pwfda->ftLastAccessTime;
	pwfd->ftLastWriteTime = pwfda->ftLastWriteTime;
	pwfd->nFileSizeHigh = pwfda->nFileSizeHigh;
	pwfd->nFileSizeLow = pwfda->nFileSizeLow;
	pwfd->dwReserved0 = pwfda->dwReserved0;
	pwfd->dwReserved1 = pwfda->dwReserved1;
	MultiByteToWideChar(CP_ACP, 0, pwfda->cFileName, MAX_PATH, pwfd->cFileName, MAX_PATH);
	MultiByteToWideChar(CP_ACP, 0, pwfda->cAlternateFileName, 14, pwfd->cAlternateFileName, 14);
}

HRESULT teExecMethod(IDispatch *pdisp, LPOLESTR sz, VARIANT *pvResult, int nArg, VARIANTARG *pvArgs)
{
	DISPID dispid;
	HRESULT hr = pdisp->GetIDsOfNames(IID_NULL, &sz, 1, LOCALE_USER_DEFAULT, &dispid);
	if (hr == S_OK) {
		return Invoke5(pdisp, dispid, DISPATCH_METHOD, pvResult, nArg, pvArgs);
	}
	teClearVariantArgs(nArg, pvArgs);
	return hr;
}

BOOL teGetVariantTime(VARIANT *pv, DATE *pdt)
{
	VARIANT v;
	VariantInit(&v);
	VariantCopy(&v, pv);
	IDispatch *pdisp;
	if (GetDispatch(&v, &pdisp)) {
		VariantClear(&v);
		teExecMethod(pdisp, L"getVarDate", &v, 0, NULL);
		pdisp->Release();
	}
	if (v.vt != VT_DATE) {
		VariantClear(&v);
		teVariantChangeType(&v, pv, VT_DATE);
	}
	if (v.vt == VT_DATE) {
		*pdt = v.date;
		return TRUE;
	}
	VariantClear(&v);
	return FALSE;
}

BOOL teVariantTimeToFileTime(DOUBLE dt, LPFILETIME pft)
{
	SYSTEMTIME SysTime;
	if (::VariantTimeToSystemTime(dt, &SysTime)) {
		FILETIME ft;
		if (::SystemTimeToFileTime(&SysTime, &ft)) {
			return ::LocalFileTimeToFileTime(&ft, pft);
		}
	}
	return FALSE;
}

BOOL teVariantTimeToFileTimeEx(VARIANT *pv, LPFILETIME pft)
{
	DATE dt;
	if (teGetVariantTime(pv, &dt)) {
		return teVariantTimeToFileTime(dt, pft);
	}
	return FALSE;
}

BOOL teFileTimeToVariantTime(LPFILETIME pft, DOUBLE *pdt)
{
	FILETIME ft;
	if (::FileTimeToLocalFileTime(pft, &ft)) {
		SYSTEMTIME SysTime;
		if (::FileTimeToSystemTime(&ft, &SysTime)) {
			return ::SystemTimeToVariantTime(&SysTime, pdt);
		}
	}
	return FALSE;
}

BOOL GetRIFromVariant(VARIANT *pv, RemoteInfoStruct *pri)
{
	IDispatch *pdisp;
	if (GetDispatch(pv, &pdisp)) {
		VARIANT v;
		VariantInit(&v);
		teGetProperty(pdisp, L"SizeLow", &v);
		pri->SizeLow = GetIntFromVariantClear(&v);
		teGetProperty(pdisp, L"SizeHigh", &v);
		pri->SizeHigh = GetIntFromVariantClear(&v);
		teGetProperty(pdisp, L"LastWriteTime", &v);
		teVariantTimeToFileTimeEx(&v, &pri->LastWriteTime);
		VariantClear(&v);
		teGetProperty(pdisp, L"Attr", &v);
		pri->Attr = GetIntFromVariantClear(&v);
		return TRUE;
	}
	return FALSE;
}

VOID SetWin32FindData(IUnknown *punk, WIN32_FIND_DATAW *pwfd)
{
	VARIANT v;
	teSetLong(&v, pwfd->dwFileAttributes);
	tePutProperty(punk, L"dwFileAttributes", &v);
	if (teFileTimeToVariantTime(&pwfd->ftCreationTime, &v.date)) {
		v.vt = VT_DATE;
		tePutProperty(punk, L"ftCreationTime", &v);
	}
	if (teFileTimeToVariantTime(&pwfd->ftLastAccessTime, &v.date)) {
		v.vt = VT_DATE;
		tePutProperty(punk, L"ftLastAccessTime", &v);
	}
	if (teFileTimeToVariantTime(&pwfd->ftLastWriteTime, &v.date)) {
		v.vt = VT_DATE;
		tePutProperty(punk, L"ftLastWriteTime", &v);
	}
	teSetLL(&v, pwfd->nFileSizeHigh);
	tePutProperty(punk, L"nFileSizeHigh", &v);
	teSetLL(&v, pwfd->nFileSizeLow);
	tePutProperty(punk, L"nFileSizeLow", &v);
	teSetLong(&v, pwfd->dwReserved0);
	tePutProperty(punk, L"dwReserved0", &v);
	teSetLong(&v, pwfd->dwReserved1);
	tePutProperty(punk, L"dwReserved1", &v);
	teSetSZ(&v, pwfd->cFileName);
	tePutProperty(punk, L"cFileName", &v);
	VariantClear(&v);
	teSetSZ(&v, pwfd->cAlternateFileName);
	tePutProperty(punk, L"cAlternateFileName", &v);
	VariantClear(&v);
}

// Initialize & Finalize
BOOL WINAPI DllMain(HINSTANCE hinstDll, DWORD dwReason, LPVOID lpReserved)
{
	switch (dwReason) {
		case DLL_PROCESS_ATTACH:
			for (int i = MAX_OBJ; i--;) {
				g_ppObject[i] = NULL;
			}
			g_pBase = new CteBase();
			g_hinstDll = hinstDll;
			break;
		case DLL_PROCESS_DETACH:
			for (int i = MAX_OBJ; i--;) {
				if (g_ppObject[i]) {
					g_ppObject[i]->Close();
					SafeRelease(&g_ppObject[i]);
				}
			}
			SafeRelease(&g_pBase);
			SafeRelease(&g_pdispProgressProc);
			SafeRelease(&g_pdispLogProc);
			SafeRelease(&g_pdispRequestProc);
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

//CteWFX

CteWFX::CteWFX(HMODULE hDll, LPWSTR lpLib)
{
	m_cRef = 1;
	m_hDll = hDll;
	m_bsLib = ::SysAllocString(lpLib);

	teGetProcAddress(m_hDll, "FsInit", (FARPROC *)&FsInit, (FARPROC *)&FsInitW);
	teGetProcAddress(m_hDll, "FsFindFirst", (FARPROC *)&FsFindFirst, (FARPROC *)&FsFindFirstW);
	teGetProcAddress(m_hDll, "FsFindNext", (FARPROC *)&FsFindNext, (FARPROC *)&FsFindNextW);
	teGetProcAddress(m_hDll, "FsFindClose", (FARPROC *)&FsFindClose, NULL);
	teGetProcAddress(m_hDll, "FsGetDefRootName", (FARPROC *)&FsGetDefRootName, NULL);
	teGetProcAddress(m_hDll, "FsGetFile", (FARPROC *)&FsGetFile, (FARPROC *)&FsGetFileW);
	teGetProcAddress(m_hDll, "FsPutFile", (FARPROC *)&FsPutFile, (FARPROC *)&FsPutFileW);
	teGetProcAddress(m_hDll, "FsRenMovFile", (FARPROC *)&FsRenMovFile, (FARPROC *)&FsRenMovFileW);
	teGetProcAddress(m_hDll, "FsDeleteFile", (FARPROC *)&FsDeleteFile, (FARPROC *)&FsDeleteFileW);
	teGetProcAddress(m_hDll, "FsRemoveDir", (FARPROC *)&FsRemoveDir, (FARPROC *)&FsRemoveDirW);
	teGetProcAddress(m_hDll, "FsMkDir", (FARPROC *)&FsMkDir, (FARPROC *)&FsMkDirW);
	teGetProcAddress(m_hDll, "FsExecuteFile", (FARPROC *)&FsExecuteFile, (FARPROC *)&FsExecuteFileW);
	teGetProcAddress(m_hDll, "FsSetAttr", (FARPROC *)&FsSetAttr, (FARPROC *)&FsSetAttrW);
	teGetProcAddress(m_hDll, "FsSetTime", (FARPROC *)&FsSetTime, (FARPROC *)&FsSetTimeW);
	teGetProcAddress(m_hDll, "FsDisconnect", (FARPROC *)&FsDisconnect, (FARPROC *)&FsDisconnectW);
	teGetProcAddress(m_hDll, "FsExtractCustomIcon", (FARPROC *)&FsExtractCustomIcon, (FARPROC *)&FsExtractCustomIconW);
	teGetProcAddress(m_hDll, "FsSetCryptCallback", (FARPROC *)&FsSetCryptCallback, (FARPROC *)&FsSetCryptCallbackW);
	teGetProcAddress(m_hDll, "FsSetDefaultParams", (FARPROC *)&FsSetDefaultParams, NULL);
}

CteWFX::~CteWFX()
{
	Close();
	for (int i = MAX_OBJ; i--;) {
		if (this == g_ppObject[i]) {
			g_ppObject[i] = NULL;
			break;
		}
	}
}

VOID CteWFX::Close()
{
	if (m_hDll) {
		FreeLibrary(m_hDll);
		m_hDll = NULL;
	}
	FsInit = NULL;
	FsInitW = NULL;
	FsFindFirst = NULL;
	FsFindFirstW = NULL;
	FsFindNext = NULL;
	FsFindNextW = NULL;
	FsFindClose = NULL;
	FsGetDefRootName = NULL;
	FsGetFile = NULL;
	FsGetFileW = NULL;
	FsPutFile = NULL;
	FsPutFileW = NULL;
	FsRenMovFile = NULL;
	FsRenMovFileW = NULL;
	FsDeleteFile = NULL;
	FsDeleteFileW = NULL;
	FsRemoveDir = NULL;
	FsRemoveDirW = NULL;
	FsMkDir = NULL;
	FsMkDirW = NULL;
	FsExecuteFile = NULL;
	FsExecuteFileW = NULL;
	FsSetAttr = NULL;
	FsSetAttrW = NULL;
	FsSetTime = NULL;
	FsSetTimeW = NULL;
	FsDisconnect = NULL;
	FsDisconnectW = NULL;
	FsExtractCustomIcon = NULL;
	FsExtractCustomIconW = NULL;
	FsSetCryptCallback = NULL;
	FsSetCryptCallbackW = NULL;
	FsSetDefaultParams = NULL;
}

STDMETHODIMP CteWFX::QueryInterface(REFIID riid, void **ppvObject)
{
	static const QITAB qit[] =
	{
		QITABENT(CteWFX, IDispatch),
		{ 0 },
	};
	return QISearch(this, qit, riid, ppvObject);
}

STDMETHODIMP_(ULONG) CteWFX::AddRef()
{
	return ::InterlockedIncrement(&m_cRef);
}

STDMETHODIMP_(ULONG) CteWFX::Release()
{
	if (::InterlockedDecrement(&m_cRef) == 0) {
		delete this;
		return 0;
	}
	return m_cRef;
}

STDMETHODIMP CteWFX::GetTypeInfoCount(UINT *pctinfo)
{
	*pctinfo = 0;
	return S_OK;
}

STDMETHODIMP CteWFX::GetTypeInfo(UINT iTInfo, LCID lcid, ITypeInfo **ppTInfo)
{
	return E_NOTIMPL;
}

STDMETHODIMP CteWFX::GetIDsOfNames(REFIID riid, LPOLESTR *rgszNames, UINT cNames, LCID lcid, DISPID *rgDispId)
{
	return teGetDispId(methodTWFX, _countof(methodTWFX), NULL, *rgszNames, rgDispId);
}

STDMETHODIMP CteWFX::Invoke(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags, DISPPARAMS *pDispParams, VARIANT *pVarResult, EXCEPINFO *pExcepInfo, UINT *puArgErr)
{
	int nArg = pDispParams ? pDispParams->cArgs - 1 : -1;
	try {
		switch (dispIdMember) {
			//FsInit
			case 0x60010001:
				if (nArg >= 4) {
					int iResult = 1;
					int iPluginNr = GetIntFromVariant(&pDispParams->rgvarg[nArg]);
					SafeRelease(&g_pdispArrayProc);
					GetDispatch(&pDispParams->rgvarg[nArg - 1], &g_pdispArrayProc);
					SafeRelease(&g_pdispProgressProc);
					GetDispatch(&pDispParams->rgvarg[nArg - 2], &g_pdispProgressProc);
					SafeRelease(&g_pdispLogProc);
					GetDispatch(&pDispParams->rgvarg[nArg - 3], &g_pdispLogProc);
					SafeRelease(&g_pdispRequestProc);
					GetDispatch(&pDispParams->rgvarg[nArg - 4], &g_pdispRequestProc);
					if (FsInitW) {
						iResult = FsInitW(iPluginNr, twfx_tProgressProcW, twfx_tLogProcW, twfx_tRequestProcW);
					} else if (FsInit) {
						iResult = FsInit(iPluginNr, twfx_tProgressProc, twfx_tLogProc, twfx_tRequestProc);
					}
					teSetLong(pVarResult, iResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					teSetBool(pVarResult, FsInitW || FsInit);
				}
				return S_OK;		
			//FsFindFirst
			case 0x60010002:
				if (nArg >= 1) {
					HANDLE hFind = INVALID_HANDLE_VALUE;
					IUnknown *punk;
					if (FindUnknown(&pDispParams->rgvarg[nArg - 1], &punk)) {
						LPWSTR lpPath = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
						WIN32_FIND_DATAW wfd = { 0 };
						if (FsFindFirstW) {
							hFind = FsFindFirstW(lpPath, &wfd);
						} else if (FsFindFirst) {
							WIN32_FIND_DATAA wfda = { 0 };
							BSTR bsPath = teWide2Ansi(lpPath, -1);
							hFind = FsFindFirst((char *)bsPath, &wfda);
							teSysFreeString(&bsPath);
							if (hFind != INVALID_HANDLE_VALUE) {
								ConvWin32FindDataFromA(&wfd, &wfda);
							}
						}
						if (hFind != INVALID_HANDLE_VALUE) {
							SetWin32FindData(punk, &wfd);
						}
					}
					teSetLL(pVarResult, (LONGLONG)hFind);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					teSetBool(pVarResult, FsFindFirstW || FsFindFirst);
				}
				return S_OK;
			//FsFindNext
			case 0x60010003:
				if (nArg >= 1) {
					BOOL bResult = FALSE;
					IDispatch *pdisp;
					if (GetDispatch(&pDispParams->rgvarg[nArg - 1], &pdisp)) {
						HANDLE hFind = (HANDLE)GetPtrFromVariant(&pDispParams->rgvarg[nArg]);
						WIN32_FIND_DATAW wfd = { 0 };
						VARIANT v;
						VariantInit(&v);
						teGetProperty(pdisp, L"dwFileAttributes", &v);
						wfd.dwFileAttributes = GetIntFromVariantClear(&v);
						if (FsFindNextW) {
							bResult = FsFindNextW(hFind, &wfd);
						} else if (FsFindFirst) {
							WIN32_FIND_DATAA wfda = { 0 };
							wfda.dwFileAttributes = wfd.dwFileAttributes;
							bResult = FsFindNext(hFind, &wfda);
							if (bResult) {
								ConvWin32FindDataFromA(&wfd, &wfda);
							}
						}
						if (bResult) {
							SetWin32FindData(pdisp, &wfd);
						}
						SafeRelease(&pdisp);
					}
					teSetBool(pVarResult, bResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					teSetBool(pVarResult, FsFindNextW || FsFindNext);
				}
				return S_OK;
			//FsFindClose
			case 0x60010004:
				if (nArg >= 0) {
					int iResult = 1;
					if (FsFindClose) {
						iResult = FsFindClose((HANDLE)GetPtrFromVariant(&pDispParams->rgvarg[nArg]));
					}
					teSetLong(pVarResult, iResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					teSetBool(pVarResult, FsFindClose != NULL);
				}
				return S_OK;
			//FsGetDefRootName
			case 0x60010005:
				if (FsGetDefRootName) {
					char DefRootName[MAX_PATH];
					DefRootName[0] = NULL;
					FsGetDefRootName(DefRootName, MAX_PATH);
					teSetSZA(pVarResult, DefRootName, CP_ACP);
				}
				return S_OK;
			//FsGetFile
			case 0x60010006:
				if (nArg >= 3) {
					int iResult = 0;
					LPWSTR lpRemoteName = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
					LPWSTR lpLocalName = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 1]);
					int nCopyFlags = GetIntFromVariant(&pDispParams->rgvarg[nArg - 2]);
					RemoteInfoStruct ri = { 0 };
					if (GetRIFromVariant(&pDispParams->rgvarg[nArg - 3], &ri)) {
						if (FsGetFileW) {
							iResult = FsGetFileW(lpRemoteName, lpLocalName, nCopyFlags, &ri);
						} else if (FsGetFile) {
							BSTR bsRemoteName = teWide2Ansi(lpRemoteName, -1);
							BSTR bsLocalName = teWide2Ansi(lpLocalName, -1);
							iResult = FsGetFile((char *)bsRemoteName, (char *)bsLocalName, nCopyFlags, &ri);
							teSysFreeString(&bsLocalName);
							teSysFreeString(&bsRemoteName);
						}
					}
					teSetLong(pVarResult, iResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					teSetBool(pVarResult, FsGetFileW || FsGetFile);
				}
				return S_OK;
			//FsPutFile
			case 0x60010007:
				if (nArg >= 2) {
					int iResult = 0;
					LPWSTR lpLocalName = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
					LPWSTR lpRemoteName = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 1]);
					int nCopyFlags = GetIntFromVariant(&pDispParams->rgvarg[nArg - 2]);
					if (FsPutFileW) {
						iResult = FsPutFileW(lpLocalName, lpRemoteName, nCopyFlags);
					} else if (FsPutFile) {
						BSTR bsRemoteName = teWide2Ansi(lpRemoteName, -1);
						BSTR bsLocalName = teWide2Ansi(lpLocalName, -1);
						iResult = FsPutFile((char *)bsLocalName, (char *)bsRemoteName, nCopyFlags);
						teSysFreeString(&bsLocalName);
						teSysFreeString(&bsRemoteName);
					}
					teSetLong(pVarResult, iResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					teSetBool(pVarResult, FsPutFileW || FsPutFile);
				}
				return S_OK;
			//FsRenMovFile
			case 0x60010008:
				if (nArg >= 4) {
					int iResult = 0;
					LPWSTR lpOldName = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
					LPWSTR lpNewName = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 1]);
					BOOL bMove = GetIntFromVariant(&pDispParams->rgvarg[nArg - 2]);
					BOOL bOverWrite = GetIntFromVariant(&pDispParams->rgvarg[nArg - 3]);
					RemoteInfoStruct ri = { 0 };
					if (GetRIFromVariant(&pDispParams->rgvarg[nArg - 4], &ri)) {
						if (FsRenMovFileW) {
							iResult = FsRenMovFileW(lpOldName, lpNewName, bMove, bOverWrite, &ri);
						} else if (FsRenMovFile) {
							BSTR bsOldName = teWide2Ansi(lpOldName, -1);
							BSTR bsNewName = teWide2Ansi(lpNewName, -1);
							iResult = FsRenMovFile((char *)bsOldName, (char *)bsNewName, bMove, bOverWrite, &ri);
							teSysFreeString(&bsNewName);
							teSysFreeString(&bsOldName);
						}
					}
					teSetLong(pVarResult, iResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					teSetBool(pVarResult, FsRenMovFileW || FsRenMovFile);
				}
				return S_OK;
			case 0x60010009:
			//FsDeleteFile
				if (nArg >= 0) {
					BOOL bResult = FALSE;
					LPWSTR lpPath = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
					if (FsDeleteFileW) {
						bResult = FsDeleteFileW(lpPath);
					} else if (FsDeleteFile) {
						BSTR bsPath = teWide2Ansi(lpPath, -1);
						bResult = FsDeleteFile((char *)bsPath);
						teSysFreeString(&bsPath);
					}
					teSetBool(pVarResult, bResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					teSetBool(pVarResult, FsDeleteFileW || FsDeleteFile);
				}
				return S_OK;
			//FsRemoveDir
			case 0x6001000A:
				if (nArg >= 0) {
					BOOL bResult = FALSE;
					LPWSTR lpPath = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
					if (FsRemoveDirW) {
						bResult = FsRemoveDirW(lpPath);
					} else if (FsRemoveDir) {
						BSTR bsPath = teWide2Ansi(lpPath, -1);
						bResult = FsRemoveDir((char *)bsPath);
						teSysFreeString(&bsPath);
					}
					teSetBool(pVarResult, bResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					teSetBool(pVarResult, FsRemoveDirW || FsRemoveDir);
				}
				return S_OK;
			//FsMkDir
			case 0x6001000B:
				if (nArg >= 0) {
					BOOL bResult = FALSE;
					LPWSTR lpPath = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
					if (FsMkDirW) {
						bResult = FsMkDirW(lpPath);
					} else if (FsMkDir) {
						BSTR bsPath = teWide2Ansi(lpPath, -1);
						bResult = FsMkDir((char *)bsPath);
						teSysFreeString(&bsPath);
					}
					teSetBool(pVarResult, bResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					teSetBool(pVarResult, FsMkDirW || FsMkDir);
				}
				return S_OK;
			//FsExecuteFile
			case 0x6001000C:
				if (nArg >= 2) {
					int iResult = FS_EXEC_YOURSELF;
					IDispatch *pdisp;
					if (GetDispatch(&pDispParams->rgvarg[nArg - 1], &pdisp)) {
						WCHAR szRemoteName[1024];
						VARIANT v;
						VariantInit(&v);
						teGetProperty(pdisp, L"0", &v);
						LPWSTR lpRemoteName = GetLPWSTRFromVariant(&v);
						lstrcpyn(szRemoteName, lpRemoteName, 1024);
						HWND hwndMain = (HWND)GetPtrFromVariant(&pDispParams->rgvarg[nArg]);
						LPWSTR lpVerb = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 2]);
						if (FsExecuteFileW) {
							iResult = FsExecuteFileW(hwndMain, szRemoteName, lpVerb);
						} else if (FsExecuteFile) {
							char szRemoteNameA[1024];
							WideCharToMultiByte(CP_ACP, 0, (LPCWSTR)szRemoteName, -1, (LPSTR)szRemoteNameA, 1024, NULL, NULL);
							BSTR bsVerb = teWide2Ansi(lpVerb, -1);
							iResult = FsExecuteFile(hwndMain, szRemoteNameA, (char *)bsVerb);
							teSysFreeString(&bsVerb);
							MultiByteToWideChar(CP_ACP, 0, szRemoteNameA, -1, szRemoteName, 1024);
						}
						VariantClear(&v);
						teSetSZ(&v, szRemoteName);
						tePutProperty(pdisp, L"0", &v);
						pdisp->Release();
					}
					teSetLong(pVarResult, iResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					teSetBool(pVarResult, FsExecuteFileW || FsExecuteFile);
				}
				return S_OK;
			//FsSetAttr
			case 0x6001000D:
				if (nArg >= 1) {
					BOOL bResult = FALSE;
					LPWSTR lpPath = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
					int iNewAttr = GetIntFromVariant(&pDispParams->rgvarg[nArg - 1]);
					if (FsSetAttrW) {
						bResult = FsSetAttrW(lpPath, iNewAttr);
					} else if (FsSetAttr) {
						BSTR bsPath = teWide2Ansi(lpPath, -1);
						bResult = FsSetAttr((char *)bsPath, iNewAttr);
						teSysFreeString(&bsPath);
					}
					teSetBool(pVarResult, bResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					teSetBool(pVarResult, FsSetAttrW || FsSetAttr);
				}
				return S_OK;
			//FsSetTime
			case 0x6001000E:
				if (nArg >= 3) {
					BOOL bResult = FALSE;
					LPWSTR lpPath = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
					FILETIME *ppft[3];
					FILETIME pft[3];
					for (int i = 3; i--;) {
						ppft[i] = teVariantTimeToFileTimeEx(&pDispParams->rgvarg[nArg - i - 1], &pft[i]) ? &pft[i] : NULL;
					}
					if (FsSetTimeW) {
						bResult = FsSetTimeW(lpPath, ppft[0], ppft[1], ppft[2]);
					} else if (FsSetTime) {
						BSTR bsPath = teWide2Ansi(lpPath, -1);
						bResult = FsSetTime((char *)bsPath, ppft[0], ppft[1], ppft[2]);
						teSysFreeString(&bsPath);
					}
					teSetBool(pVarResult, bResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					teSetBool(pVarResult, FsSetTimeW || FsSetTime);
				}
				return S_OK;
			//FsDisconnect
			case 0x6001000F:
				if (nArg >= 0) {
					BOOL bResult = FALSE;
					LPWSTR lpPath = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
					if (FsDisconnectW) {
						bResult = FsDisconnectW(lpPath);
					} else if (FsDisconnect) {
						BSTR bsPath = teWide2Ansi(lpPath, -1);
						bResult = FsDisconnect((char *)bsPath);
						teSysFreeString(&bsPath);
					}
					teSetBool(pVarResult, bResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					teSetBool(pVarResult, FsDisconnectW || FsDisconnect);
				}
				return S_OK;
			//FsExtractCustomIcon
			case 0x60010010:
				if (nArg >= 2) {
					BOOL iResult = FS_ICON_USEDEFAULT;	
					IUnknown *punk;
					if (FindUnknown(&pDispParams->rgvarg[nArg - 2], &punk)) {
						LPWSTR lpPath = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
						int iExtractFlags = GetIntFromVariant(&pDispParams->rgvarg[nArg - 1]);
						HICON hIcon;
						if (FsExtractCustomIconW) {
							iResult = FsExtractCustomIconW(lpPath, iExtractFlags, &hIcon);
						} else if (FsExtractCustomIcon) {
							BSTR bsPath = teWide2Ansi(lpPath, -1);
							iResult = FsExtractCustomIcon((char *)bsPath, iExtractFlags, &hIcon);
							teSysFreeString(&bsPath);
						}
						VARIANT v;
						teSetPtr(&v, hIcon);
						tePutProperty(punk, L"0", &v);
						VariantClear(&v);
					}
					teSetLong(pVarResult, iResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					teSetBool(pVarResult, FsSetAttrW || FsSetAttr);
				}
				return S_OK;
			//FsSetCryptCallback
			case 0x60010011:
				if (nArg >= 2) {
					SafeRelease(&g_pdispCryptProc);
					GetDispatch(&pDispParams->rgvarg[nArg], &g_pdispCryptProc);
					int iCryptoNr = GetIntFromVariant(&pDispParams->rgvarg[nArg - 1]);
					int iFlags = GetIntFromVariant(&pDispParams->rgvarg[nArg - 2]);
					if (FsSetCryptCallbackW) {
						FsSetCryptCallbackW(twfx_tCryptProcW, iCryptoNr, iFlags);
					} else if (FsSetCryptCallback) {
						FsSetCryptCallback(twfx_tCryptProc, iCryptoNr, iFlags);
					}
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					teSetBool(pVarResult, FsSetCryptCallbackW || FsSetCryptCallback);
				}
				return S_OK;
			//FsSetDefaultParams
			case 0x60010012:
				if (nArg >= 0 && FsSetDefaultParams) {
					FsDefaultParamStruct dps = { sizeof(FsDefaultParamStruct), 10, 2 };
					LPWSTR lpPath = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
					if (lpPath) {
						WideCharToMultiByte(CP_ACP, 0, (LPCWSTR)lpPath, -1, dps.DefaultIniName, MAX_PATH, NULL, NULL);
					}
					FsSetDefaultParams(&dps);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					teSetBool(pVarResult, FsSetDefaultParams != NULL);
				}
				return S_OK;
			//IsUnicode
			case 0x6001FFFF:
				teSetBool(pVarResult, FsInitW != NULL);
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
	return teGetDispId(methodBASE, _countof(methodBASE), NULL, *rgszNames, rgDispId);
}

STDMETHODIMP CteBase::Invoke(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags, DISPPARAMS *pDispParams, VARIANT *pVarResult, EXCEPINFO *pExcepInfo, UINT *puArgErr)
{
	int nArg = pDispParams ? pDispParams->cArgs - 1 : -1;
	HRESULT hr = S_OK;

	switch (dispIdMember) {
		//Open
		case 0x60010000:
			if (nArg >= 0) {
				LPWSTR lpLib = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);

				int nEmpty = -1;
				CteWFX *pItem;
				for (int i = MAX_OBJ; i--;) {
					pItem = g_ppObject[i];
					if (pItem) {
						if (lstrcmpi(lpLib, pItem->m_bsLib) == 0) {
							teSetObject(pVarResult, pItem);
							return S_OK;
						}
					} else if (nEmpty < 0) {
						nEmpty = i;
					}
				}
				if (nEmpty >= 0) {
					HMODULE hDll = LoadLibrary(lpLib);
					if (hDll) {
						pItem = new CteWFX(hDll, lpLib);
						g_ppObject[nEmpty] = pItem;
						teSetObjectRelease(pVarResult, pItem);
					}
				}
			}
			return S_OK;
		//Close
		case 0x6001000C:
			if (nArg >= 0) {
				LPWSTR lpLib = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);

				for (int i = MAX_OBJ; i--;) {
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
