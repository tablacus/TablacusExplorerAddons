del tsaa.ncb
attrib -h tsaa.suo
del tsaa.suo
del /q tsaa\tsaa.vcproj.*.user
del /q Debug\tsaa*.*
del /q tsaa\Debug\*
rmdir tsaa\Debug
del /q Release\*
rmdir Release
del /q tsaa\Release\*
rmdir tsaa\Release
del /q /s x64\Release\*
rmdir x64\Release
del /q /s x64\Debug\*
rmdir x64\Debug
rmdir x64
del /q /s tsaa\x64\*
rmdir tsaa\x64\Release
rmdir tsaa\x64\Debug
rmdir tsaa\x64
del /q /s *.sdf
rmdir /q /s ipch
rmdir /q /s .vs
rmdir /q /s Debug
