del twlx.ncb
attrib -h twlx.suo
del twlx.suo
del /q twlx\twlx.vcproj.*.user
del /q Debug\twlx*.*
del /q twlx\Debug\*
rmdir twlx\Debug
del /q Release\*
rmdir Release
del /q twlx\Release\*
rmdir twlx\Release
del /q /s x64\Release\*
rmdir x64\Release
del /q /s x64\Debug\*
rmdir x64\Debug
rmdir x64
del /q /s twlx\x64\*
rmdir twlx\x64\Release
rmdir twlx\x64\Debug
rmdir twlx\x64
del /q /s *.sdf
rmdir /q /s ipch
