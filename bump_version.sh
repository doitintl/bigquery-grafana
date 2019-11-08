FROMV=`git describe --tags --abbrev=0`
TOV=`git describe --tags --abbrev=0 | awk -F. '{$NF+=1; OFS="."; print $0}'`
sed -i 's/'"$FROMV"'/'"$TOV"'/g' INSTALL.md
sed -i 's/'"$FROMV"'/'"$TOV"'/g' src/plugin.json
