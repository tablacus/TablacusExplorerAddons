#include "resource.h"
#include <windows.h>
#include <dispex.h>
#include <vector>
#include <unordered_map>
#include <shlwapi.h>
#pragma comment (lib, "shlwapi.lib")

#define TE_METHOD		0x60010000
#define TE_METHOD_MAX	0x6001ffff
#define TE_METHOD_MASK	0x0000ffff
#define TE_PROPERTY		0x40010000

#define FNAME_MAX32		512
typedef HGLOBAL HARC;

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

#define CAL_Lib		0
#define CAL_Head	1
#define CAL_Name	2
#define CAL_Extract	3
#define CAL_Add		4
#define CAL_Delete	5
#define CAL_Filter	6
#define CAL_Preview	7
#define CAL_PreviewFilter	8
#define CAL_Count	9

#define BSTRA	LPSTR

//Plug in(Image)
typedef HRESULT (WINAPI* LPFNGetImage)(IStream *pStream, LPCWSTR lpPath, int cx, HBITMAP *phBM, int *pnAlpha);

// Common Archivers Library structs

typedef struct {
	DWORD	dwOriginalSize;
	DWORD	dwCompressedSize;
	DWORD	dwCRC;
	UINT	uFlag;
	UINT	uOSType;
	WORD	wRatio;
	WORD	wDate;
	WORD	wTime;
	char	szFileName[FNAME_MAX32 + 1];
	char	dummy1[3];
	char	szAttribute[8];
	char	szMode[8];
}	INDIVIDUALINFO, *LPINDIVIDUALINFO;

typedef struct {
	DWORD	dwOriginalSize;
	DWORD	dwCompressedSize;
	DWORD	dwCRC;
	UINT	uFlag;
	UINT	uOSType;
	WORD	wRatio;
	WORD	wDate;
	WORD	wTime;
	WCHAR	szFileName[FNAME_MAX32 + 1];
	WCHAR	dummy1[3];
	WCHAR	szAttribute[8];
	WCHAR	szMode[8];
}	INDIVIDUALINFOW, *LPINDIVIDUALINFOW;

// Common Archivers Library functions

typedef int (WINAPI *LPFNCAL)(const HWND hwnd, LPCSTR szCmdLine,LPSTR szOutput,const DWORD wSize);
typedef int (WINAPI *LPFNCALW)(const HWND hwnd, LPCWSTR szCmdLine,LPWSTR szOutput,const DWORD wSize);
typedef WORD (WINAPI *LPFNCALGETVERSION)();
typedef BOOL (WINAPI *LPFNCALGETRUNNING)();
typedef BOOL (WINAPI *LPFNCALCHECKARCHIVE)(LPCSTR szFileName, const int iMode);
typedef BOOL (WINAPI *LPFNCALCHECKARCHIVEW)(LPCWSTR szFileName, const int iMode);
typedef BOOL (WINAPI *LPFNCALCONFIGDIALOG)(const HWND hwnd, LPSTR szOptionBuffer, const int iMode);
typedef BOOL (WINAPI *LPFNCALCONFIGDIALOGW)(const HWND hwnd, LPWSTR szOptionBuffer, const int iMode);
typedef HARC (WINAPI *LPFNCALOPENARCHIVE) (const HWND hwnd,LPCSTR szFileName,const DWORD dwMode);
typedef HARC (WINAPI *LPFNCALOPENARCHIVEW) (const HWND hwnd,LPCWSTR szFileName,const DWORD dwMode);
typedef int (WINAPI *LPFNCALCLOSEARCHIVE)(HARC harc);
typedef int (WINAPI *LPFNCALFINDFIRST)(HARC harc, LPCSTR szWildName,INDIVIDUALINFO *lpSubInfo);
typedef int (WINAPI *LPFNCALFINDFIRSTW)(HARC harc, LPCWSTR szWildName,INDIVIDUALINFOW *lpSubInfo);
typedef int (WINAPI *LPFNCALFINDNEXT)(HARC harc, INDIVIDUALINFO *lpSubInfo);
typedef int (WINAPI *LPFNCALFINDNEXTW)(HARC harc, INDIVIDUALINFOW *lpSubInfo);
typedef BOOL (WINAPI *LPFNCALSETUNICODEMODE)(BOOL bUnicode);
typedef	int (WINAPI *LPFNCALEXTRACTMEM)(HWND hwnd, LPCSTR szCmdLine, LPBYTE szBuffer, DWORD dwSize, time_t *lpTime, LPWORD lpwAttr, LPDWORD lpdwWriteSize);
typedef	int (WINAPI *LPFNCALEXTRACTMEMW)(HWND hwnd, LPCWSTR szCmdLine, LPBYTE szBuffer, DWORD dwSize, time_t *lpTime, LPWORD lpwAttr, LPDWORD lpdwWriteSize);
//typedef BOOL (WINAPI *LPFNSetOwnerWindow)(HWND _hwnd);
//typedef BOOL (WINAPI *LPFNClearOwnerWindow)(VOID);

// Common Archiver Library Wrapper Object
class CteCAL : public IDispatch
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

	CteCAL(HMODULE hDll, LPWSTR lpLib, LPWSTR lpHead);
	~CteCAL();

	VOID Init(HMODULE hDLL);
	VOID Free();
	HRESULT ExtractToStream(LPWSTR lpszArcPath, LPWSTR lpszFilter, IStream **ppStream);

	LPFNCAL CAL;
	LPFNCALW CALW;
	LPFNCALGETVERSION CALGetVersion;
	LPFNCALGETRUNNING CALGetRunning;
	LPFNCALCHECKARCHIVE CALCheckArchive;
	LPFNCALCHECKARCHIVEW CALCheckArchiveW;
	LPFNCALCONFIGDIALOG CALConfigDialog;
	LPFNCALCONFIGDIALOGW CALConfigDialogW;
	LPFNCALOPENARCHIVE CALOpenArchive;
	LPFNCALOPENARCHIVEW CALOpenArchiveW;
	LPFNCALCLOSEARCHIVE CALCloseArchive;
	LPFNCALFINDFIRST CALFindFirst;
	LPFNCALFINDFIRSTW CALFindFirstW;
	LPFNCALFINDNEXT CALFindNext;
	LPFNCALFINDNEXTW CALFindNextW;
	LPFNCALSETUNICODEMODE CALSetUnicodeMode;
	LPFNCALEXTRACTMEM CALExtractMem;
	LPFNCALEXTRACTMEMW CALExtractMemW;

	HMODULE		m_hCAL;
	BSTR		m_pbs[CAL_Count];
	int			m_CP;
	BOOL		m_bIsPreview;
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

class CteDispatch : public IDispatch
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

	CteDispatch(IDispatch *pDispatch, int nMode, DISPID dispId);
	~CteDispatch();

	VOID Clear();
public:
	DISPID		m_dispIdMember;
private:
	IDispatch	*m_pDispatch;
	LONG		m_cRef;
};
