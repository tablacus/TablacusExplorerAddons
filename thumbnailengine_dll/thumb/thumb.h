#include <shobjidl.h>
#include <Shlobj.h>
#include <Thumbcache.h>
#include <shlwapi.h>
#pragma comment (lib, "shlwapi.lib")
#include <list>

#ifndef CLSID_PhotoThumbnailProvider
CLSID CLSID_PhotoThumbnailProvider          = {0xC7657C4A, 0x9F68, 0x40fa, { 0xA4, 0xDF, 0x96, 0xBC, 0x08, 0xEB, 0x35, 0x51}};
#endif

//Plug in(Image)
typedef HRESULT (WINAPI* LPFNGetImage)(IStream *pStream, LPCWSTR lpPath, int cx, HBITMAP *phBM, int *pnAlpha);
