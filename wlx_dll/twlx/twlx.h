#include "resource.h"
#include <windows.h>
#include <dispex.h>
#include <shlwapi.h>
#pragma comment (lib, "shlwapi.lib")
#include "listplug.h"

#define MAX_OBJ 64

struct TEmethod
{
	LONG   id;
	LPWSTR name;
};

#ifdef _WIN64
#define teSetPtr(pVar, nData)	teSetLL(pVar, (LONGLONG)nData)
#define GetPtrFromVariant(pv)	GetLLFromVariant(pv)
#else
#define teSetPtr(pVar, nData)	teSetLong(pVar, (LONG)nData)
#define GetPtrFromVariant(pv)	GetIntFromVariant(pv)
#endif

// Total Commander Lister Plug-in functions
typedef HWND (__stdcall *LPFN_ListLoad) (HWND ParentWin,char* FileToLoad,int ShowFlags);
typedef HWND (__stdcall *LPFN_ListLoadW) (HWND ParentWin,WCHAR* FileToLoad,int ShowFlags);
typedef int (__stdcall *LPFN_ListLoadNext) (HWND ParentWin,HWND ListWin,char* FileToLoad,int ShowFlags);
typedef int (__stdcall *LPFN_ListLoadNextW) (HWND ParentWin,HWND ListWin,WCHAR* FileToLoad,int ShowFlags);
typedef void (__stdcall *LPFN_ListCloseWindow) (HWND ListWin);
typedef void (__stdcall *LPFN_ListSetDefaultParams) (ListDefaultParamStruct* dps);
typedef HBITMAP (__stdcall *LPFN_ListGetPreviewBitmap) (char* FileToLoad,int width,int height, char* contentbuf,int contentbuflen);
typedef HBITMAP (__stdcall *LPFN_ListGetPreviewBitmapW) (WCHAR* FileToLoad,int width,int height, char* contentbuf,int contentbuflen);
typedef void (__stdcall *LPFN_ListGetDetectString) (char* DetectString,int maxlen);

// Total Commander Lister Plugin Wrapper Object
class CteWO : public IDispatch
{
public:
	STDMETHODIMP QueryInterface(REFIID riid, void **ppvObject);
	STDMETHODIMP_(ULONG) AddRef();
	STDMETHODIMP_(ULONG) Release();
	//IDispatch
	STDMETHODIMP GetTypeInfoCount(UINT *pctinfo);
	STDMETHODIMP GetTypeInfo(UINT iTInfo, LCID lcid, ITypeInfo **ppTInfo);
	STDMETHODIMP GetIDsOfNames(REFIID riid, LPOLESTR *rgszNames, UINT cNames, LCID lcid, DISPID *rgDispId);
	STDMETHODIMP Invoke(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags, DISPPARAMS *pDispParams, VARIANT *pVarResult, EXCEPINFO *pExcepInfo, UINT *puArgErr);

	CteWO(HMODULE hDll, LPWSTR lpLib);
	~CteWO();

	VOID Close();
	VOID SetChangeVolProc(HANDLE hArcData);
	VOID SetProcessDataProc(HANDLE hArcData);

	LPFN_ListLoad m_ListLoad;
	LPFN_ListLoadW m_ListLoadW;
	LPFN_ListLoadNext m_ListLoadNext;
	LPFN_ListLoadNextW m_ListLoadNextW;
	LPFN_ListCloseWindow m_ListCloseWindow;
	LPFN_ListSetDefaultParams m_ListSetDefaultParam;
	LPFN_ListGetPreviewBitmap m_ListGetPreviewBitmap;
	LPFN_ListGetPreviewBitmapW m_ListGetPreviewBitmapW;
	LPFN_ListGetDetectString m_ListGetDetectString;

	HMODULE		m_hDll;
	BSTR		m_bsLib;
private:
	LONG		m_cRef;
};

// Base Object
class CteBase : public IDispatch
{
public:
	STDMETHODIMP QueryInterface(REFIID riid, void **ppvObject);
	STDMETHODIMP_(ULONG) AddRef();
	STDMETHODIMP_(ULONG) Release();
	//IDispatch
	STDMETHODIMP GetTypeInfoCount(UINT *pctinfo);
	STDMETHODIMP GetTypeInfo(UINT iTInfo, LCID lcid, ITypeInfo **ppTInfo);
	STDMETHODIMP GetIDsOfNames(REFIID riid, LPOLESTR *rgszNames, UINT cNames, LCID lcid, DISPID *rgDispId);
	STDMETHODIMP Invoke(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags, DISPPARAMS *pDispParams, VARIANT *pVarResult, EXCEPINFO *pExcepInfo, UINT *puArgErr);

	CteBase();
	~CteBase();
private:
	LONG		m_cRef;
};

// Class Factory
class CteClassFactory : public IClassFactory
{
public:
	STDMETHODIMP QueryInterface(REFIID riid, void **ppvObject);
	STDMETHODIMP_(ULONG) AddRef();
	STDMETHODIMP_(ULONG) Release();
	
	STDMETHODIMP CreateInstance(IUnknown *pUnkOuter, REFIID riid, void **ppvObject);
	STDMETHODIMP LockServer(BOOL fLock);
};
