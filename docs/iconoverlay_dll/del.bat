del ticonoverlay.ncb
attrib -h ticonoverlay.suo
del ticonoverlay.suo
del /q ticonoverlay\ticonoverlay.vcproj.*.user
del /q Debug\ticonoverlay*.*
del /q ticonoverlay\Debug\*
rmdir ticonoverlay\Debug
del /q Release\*
rmdir Release
del /q ticonoverlay\Release\*
rmdir ticonoverlay\Release
del /q /s x64\Release\*
rmdir x64\Release
del /q /s x64\Debug\*
rmdir x64\Debug
rmdir x64
del /q /s ticonoverlay\x64\*
rmdir ticonoverlay\x64\Release
rmdir ticonoverlay\x64\Debug
rmdir ticonoverlay\x64
del /q /s *.sdf
rmdir /q /s ipch
