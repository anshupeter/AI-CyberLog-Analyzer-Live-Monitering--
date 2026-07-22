npm install > install_out.txt 2>&1
echo Installed Root >> install_out.txt
cd server
npm install >> ../install_out.txt 2>&1
echo Installed Server >> ../install_out.txt
cd ../client
npm install >> ../install_out.txt 2>&1
echo Installed Client >> ../install_out.txt