del tgflsdk.ncb
attrib -h tgflsdk.suo
del tgflsdk.suo
del /q tgflsdk\tgflsdk.vcproj.*.user
del /q Debug\tgflsdk*.*
del /q tgflsdk\Debug\*
rmdir tgflsdk\Debug
del /q Release\*
rmdir Release
del /q tgflsdk\Release\*
rmdir tgflsdk\Release
del /q /s x64\Release\*
rmdir x64\Release
del /q /s x64\Debug\*
rmdir x64\Debug
rmdir x64
del /q /s tgflsdk\x64\*
rmdir tgflsdk\x64\Release
rmdir tgflsdk\x64\Debug
rmdir tgflsdk\x64
del /q /s *.sdf
rmdir /q /s ipch
