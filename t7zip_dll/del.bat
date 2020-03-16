del t7z.ncb
attrib -h t7z.suo
del t7z.suo
del /q t7z\t7z.vcproj.*.user
del /q Debug\t7z*.*
del /q t7z\Debug\*
rmdir t7z\Debug
del /q Release\*
rmdir Release
del /q t7z\Release\*
rmdir t7z\Release
del /q /s x64\Release\*
rmdir x64\Release
del /q /s x64\Debug\*
rmdir x64\Debug
rmdir x64
del /q /s t7z\x64\*
rmdir t7z\x64\Release
rmdir t7z\x64\Debug
rmdir t7z\x64
del /q /s *.sdf
rmdir /q /s ipch
rmdir /q /s Debug
rmdir /q /s t7z\C
rmdir /q /s t7z\CPP
