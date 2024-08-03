#!/bin/bash

route="http://localhost:1299/api/shorten"

if [[ $# -lt 1 ]] 
then
    # not enough argument ; print usage and exit 1
    echo "Usage: ./urlshortener.sh [ url ]"
    exit 1
fi

url_to_shorten="$1"

curl -X POST -H "Content-Type: application/json" -d '{"url":"'$url_to_shorten'"}' $route