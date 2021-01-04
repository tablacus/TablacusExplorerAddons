#include "resource.h"
#include <windows.h>
#include <dispex.h>
#include <vector>
#include <unordered_map>
#include <shlwapi.h>
#pragma comment (lib, "shlwapi.lib")
#include "libgfl.h"

#define TE_METHOD		0x60010000
#define TE_METHOD_MAX	0x6001ffff
#define TE_METHOD_MASK	0x0000ffff
#define TE_PROPERTY		0x40010000
#define SIZE_BUFF 32768

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

// GFL SDK calback

// GFL SDK functions
typedef void (GFLAPI *LPFN_gflFreeBitmap)( GFL_BITMAP* bitmap );
typedef void (GFLAPI *LPFN_gflGetDefaultLoadParams)( GFL_LOAD_PARAMS* params ); 
typedef void (GFLAPI *LPFN_gflGetDefaultThumbnailParams)( GFL_LOAD_PARAMS* params ); 
typedef const char* (GFLAPI *LPFN_gflGetErrorString)( GFL_ERROR error ); 
typedef const char* (GFLAPI *LPFN_gflGetVersion)( void ); 
typedef void (GFLAPI *LPFN_gflLibraryExit)( void ); 
typedef GFL_ERROR (GFLAPI *LPFN_gflLibraryInit)( void );
typedef GFL_ERROR (GFLAPI *LPFN_gflLoadBitmap)( const char* filename, GFL_BITMAP** bitmap, const GFL_LOAD_PARAMS* params, GFL_FILE_INFORMATION* info ); 
typedef GFL_ERROR (GFLAPI *LPFN_gflLoadBitmapW)( const wchar_t* filename, GFL_BITMAP** bitmap, const GFL_LOAD_PARAMS* params, GFL_FILE_INFORMATION* info ); 
typedef GFL_ERROR (GFLAPI *LPFN_gflLoadThumbnail)( const char* filename, GFL_INT32 width, GFL_INT32 height, GFL_BITMAP** bitmap, const GFL_LOAD_PARAMS* params, GFL_FILE_INFORMATION* info ); 
typedef GFL_ERROR (GFLAPI *LPFN_gflLoadThumbnailW)( const wchar_t* filename, GFL_INT32 width, GFL_INT32 height, GFL_BITMAP** bitmap, const GFL_LOAD_PARAMS* params, GFL_FILE_INFORMATION* info ); 
typedef GFL_ERROR (GFLAPI *LPFN_gflLoadBitmapFromHandle)( GFL_HANDLE handle, GFL_BITMAP** bitmap, const GFL_LOAD_PARAMS* params, GFL_FILE_INFORMATION* info ); 
typedef GFL_ERROR (GFLAPI *LPFN_gflLoadThumbnailFromHandle)( GFL_HANDLE handle, GFL_INT32 width, GFL_INT32 height, GFL_BITMAP** bitmap, const GFL_LOAD_PARAMS* params, GFL_FILE_INFORMATION *info ); 

// Wrapper Object
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

	CteWO(LPWSTR lpLib);
	~CteWO();

	VOID Close();
	VOID SetBitmapToObject(IUnknown *punk, GFL_BITMAP *gflBM, GFL_ERROR iResult);
	
	HMODULE		m_hDll;
	BSTR		m_bsLib;
	LPFN_gflFreeBitmap					m_gflFreeBitmap;
	LPFN_gflGetDefaultLoadParams		m_gflGetDefaultLoadParams;
	LPFN_gflGetDefaultThumbnailParams m_gflGetDefaultThumbnailParams;
	LPFN_gflGetErrorString				m_gflGetErrorString;
	LPFN_gflGetVersion					m_gflGetVersion;
	LPFN_gflLibraryExit					m_gflLibraryExit;
	LPFN_gflLibraryInit					m_gflLibraryInit;
	LPFN_gflLoadBitmap					m_gflLoadBitmap;
	LPFN_gflLoadBitmapW					m_gflLoadBitmapW;
	LPFN_gflLoadThumbnail				m_gflLoadThumbnail;
	LPFN_gflLoadThumbnailW				m_gflLoadThumbnailW;
	LPFN_gflLoadBitmapFromHandle		m_gflLoadBitmapFromHandle;
	LPFN_gflLoadThumbnailFromHandle		m_gflLoadThumbnailFromHandle;
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
