function removeMatchesFromImmutableArray(arr, predicate){
    let index = 0;
    while(index < arr.length){
        const item = arr[index]
        if(predicate(item)){
            arr.splice(index, 1);
        }else{
            index += 1;
        }
    }
}

module.exports = {
  removeMatchesFromImmutableArray
};