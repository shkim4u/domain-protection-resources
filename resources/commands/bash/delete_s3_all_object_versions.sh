#!/bin/bash
# References:
# - https://github.com/aws/aws-cli/issues/651
# - https://gist.github.com/weavenet/f40b09847ac17dd99d16
# - https://stackoverflow.com/questions/29809105/how-do-i-delete-a-versioned-bucket-in-aws-s3-using-the-cli

bucket=$1

set -e

echo "Removing all versions from $bucket"

versions=`aws s3api list-object-versions --bucket $bucket |jq '.Versions'`
markers=`aws s3api list-object-versions --bucket $bucket |jq '.DeleteMarkers'`

echo "removing files"
for version in $(echo "${versions}" | jq -r '.[] | @base64'); do
    version=$(echo ${version} | base64 --decode)

    key=`echo $version | jq -r .Key`
    versionId=`echo $version | jq -r .VersionId `
    cmd="aws s3api delete-object --bucket $bucket --key $key --version-id $versionId"
    echo $cmd
    $cmd
done

echo "removing delete markers"
for marker in $(echo "${markers}" | jq -r '.[] | @base64'); do
    marker=$(echo ${marker} | base64 --decode)

    key=`echo $marker | jq -r .Key`
    versionId=`echo $marker | jq -r .VersionId `
    cmd="aws s3api delete-object --bucket $bucket --key $key --version-id $versionId"
    echo $cmd
    $cmd
done
