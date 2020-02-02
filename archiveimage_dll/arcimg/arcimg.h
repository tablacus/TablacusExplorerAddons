#include <shobjidl.h>
#include <Shlobj.h>
#include <shlwapi.h>
#pragma comment(lib, "shlwapi.lib")

const CLSID CLSID_CompressedFolder = {0xE88DCCE0, 0xB7B3, 0x11d1, { 0xA9, 0xF0, 0x00, 0xAA, 0x00, 0x60, 0xFA, 0x31}};

//DLL
typedef HRESULT (STDAPICALLTYPE * LPFNDllGetClassObject)(REFCLSID rclsid, REFIID riid, LPVOID* ppv);
typedef HRESULT (STDAPICALLTYPE * LPFNDllCanUnloadNow)(void);
