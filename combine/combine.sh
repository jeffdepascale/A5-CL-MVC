cd ..
: ------------------ build tags -----------------
: sed -i.bak "s|{BUILD_DATE}|`date '+%m/%d/%y'`|g" ./src/main.js
: sed -i.bak "s|{BUILD_NUMBER}|$1|g" ./src/main.js

: -------------------- index --------------------
echo -e "<!DOCTYPE html>\n\n<html>\n\t<head>\n\t\t<meta name=\"viewport\" content=\"width=device-width, minimum-scale=1, maximum-scale=1\"/>" > ./bin/index.html

: -------------------- MVC --------------------
echo "" >> ./bin/index.html
echo -e "\t\t<!-- CL MVC -->" >> ./bin/index.html

echo "" > ./bin/combine.temp.js
cat ./combine/closures/pluginopen.txt >> ./bin/combine.temp.js
while read line
do
	cat $line >> ./bin/combine.temp.js
	echo -e "\n" >> ./bin/combine.temp.js
	echo -e '\t\t<script src="'$line'" type="text/javascript"></script>' >> ./bin/index.html
done < ./combine/files.txt
cat ./combine/closures/pluginclose.txt >> ./bin/combine.temp.js

java -jar ./combine/yuicompressor-2.4.2.jar ./bin/combine.temp.js -o ./bin/combine-min.temp.js --charset utf-8
cat ./combine/copyrights.txt ./bin/combine.temp.js > ./bin/A5-CL-MVC.js
cat ./combine/copyrights.txt ./bin/combine-min.temp.js > ./bin/A5-CL-MVC-min.js
rm ./bin/combine.temp.js
rm ./bin/combine-min.temp.js
gzip -c ./bin/A5-CL-MVC-min.js > ./bin/A5-CL-MVC-min.js.gz
: -------------------- index close--------------------
echo -e '<body>\n\t</body>\n</html>' >> ./bin/index.html