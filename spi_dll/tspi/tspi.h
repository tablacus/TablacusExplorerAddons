#include "resource.h"
#include <windows.h>
#include <dispex.h>
#include <shlwapi.h>
#pragma comment (lib, "shlwapi.lib")

#define MAX_OBJ 256
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

// Susie Plug-in error code
#define SPI_NO_FUNCTION			-1
#define SPI_ALL_RIGHT			0
#define SPI_ABORT				1
#define SPI_NOT_SUPPORT			2
#define SPI_OUT_OF_ORDER		3
#define SPI_NO_MEMORY			4
#define SPI_MEMORY_ERROR		5
#define SPI_FILE_READ_ERROR		6
#define	SPI_WINDOW_ERROR		7
#define SPI_OTHER_ERROR			8
#define	SPI_FILE_WRITE_ERROR	9
#define	SPI_END_OF_FILE			10

// Susie Plug-in time
typedef ULONG_PTR susie_time_t;

// Susie Plug-in consts
#pragma pack(push,1)
typedef struct {
	unsigned char  method[8];
	ULONG_PTR      position;
	ULONG_PTR      compsize;
	ULONG_PTR      filesize;
	susie_time_t   timestamp;
	char           path[200];
	char           filename[200];
	unsigned long  crc;
	#ifdef _WIN64
	   char        dummy[4];
	#endif
} SUSIE_FINFO;
#pragma pack(pop)

typedef struct {
	unsigned char	method[8];
	ULONG_PTR		position;
	ULONG_PTR		compsize;
	ULONG_PTR		filesize;
	susie_time_t	timestamp;
	WCHAR			path[200];
	WCHAR			filename[200];
	unsigned long	crc;
}SUSIE_FINFOTW;

#pragma pack(push,1)
typedef struct PictureInfo{
	long    left,top;
	long    width;
	long    height;
	WORD    x_density;
	WORD    y_density;
	short   colorDepth;
	#ifdef _WIN64
	  char  dummy[2];
	#endif
	HLOCAL  hInfo;
} SUSIE_PICTUREINFO;
#pragma pack(pop)

// Susie Plug-in calback
typedef int (__stdcall *SUSIE_PROGRESS)(int nNum, int nDenom, LONG_PTR lData);

// Susie Plug-in functions
typedef int (__stdcall *LPFN_GetPluginInfo)(int infono, LPSTR buf, int buflen);
typedef int (__stdcall *LPFN_GetPluginInfoW)(int infono, LPWSTR buf, int buflen);
typedef int (__stdcall *LPFN_IsSupportedW)(LPCWSTR filename, void *dw);
typedef int (__stdcall *LPFN_IsSupported)(LPCSTR filename, void *dw);
typedef int (__stdcall *LPFN_GetPictureInfo)(LPSTR buf, LONG_PTR len, unsigned int flag, PictureInfo *lpInfo);
typedef int (__stdcall *LPFN_GetPictureInfoW)(LPWSTR buf, LONG_PTR len, unsigned int flag, PictureInfo *lpInfo);
typedef int (__stdcall *LPFN_GetPicture)(LPSTR buf, LONG_PTR len, unsigned int flag, HLOCAL *pHBInfo, HLOCAL *pHBm, SUSIE_PROGRESS lpPrgressCallback, LONG_PTR lData);
typedef int (__stdcall *LPFN_GetPictureW)(LPWSTR buf, LONG_PTR len, unsigned int flag, HLOCAL *pHBInfo, HLOCAL *pHBm, SUSIE_PROGRESS lpPrgressCallback, LONG_PTR lData);
typedef int (__stdcall *LPFN_GetPreview)(LPSTR buf, LONG_PTR len, unsigned int flag, HLOCAL *pHBInfo, HLOCAL *pHBm, SUSIE_PROGRESS lpPrgressCallback, LONG_PTR lData);
typedef int (__stdcall *LPFN_GetPreviewW)(LPWSTR buf, LONG_PTR len, unsigned int flag, HLOCAL *pHBInfo, HLOCAL *pHBm, SUSIE_PROGRESS lpPrgressCallback, LONG_PTR lData);
typedef int (__stdcall *LPFN_GetArchiveInfo)(LPCSTR buf, LONG_PTR len, unsigned int flag, HLOCAL *lphInf);
typedef int (__stdcall *LPFN_GetArchiveInfoW)(LPCWSTR buf, LONG_PTR len, unsigned int flag, HLOCAL *lphInf);
typedef int (__stdcall *LPFN_GetFileInfo)(LPCSTR buf, LONG_PTR len, LPCSTR filename, unsigned int flag, SUSIE_FINFO *lpInfo);
typedef int (__stdcall *LPFN_GetFileInfoW)(LPCWSTR buf, LONG_PTR len, LPCWSTR filename, unsigned int flag, SUSIE_FINFOTW *lpInfo);
typedef int (__stdcall *LPFN_GetFile)(LPCSTR src, LONG_PTR len, LPSTR dest, unsigned int flag, SUSIE_PROGRESS progressCallback, LONG_PTR lData);
typedef int (__stdcall *LPFN_GetFileW)(LPCWSTR src, LONG_PTR len, LPWSTR dest, unsigned int flag, SUSIE_PROGRESS progressCallback, LONG_PTR lData);
typedef int (__stdcall *LPFN_ConfigurationDlg)(HWND parent, int fnc);

// Susie Plug-in Wrapper Object
class CteSPI : public IDispatch
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

	CteSPI(HMODULE hDll, LPWSTR lpLib);
	~CteSPI();

	VOID Close();
	VOID SetChangeVolProc(HANDLE hArcData);
	VOID SetProcessDataProc(HANDLE hArcData);

	LPFN_GetPluginInfo GetPluginInfo;
	LPFN_GetPluginInfoW GetPluginInfoW;
	LPFN_IsSupported IsSupported;
	LPFN_IsSupportedW IsSupportedW;
	LPFN_GetPictureInfo GetPictureInfo;
	LPFN_GetPictureInfoW GetPictureInfoW;
	LPFN_GetPicture GetPicture;
	LPFN_GetPictureW GetPictureW;
	LPFN_GetPreview GetPreview;
	LPFN_GetPreviewW GetPreviewW;
	LPFN_GetArchiveInfo GetArchiveInfo;
	LPFN_GetArchiveInfoW GetArchiveInfoW;
	LPFN_GetFileInfo GetFileInfo;
	LPFN_GetFileInfoW GetFileInfoW;
	LPFN_GetFile GetFile;
	LPFN_GetFileW GetFileW;
	LPFN_ConfigurationDlg ConfigurationDlg;

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
