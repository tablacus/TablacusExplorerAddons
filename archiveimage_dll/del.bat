del arcimg.ncb
attrib -h arcimg.suo
del arcimg.suo
del /q arcimg\arcimg.vcproj.*.user
del /q Debug\arcimg*.*
del /q arcimg\Debug\*
rmdir arcimg\Debug
del /q Release\*
rmdir Release
del /q arcimg\Release\*
rmdir arcimg\Release
del /q /s x64\Release\*
rmdir x64\Release
del /q /s x64\Debug\*
rmdir x64\Debug
rmdir x64
del /q /s arcimg\x64\*
rmdir arcimg\x64\Release
rmdir arcimg\x64\Debug
rmdir arcimg\x64
del /q /s *.sdf
rmdir /q /s ipch
rmdir /q /s .vs
rmdir /q /s Debug
