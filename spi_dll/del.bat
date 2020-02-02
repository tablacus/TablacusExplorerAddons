del tspi.ncb
attrib -h tspi.suo
del tspi.suo
del /q tspi\tspi.vcproj.*.user
del /q Debug\tspi*.*
del /q tspi\Debug\*
rmdir tspi\Debug
del /q Release\*
rmdir Release
del /q tspi\Release\*
rmdir tspi\Release
del /q /s x64\Release\*
rmdir x64\Release
del /q /s x64\Debug\*
rmdir x64\Debug
rmdir x64
del /q /s tspi\x64\*
rmdir tspi\x64\Release
rmdir tspi\x64\Debug
rmdir tspi\x64
del /q /s *.sdf
rmdir /q /s ipch
rmdir /q /s .vs
rmdir /q /s Debug
