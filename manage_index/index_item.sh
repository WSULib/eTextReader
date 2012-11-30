#This script is designed to index entire items (with a unique ItemID) into Solr.
# This includes:
#	root/[ItemID}_metadata.xml
#	OCR/[ItemID]*.htm (these are indexed as text for search)

#Usage:
#index_item.sh [ItemID - where assumed to be in /var/www/data directory] 

#index Item metadata file
curl 'http://141.217.54.38:8080/solr/update' -H 'Content-type:text/xml' --data-binary "@../data/$1/$1_metadata.xml"
curl 'http://141.217.54.38:8080/solr/update' -H 'Content-type:text/xml' --data-binary "<commit/>"

#Index /OCR directory of HTML files
for file in ../data/$1/OCR/*.htm
do
	if [ -z "$index" ]; then
		let index=1		
		curl 'http://141.217.54.38:8080/solr/update/extract?&literal.id='$1_OCR_HTML_$index'&literal.ItemID='$1'&literal.page_num='$index'&fmap.content=OCR_text' -F "myfile=@"$file	
		let index=index+1
	else		
		curl 'http://141.217.54.38:8080/solr/update/extract?&literal.id='$1_OCR_HTML_$index'&literal.ItemID='$1'&literal.page_num='$index'&fmap.content=OCR_text' -F "myfile=@"$file	
		let index=index+1
	fi
done

#commit changes
curl 'http://141.217.54.38:8080/solr/update' -H 'Content-type:text/xml' --data-binary "<commit/>"

	
	



	






