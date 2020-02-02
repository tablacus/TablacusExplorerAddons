del thumb.ncb
attrib -h thumb.suo
del thumb.suo
del /q thumb\thumb.vcproj.*.user
del /q Debug\thumb*.*
del /q thumb\Debug\*
rmdir thumb\Debug
del /q Release\*
rmdir Release
del /q thumb\Release\*
rmdir thumb\Release
del /q /s x64\Release\*
rmdir x64\Release
del /q /s x64\Debug\*
rmdir x64\Debug
rmdir x64
del /q /s thumb\x64\*
rmdir thumb\x64\Release
rmdir thumb\x64\Debug
rmdir thumb\x64
del /q /s *.sdf
rmdir /q /s ipch
rmdir /q /s .vs
rmdir /q /s Debug
