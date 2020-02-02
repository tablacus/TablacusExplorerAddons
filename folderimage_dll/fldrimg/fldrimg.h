#include <shobjidl.h>
#include <Shlobj.h>
#include <shlwapi.h>
#pragma comment (lib, "shlwapi.lib")
#include <list>

//Plug in(Image)
typedef HRESULT (WINAPI* LPFNGetImage)(IStream *pStream, LPCWSTR lpPath, int cx, HBITMAP *phBM, int *pnAlpha);
