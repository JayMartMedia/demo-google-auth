export function removeMatchesFromImmutableArray (arr: Array<any>, predicate: (any) => boolean): void {
    let index: number = 0;
    while(index < arr.length){
        const item = arr[index]
        if(predicate(item)){
            arr.splice(index, 1);
        }else{
            index += 1;
        }
    }
}